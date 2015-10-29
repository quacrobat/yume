/**
 * @file Super-prototype to define a soccer player.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var MESSAGE = require( "../../messaging/Message" );
var eventManager = require( "../../messaging/EventManager" );
var MovingEntity = require( "./MovingEntity" );
var SteeringBehaviors = require( "../steering/SteeringBehaviors" );

/**
 * Creates a soccer player.
 * 
 * @constructor
 * @augments MovingEntity
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {THREE.Object3D} object3D - The 3D object of the player.
 * @param {number} boundingRadius - The bounding radius of the player.
 * @param {Team} team - The player's team.
 * @param {number} homeRegionId - The id of the home region.
 * @param {THREE.Vector3} velocity - The velocity of the entity.
 * @param {number} mass - The mass of the entity.
 * @param {number} maxSpeed - The maximum speed at which this entity may travel.
 * @param {number} maxForce - The maximum force this entity can produce to power itself (think rockets and thrust).
 * @param {number} maxTurnRate - The maximum rate (radians per second) at which this vehicle can rotate.
 * @param {number} role - The role of the player.
 */
function PlayerBase( entityManager, object3D, boundingRadius, team, homeRegionId, velocity, mass, maxSpeed, maxForce, maxTurnRate, role ) {

	MovingEntity.call( this, entityManager, object3D, boundingRadius, velocity, mass, maxSpeed, maxForce, maxTurnRate );

	Object.defineProperties( this, {
		// player's role in the team
		role : {
			value : role,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// a reference to the player's team
		team : {
			value : team,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// a reference to the soccer pitch
		pitch : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// a reference to the soccer ball
		ball : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the id of the region that this player is assigned to
		homeRegionId : {
			value : homeRegionId,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the steering behaviors
		steering : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the distance to the ball (in squared-space). This value is queried
		// a lot so it's calculated once each time-step and stored here
		distanceSqToBall : {
			value : Infinity,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the id of the region this player moves to before kickoff
		_defaultRegionId : {
			value : homeRegionId,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_arrowHelper : {
			value :  new THREE.ArrowHelper( new THREE.Vector3(), new THREE.Vector3(), 5, 0xf3f4f6 ),
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );
	
	// set references for pitch and ball
	this.pitch = this.team.pitch;
	this.ball = this.team.pitch.ball;

	// setup steering behaviors
	this.steering = new SteeringBehaviors( this, this.ball, this.pitch );
}

PlayerBase.prototype = Object.create( MovingEntity.prototype );
PlayerBase.prototype.constructor = PlayerBase;

/**
 * Determines the player who is closest to the support spot and messages him to
 * change state to "SupportAttacker".
 */
PlayerBase.prototype.findSupport = function() {

	// if there is no support, make "bestSupportPlayer" to the new supporting player
	if ( this.team.supportingPlayer === null )
	{
		this.team.supportingPlayer = this.team.calculateBestSupportingAttacker();
		
		// inform the new supporting player to support the attacking player
		eventManager.sendMessageToEntitySync( this.id, this.team.supportingPlayer.id, MESSAGE.SUPPORT_ATTACKER );
		
		return;
	}
	
	// calculate best supporting player for attacking
	var bestSupportPlayer = this.team.calculateBestSupportingAttacker();

	// if the best player available to support the attacker changes, update the
	// pointers and send messages to the relevant players to update their states
	if ( bestSupportPlayer !== null && bestSupportPlayer !== this.team.supportingPlayer )
	{
		// the previous supporting player can return to his home region
		eventManager.sendMessageToEntitySync( this.id, this.team.supportingPlayer.id, MESSAGE.GO_HOME );
		
		// assign the new supporting player and inform it
		this.team.supportingPlayer = bestSupportPlayer;
		
		// inform the new supporting player to support the attacking player
		eventManager.sendMessageToEntitySync( this.id, this.team.supportingPlayer.id, MESSAGE.SUPPORT_ATTACKER );
	}
};

/**
 * Sets the player's heading to point at the ball.
 */
PlayerBase.prototype.trackBall = function() {

	this.isRotateHeadingToFacePosition( this.ball.object3D.position );
};

/**
 * Sets the player's heading to point at the current target.
 */
PlayerBase.prototype.trackTarget = ( function() {

	var target = new THREE.Vector3();

	return function() {

		target.subVectors( this.steering.target, this.object3D.position ).normalize();

		this.setOrientation( target );
	};

}() );

/**
 * Calculates distance to home opponent's goal. Used frequently by the
 * passing methods.
 * 
 * @returns {number} The distance to the opponent's goal.
 */
PlayerBase.prototype.getDistanceToOppGoal = function() {

	return Math.abs( this.object3D.position.x - this.team.opponentsGoal.center.x );
};

/**
 * Calculates distance to the home goal. Used frequently by the
 * passing methods.
 * 
 * @returns {number} The distance to the home goal.
 */
PlayerBase.prototype.getDistanceToHomeGoal = function() {

	return Math.abs( this.object3D.position.x - this.team.homeGoal.center.x );
};

/**
 * Returns true if there is an opponent within this player's comfort zone.
 * 
 * @returns {boolean} Is the player threatened by an opponent?
 */
PlayerBase.prototype.isThreatened = function() {

	var index, opponent;

	// check against all opponents to make sure non are within this player's
	// comfort zone
	for ( index = 0; index < this.team.opponents.players.length; index++ )
	{
		// buffer opponent
		opponent = this.team.opponents.players[ index ];

		// if opponent is in front of the player and the distance to the
		// opponent is less than our comfort zone, return true
		if ( this.isPositionInFrontOfPlayer( opponent.object3D.position ) && this.object3D.position.distanceToSquared( opponent.object3D.position ) < PlayerBase.CONFIG.PLAYER_COMFORT_ZONE_SQ )
		{
			return true;	
		}
	} // next opponent

	return false;

};

/**
 * Returns true if the subject is within field of view of this player.
 * 
 * @param {THREE.Vector3} position - The position to test.
 * 
 * @returns {boolean} Is the position in front of the player?
 */
PlayerBase.prototype.isPositionInFrontOfPlayer = ( function() {

	var toPosition = new THREE.Vector3();

	return function( position ) {

		toPosition.subVectors( position, this.object3D.position );

		if ( toPosition.dot( this.getDirection() ) > 0 )
		{
			return true;
		}
		else
		{
			return false;
		}
	};

}() );

/**
 * Returns true if the ball can be grabbed by the goalkeeper.
 * 
 * @returns {boolean} Can the ball be grabbed by the goalkeeper?
 */
PlayerBase.prototype.isBallWithinKeeperRange = function() {

	return this.object3D.position.distanceToSquared( this.ball.object3D.position ) < PlayerBase.CONFIG.KEEPER_IN_TARGET_RANGE_SQ;
};

/**
 * Returns true if the ball is within kicking range.
 * 
 * @returns {boolean} Is the ball within kicking range?
 */
PlayerBase.prototype.isBallWithinKickingRange = function() {

	return this.object3D.position.distanceToSquared( this.ball.object3D.position ) < PlayerBase.CONFIG.PLAYER_KICKING_DISTANCE_SQ;
};

/**
 * Returns true if a ball comes within range of a receiver.
 * 
 * @returns {boolean} Is the ball within range of a receiver?
 */
PlayerBase.prototype.isBallWithinReceivingRange = function() {

	return this.object3D.position.distanceToSquared( this.ball.object3D.position ) < PlayerBase.CONFIG.PLAYER_RECEIVING_RANGE_SQ;
};

/**
 * Returns true if the player is located within the boundaries of his home
 * region.
 * 
 * @returns {number} The distance to the home goal.
 */
PlayerBase.prototype.isInHomeRegion = function() {

	if ( this.role === PlayerBase.ROLE.GOAL_KEEPER )
	{
		return this.getHomeRegion().isInside( this.object3D.position, false );
	}
	else
	{
		return this.getHomeRegion().isInside( this.object3D.position, true );
	}
};

/**
 * Returns true if this player is ahead of the attacker.
 * 
 * @returns {boolean} Is the player ahead of the attacker?
 */
PlayerBase.prototype.isAheadOfAttacker = function() {
	
	return this.getDistanceToOppGoal() < Math.abs( this.team.controllingPlayer.object3D.position.x - this.team.opponentsGoal.center.x );
};

/**
 * Returns true if the player is located at his steering target.
 * 
 * @returns {boolean} Is the player located at his steering target?
 */
PlayerBase.prototype.isAtTarget = function() {

	return this.object3D.position.distanceToSquared( this.steering.target ) < PlayerBase.CONFIG.PLAYER_IN_TARGET_RANGE_SQ;
};

/**
 * Returns true if the player is the closest player in his team to the ball.
 * 
 * @returns {boolean} Is the player the closest player in his team to the ball?
 */
PlayerBase.prototype.isClosestTeamMemberToBall = function() {

	return this === this.team.playerClosestToBall;
};

/**
 * Returns true if the player is the closest player on the pitch to the ball.
 * 
 * @returns {boolean} Is the player the closest player on the pitch to the ball?
 */
PlayerBase.prototype.isClosestPlayerOnPitchToBall = function() {

	return this.isClosestTeamMemberToBall() && this.distanceSqToBall < this.team.opponents.distSqToBallOfClosestPlayer;
};

/**
 * Checks if this player is the current controlling player.
 * 
 * @returns {boolean} Is the player the current controlling player?
 */
PlayerBase.prototype.isControllingPlayer = function() {

	return this === this.team.controllingPlayer;
};

/**
 * Returns true if the player is located in the designated "hot region" -- the
 * area close to the opponent's goal.
 * 
 * @returns {boolean} Is the player in the hot region?
 */
PlayerBase.prototype.isInHotRegion = function() {

	return this.getDistanceToOppGoal() < this.pitch.playingArea.length / 3;
};

/**
 * Sets the home region id to the default region id.
 */
PlayerBase.prototype.setDefaultHomeRegion = function() {

	this.homeRegionId = this._defaultRegionId;
};

/**
 * Returns the home region of the player.
 * 
 * @returns {Region} Player's home region.
 */
PlayerBase.prototype.getHomeRegion = function() {

	return this.pitch.getRegionById( this.homeRegionId );
};

PlayerBase.CONFIG = {

	// the goalkeeper has to be this close to the ball to be able to interact with it
	KEEPER_IN_TARGET_RANGE : 2,
	
	// when the ball becomes within this distance of the goalkeeper he changes state to intercept the ball
	KEEPER_INTERCEPT_RANGE : 15,
	
	// this is the distance the keeper puts between the back of the net and the ball when using the interpose steering behavior
	KEEPER_TENDING_DISTANCE : 4,
	
	// the minimum distance a player must be from the goalkeeper before it will pass the ball
	KEEPER_MIN_PASS_DISTANCE: 5,

	// how close the ball must be to a receiver before he starts chasing it
	PLAYER_RECEIVING_RANGE : 2,
	
	// the player has to be this close to the ball to be able to interact with it
	PLAYER_IN_TARGET_RANGE : 2,

	// player has to be this close to the ball to be able to kick it. The higher
	// the value this gets, the easier it gets to tackle.
	PLAYER_KICKING_DISTANCE : 1.5,
	
	// the number of times a player can kick the ball per second
	PLAYER_KICK_FREQUENCY : 8,
	
	// the radius in which a pass in dangerous
	PLAYER_PASS_THREAD_RADIUS: 15,
	
	// the number of times the player attempts to find a valid shot
	PLAYER_NUM_ATTEMPTS_TO_FIND_VALID_STRIKE : 5,

	// when an opponents comes within this range the player will attempt to pass
	// the ball. Players tend to pass more often, the higher the value
	PLAYER_COMFORT_ZONE : 10,
	
	// this force decelerates the player if the steering force has a zero length
	PLAYER_BRAKING_RATE: 0.8,
	
	//this is the chance that a player will receive a pass using the "arrive" steering behavior, rather than "pursuit"
	PLAYER_CHANCE_OF_USING_ARRIVE_TYPE_RECEIVE_BEHAVIOR : 0.5,
	
	// the chance a player might take a random pot shot at the goal
	PLAYER_CHANCE_ATTEMPT_POT_SHOT: 0.005,
	
	// the minimum distance a receiving player must be from the passing player
	PLAYER_MIN_PASS_DISTANCE: 15,

	// physics
	PLAYER_MASS : 1,
	PLAYER_RADIUS : 1,
	PLAYER_MAX_SPEED_WITH_BALL : 0.085,
	PLAYER_MAX_SPEED_WITHOUT_BALL : 0.11,
	PLAYER_MAX_FORCE : 1.0,
	PLAYER_MAX_TURN_RATE : 0.1,
	PLAYER_MAX_DRIBBLE_FORCE : 0.18,
	PLAYER_MAX_DRIBBLE_AND_TURN_FORCE : 0.12,
	PLAYER_MAX_SHOOTING_FORCE : 0.8,
	PLAYER_MAX_PASSING_FORCE : 0.5
};

// buffer squared values
PlayerBase.CONFIG.KEEPER_IN_TARGET_RANGE_SQ = PlayerBase.CONFIG.KEEPER_IN_TARGET_RANGE * PlayerBase.CONFIG.KEEPER_IN_TARGET_RANGE;
PlayerBase.CONFIG.KEEPER_INTERCEPT_RANGE_SQ = PlayerBase.CONFIG.KEEPER_INTERCEPT_RANGE * PlayerBase.CONFIG.KEEPER_INTERCEPT_RANGE;
PlayerBase.CONFIG.PLAYER_IN_TARGET_RANGE_SQ = PlayerBase.CONFIG.PLAYER_IN_TARGET_RANGE * PlayerBase.CONFIG.PLAYER_IN_TARGET_RANGE;
PlayerBase.CONFIG.PLAYER_RECEIVING_RANGE_SQ = PlayerBase.CONFIG.PLAYER_RECEIVING_RANGE * PlayerBase.CONFIG.PLAYER_RECEIVING_RANGE;
PlayerBase.CONFIG.PLAYER_KICKING_DISTANCE_SQ = PlayerBase.CONFIG.PLAYER_KICKING_DISTANCE * PlayerBase.CONFIG.PLAYER_KICKING_DISTANCE;
PlayerBase.CONFIG.PLAYER_COMFORT_ZONE_SQ = PlayerBase.CONFIG.PLAYER_COMFORT_ZONE * PlayerBase.CONFIG.PLAYER_COMFORT_ZONE;

PlayerBase.ROLE = {
	GOAL_KEEPER : 0,
	ATTACKER : 1,
	DEFENDER : 2
};

module.exports = PlayerBase;
