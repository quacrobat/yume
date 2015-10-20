/**
 * @file Prototype to define a soccer team.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var world = require( "../../core/World" );
var MESSAGE = require( "../../messaging/Message" );
var eventManager = require( "../../messaging/EventManager" );

var GameEntity = require( "./GameEntity" );
var PlayerBase = require( "./PlayerBase" );
var GoalKeeper = require( "./GoalKeeper" );
var FieldPlayer = require( "./FieldPlayer" );
var SupportSpotCalculator = require( "./SupportSpotCalculator" );

var StateMachine = require( "../fsm/StateMachine" );
var GoalKeeperStates = require( "../fsm/GoalKeeperStates" );
var FieldPlayerStates = require( "../fsm/FieldPlayerStates" );
var TeamStates = require( "../fsm/TeamStates" );

/**
 * Creates a soccer team.
 * 
 * @constructor
 * @augments GameEntity
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {Goal} homeGoal - The home goal of the team.
 * @param {Goal} opponentsGoal - The goal of the opponents.
 * @param {Pitch} pitch - A reference to the soccer pitch.
 * @param {number} color - The color of the team.
 */
function Team( entityManager, homeGoal, opponentsGoal, pitch, color ) {

	GameEntity.call( this, entityManager );

	Object.defineProperties( this, {
		stateMachine : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		players : {
			value : [],
			configurable : false,
			enumerable : true,
			writable : false
		},
		homeGoal : {
			value : homeGoal,
			configurable : false,
			enumerable : true,
			writable : false
		},
		opponentsGoal : {
			value : opponentsGoal,
			configurable : false,
			enumerable : true,
			writable : false
		},
		opponents : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		pitch : {
			value : pitch,
			configurable : false,
			enumerable : true,
			writable : false
		},
		color : {
			value : color,
			configurable : false,
			enumerable : true,
			writable : false
		},
		// references to "key" players
		controllingPlayer : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		supportingPlayer : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		receivingPlayer : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		playerClosestToBall : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the squared distance the closest player is from the ball
		distSqToBallOfClosestPlayer : {
			value : Infinity,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// players use this to determine strategic positions on the playing
		// field
		_supportSpotCalculator : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// setup the state machine
	this.stateMachine = new StateMachine( this );
	this.stateMachine.currentState = TeamStates.Defending;
	this.stateMachine.previousState = TeamStates.Defending;

	// create the players and goalkeeper
	this._createPlayers();

	// create the spot calculator
	if ( this.color === Team.RED )
	{
		this._supportSpotCalculator = new SupportSpotCalculator( this, true );
	}
	else
	{
		this._supportSpotCalculator = new SupportSpotCalculator( this, false );
	}
}

Team.prototype = Object.create( GameEntity.prototype );
Team.prototype.constructor = Team;

/**
 * Iterates through each player's update function and calculates frequently
 * accessed info.
 */
Team.prototype.update = function() {
	
	var index;

	// this information is used frequently so it's more efficient to
	// calculate it just once each frame
	this._calculateClosestPlayerToBall();

	// the team state machine switches between attack/defense behavior. It
	// also handles the "kick off" state where a team must return to their
	// kick off positions before the whistle is blown
	this.stateMachine.update();

	// now update each player
	for ( index = 0; index < this.players.length; index++ )
	{
		this.players[ index ].update();
	}

};

/**
 * This method updates the steering targets of waiting field players.
 */
Team.prototype.updateTargetsOfWaitingPlayers = function() {

	var index, player;

	// now update each player
	for ( index = 0; index < this.players.length; index++ )
	{
		player = this.players[ index ];

		if ( player.role !== PlayerBase.ROLE.GOAL_KEEPER )
		{
			if ( player.stateMachine.isInState( FieldPlayerStates.Wait ) || player.stateMachine.isInState( FieldPlayerStates.ReturnToHomeRegion ) )
			{
				player.steering.target.copy( player.getHomeRegion().center );
			}
		}
	}

};

/**
 * Calculates the closest player to the supporting spot.
 * 
 * @returns {FieldPlayer} The best supporting attacker.
 */
Team.prototype.calculateBestSupportingAttacker = function() {

	var index, player, distance;

	// this will track the closest distance to the "best supporting spot"
	var closestSoFar = Infinity;

	// this will track the best supporting attacker
	var bestPlayer = null;

	for ( index = 0; index < this.players.length; index++ )
	{
		player = this.players[ index ];

		// only attackers utilize the "best supporting spot"
		if ( player.role === PlayerBase.ROLE.ATTACKER && player !== this.controllingPlayer )
		{
			// calculate the distance between player and supporting spot
			distance = player.object3D.position.distanceToSquared( this._supportSpotCalculator.getBestSupportingSpot() );

			// if the distance is the closest so far and the player is not a
			// goalkeeper and the player is not the one currently
			// controlling the ball, keep a record of this player
			if ( distance < closestSoFar )
			{
				closestSoFar = distance;

				bestPlayer = player;
			}
		}
	}

	return bestPlayer;

};

/**
 * Calculates the best supporting position for attackers.
 */
Team.prototype.calculateBestSupportingPosition = function() {

	this._supportSpotCalculator.calculateBestSupportingPosition();
};

/**
 * Returns the best support spot on the soccer pitch.
 * 
 * @returns {THREE.Vector3} The supporting spot on the soccer pitch.
 */
Team.prototype.getSupportSpot = function() {

	return this._supportSpotCalculator.getBestSupportingSpot();
};

/**
 * This tests to see if a pass is possible between the requester and the
 * controlling player. If it is possible a message is sent to the controlling
 * player to pass the ball.
 * 
 * @param {FieldPlayer} requester - The field player who requests the pass.
 */
Team.prototype.requestPass = function( requester ) {

	// maybe put a restriction here
	if ( Math.random() > 0.1 )
	{
		return;
	}

	// check the safety of the pass
	if ( this.isPassSafeFromAllOpponents( this.controllingPlayer.object3D.position, requester.object3D.position, requester, PlayerBase.CONFIG.PLAYER_MAX_PASSING_FORCE ) )
	{
		// send message to the controlling player
		eventManager.sendMessageToEntitySync( requester.id, this.controllingPlayer.id, MESSAGE.PASS_TO_ME, requester );
	}
};

/**
 * Calling this changes the state of all field players to that of
 * "ReturnToHomeRegion". Mainly used when a goal keeper has possession.
 * 
 * @param {boolean} withGoalKeeper - Should the goalkeeper also go home?
 */
Team.prototype.returnAllFieldPlayersToHome = function( withGoalKeeper ) {

	var index, player;

	for ( index = 0; index < this.players.length; index++ )
	{
		player = this.players[ index ];

		if ( withGoalKeeper === true )
		{
			// send message to each player
			eventManager.sendMessageToEntitySync( this.id, player.id, MESSAGE.GO_HOME );
		}
		else
		{
			if ( player.role !== PlayerBase.ROLE.GOAL_KEEPER )
			{
				// send message to each player
				eventManager.sendMessageToEntitySync( this.id, player.id, MESSAGE.GO_HOME );
			}
		}
	}
};

/**
 * Set the control over the ball to a player in this team.
 * 
 * @param {PlayerBase} player - The player to set.
 */
Team.prototype.setControllingPlayer = function( player ) {

	this.controllingPlayer = player;

	this.opponents.lostControl();
};

/**
 * Use this method to change the home regions of players.
 */
Team.prototype.setupTeamPositions = ( function() {

	// these define the home regions for this state of each of the players
	var blueAttackingRegions = [ 1, 12, 14, 6, 4 ];
	var redAttackingRegions = [ 16, 3, 5, 9, 13 ];

	var blueDefendingRegions = [ 1, 6, 8, 3, 5 ];
	var redDefendingRegions = [ 16, 9, 11, 12, 14 ];

	return function() {
		
		var index, newRegions;

		// determine the correct regions
		if ( this.stateMachine.isInState( TeamStates.Attacking ) )
		{
			newRegions = this.color === Team.BLUE ? blueAttackingRegions : redAttackingRegions;
		}
		else if ( this.stateMachine.isInState( TeamStates.Defending ) )
		{
			newRegions = this.color === Team.BLUE ? blueDefendingRegions : redDefendingRegions;
		}
		else
		{
			throw "ERROR: Team: No team position data for current state.";
		}

		// apply the regions to the players
		for ( index = 0; index < this.players.length; index++ )
		{
			this.players[ index ].homeRegionId = newRegions[ index ];
		}
	};

}() );

/**
 * Use this method to indicate that the team has no control over the ball.
 */
Team.prototype.lostControl = function() {

	this.controllingPlayer = null;
};

/**
 * Returns true if the team controls the ball.
 * 
 * @returns {boolean} Does the team control the ball?
 */
Team.prototype.isInControl = function() {
	
	return this.controllingPlayer !== null ? true : false;
};

/**
 * Returns true if all players are located within their home region.
 * 
 * @returns {boolean} Are all players in their home region?
 */
Team.prototype.isAllPlayersAtHome = function() {

	for ( var index = 0; index < this.players.length; index++ )
	{
		if ( this.players[ index ].isInHomeRegion() === false )
		{
			return false;
		}
	}

	return true;

};

/**
 * Given a ball position, a kicking power and a reference to a target vector
 * this function will sample random positions along the opponent's goalmouth and
 * check to see if a goal can be scored if the ball was to be kicked in that
 * direction with the given power. If a possible shot is found, the function
 * will immediately return true, with the target position stored in the target
 * vector.
 * 
 * @param {THREE.Vector3} ballPosition - The position of the ball.
 * @param {number} kickingPower - The power of the shoot.
 * @param {THREE.Vector3} shootTarget - The target vector.
 * 
 * @returns {boolean} Is a shoot on the opposing goal possible?
 */
Team.prototype.isShootPossible = function( ballPosition, kickingPower, shootTarget ) {

	var index, minZ, maxZ, time;

	for ( index = 0; index < PlayerBase.CONFIG.PLAYER_NUM_ATTEMPTS_TO_FIND_VALID_STRIKE; index++ )
	{
		// choose a random position along the opponent's goalmouth (making
		// sure the ball's radius is taken into account)
		shootTarget.copy( this.opponentsGoal.center );

		// the z value of the shot position should lay somewhere between two
		// goalposts (taking into consideration the ball diameter)
		minZ = this.opponentsGoal.leftPost.z + this.pitch.ball.boundingRadius;
		maxZ = this.opponentsGoal.rightPost.z - this.pitch.ball.boundingRadius;

		shootTarget.z = THREE.Math.randInt( minZ, maxZ );

		// make sure striking the ball with the given power is
		// enough to drive the ball over the goal line.
		time = this.pitch.ball.calculateTimeToCoverDistance( ballPosition, shootTarget, kickingPower );

		// if it is, this shot is then tested to see if any of
		// the opponents can intercept it.
		if ( time >= 0 )
		{
			if ( this.isPassSafeFromAllOpponents( ballPosition, shootTarget, null, kickingPower ) )
			{
				return true;
			}
		}
	}

	return false;

};

/**
 * The best pass is considered to be the pass that cannot be intercepted by an
 * opponent and that is as far forward of the receiver as possible.
 * 
 * @param {PlayerBase} passer - The player who passes the ball.
 * @param {object} receiver - The player who receives the ball.
 * @param {THREE.Vector3} passTarget - The target of the pass.
 * @param {number} passPower - The power of the pass.
 * @param {number} minPassingDistance - The minimum distance of the pass.
 * 
 * @returns {boolean} Is an optimal pass possible?
 */
Team.prototype.isPassPossible = ( function() {

	var target = new THREE.Vector3();

	return function( passer, receiver, passTarget, passPower, minPassingDistance ) {
		
		var index, player, distanceSqToReceiver, distanceToGoal;

		// this will be used to track the closest pass to the opposing goal
		var closestToGoalSoFar = Infinity;
		
		// ensure receiver argument is null
		receiver.object = null;

		for ( index = 0; index < this.players.length; index++ )
		{
			player = this.players[ index ];

			// calculate distance from passer to receiver
			distanceSqToReceiver = passer.object3D.position.distanceToSquared( player.object3D.position );

			// make sure the potential receiver being examined is not this
			// player and that it is further away than the minimum pass distance
			if ( player !== passer && distanceSqToReceiver > ( minPassingDistance * minPassingDistance ) )
			{
				if ( this._isPassToReceiverPossible( passer, player, target, passPower ) )
				{
					// calculate simplified distance to goal
					distanceToGoal = Math.abs( target.x - this.opponentsGoal.center.x );

					// if the pass target is the closest to the opponent's goal
					// line found so far, keep a record of it
					if ( distanceToGoal < closestToGoalSoFar )
					{
						closestToGoalSoFar = distanceToGoal;

						receiver.object = player;

						passTarget.copy( target );
					}
				}
			}
		}// next team member

		if ( receiver.object !== null )
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
 * Tests a pass from position "from" to position "target" against each member of
 * the opposing team. Returns true if the pass can be made without getting
 * intercepted.
 * 
 * @param {THREE.Vector3} start - The start position of the pass.
 * @param {THREE.Vector3} target - The target position of the pass.
 * @param {PlayerBase} receiver - The receiver of the pass.
 * @param {number} passingForce - The force of the pass.
 * 
 * @returns {boolean} Can the pass be intercepted by one of the opposing
 * players?
 */
Team.prototype.isPassSafeFromAllOpponents = ( function() {
	
	var xAxis = new THREE.Vector3(); // right
	var yAxis = new THREE.Vector3(); // up
	var zAxis = new THREE.Vector3(); // front

	var upTemp = new THREE.Vector3( 0, 1, 0 );
	
	var matrix = new THREE.Matrix4();
	var matrixInverse = new THREE.Matrix4();

	return function( start, target, receiver, passingForce ) {
		
		var index;
		
		// calculate front vector
		zAxis.subVectors( target, start ).normalize();

		// avoid zero-length axis
		if ( zAxis.lengthSq() === 0 )
		{
			zAxis.z = 1;
		}

		// compute right vector
		xAxis.crossVectors( upTemp, zAxis );

		// avoid zero-length axis
		if ( xAxis.lengthSq() === 0 )
		{
			zAxis.x += 0.0001;
			xAxis.crossVectors( upTemp, zAxis ).normalize();
		}

		// compute up vector
		yAxis.crossVectors( zAxis, xAxis );

		// setup inverse of model matrix of start position
		matrix.makeBasis( xAxis, yAxis, zAxis );	
		matrix.setPosition( start );
		matrixInverse.getInverse( matrix );

		// check all players of the opposing team
		for ( index = 0; index < this.opponents.players.length; index++ )
		{
			if ( !this._isPassSafeFromOpponent( start, target, receiver, this.opponents.players[ index ], passingForce, matrixInverse ) )
			{
				return false;
			}
		}
		
		return true;
	};

}() );

/**
 * Returns true if an opposing player is within the radius of the position given
 * as a parameter.
 *
 * @param {THREE.Vector3} position - The position of the opposing player.
 * @param {number} radius - The radius to test.
 *  
 * @returns {boolean} Is an opposing player within the radius?
 */
Team.prototype.isOpponentWithinRadius = function( position, radius ) {

	var index, distanceSq;

	var radiusSq = radius * radius;

	// check all players of the opposing team
	for ( index = 0; index < this.opponents.players.length; index++ )
	{
		// calculate the distance. use the squared value to avoid sqrt
		distanceSq = this.opponents.players[ index ].object3D.position.distanceToSquared( position );

		if ( distanceSq < radiusSq )
		{
			return true;
		}
	}
	return false;

};

/**
 * Creates all the players for this team.
 */
Team.prototype._createPlayers = function() {

	var player;

	if ( this.color === Team.BLUE )
	{
		// goalkeeper
		player = new GoalKeeper( this.entityManager,
								 PlayerBase.PLAYER_RADIUS,
								 this, 
								 1, 
								 GoalKeeperStates.TendGoal, 
								 new THREE.Vector3(), 
								 PlayerBase.CONFIG.PLAYER_MASS, 
								 PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								 PlayerBase.CONFIG.PLAYER_MAX_FORCE, 
								 PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE );

		player.object3D.rotation.set( 0, Math.PI * 0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

		// field players

		// attackers
		player = new FieldPlayer( this.entityManager,
				 				  PlayerBase.PLAYER_RADIUS,
								  this, 
								  6, 
								  FieldPlayerStates.Wait,
								  new THREE.Vector3(), 
								  PlayerBase.CONFIG.PLAYER_MASS, 
								  PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								  PlayerBase.CONFIG.PLAYER_MAX_FORCE, 
								  PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE, 
								  PlayerBase.ROLE.ATTACKER );

		player.object3D.rotation.set( 0, Math.PI * 0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

		player = new FieldPlayer( this.entityManager, 
				 				  PlayerBase.PLAYER_RADIUS,
								  this, 
								  8, 
								  FieldPlayerStates.Wait, 
								  new THREE.Vector3(), 
								  PlayerBase.CONFIG.PLAYER_MASS, 
								  PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								  PlayerBase.CONFIG.PLAYER_MAX_FORCE, 
								  PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE, 
								  PlayerBase.ROLE.ATTACKER );

		player.object3D.rotation.set( 0, Math.PI * 0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

		// defenders
		player = new FieldPlayer( this.entityManager,
				  				  PlayerBase.PLAYER_RADIUS,
								  this, 
								  3, 
								  FieldPlayerStates.Wait,
								  new THREE.Vector3(), 
								  PlayerBase.CONFIG.PLAYER_MASS, 
								  PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								  PlayerBase.CONFIG.PLAYER_MAX_FORCE, 
								  PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE, 
								  PlayerBase.ROLE.DEFENDER );

		player.object3D.rotation.set( 0, Math.PI * 0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

		player = new FieldPlayer( this.entityManager,
				  				  PlayerBase.PLAYER_RADIUS,
								  this, 
								  5, 
								  FieldPlayerStates.Wait, 
								  new THREE.Vector3(), 
								  PlayerBase.CONFIG.PLAYER_MASS, 
								  PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								  PlayerBase.CONFIG.PLAYER_MAX_FORCE, 
								  PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE, 
								  PlayerBase.ROLE.DEFENDER );

		player.object3D.rotation.set( 0, Math.PI * 0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

	}
	else
	{
		// goalkeeper
		player = new GoalKeeper( this.entityManager,
								 PlayerBase.PLAYER_RADIUS,
								 this, 
								 16, 
								 GoalKeeperStates.TendGoal, 
								 new THREE.Vector3(),
								 PlayerBase.CONFIG.PLAYER_MASS, 
								 PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								 PlayerBase.CONFIG.PLAYER_MAX_FORCE, 
								 PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE );

		player.object3D.rotation.set( 0, Math.PI * -0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

		// field players

		// attackers
		player = new FieldPlayer( this.entityManager,
								  PlayerBase.PLAYER_RADIUS,
								  this, 
								  9, 
								  FieldPlayerStates.Wait, 
								  new THREE.Vector3(), 
								  PlayerBase.CONFIG.PLAYER_MASS, 
								  PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								  PlayerBase.CONFIG.PLAYER_MAX_FORCE, 
								  PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE, 
								  PlayerBase.ROLE.ATTACKER );

		player.object3D.rotation.set( 0, Math.PI * -0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

		player = new FieldPlayer( this.entityManager,
				 				  PlayerBase.PLAYER_RADIUS,
								  this, 
								  11, 
								  FieldPlayerStates.Wait, 
								  new THREE.Vector3(), 
								  PlayerBase.CONFIG.PLAYER_MASS, 
								  PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								  PlayerBase.CONFIG.PLAYER_MAX_FORCE,
								  PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE, 
								  PlayerBase.ROLE.ATTACKER );

		player.object3D.rotation.set( 0, Math.PI * -0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

		// defenders
		player = new FieldPlayer( this.entityManager,
				 				  PlayerBase.PLAYER_RADIUS,
								  this, 
								  12, 
								  FieldPlayerStates.Wait,
								  new THREE.Vector3(), 
								  PlayerBase.CONFIG.PLAYER_MASS, 
								  PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
								  PlayerBase.CONFIG.PLAYER_MAX_FORCE, 
								  PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE, 
								  PlayerBase.ROLE.DEFENDER );

		player.object3D.rotation.set( 0, Math.PI * -0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );

		player = new FieldPlayer( this.entityManager,
				 				  PlayerBase.PLAYER_RADIUS,
							      this, 
							      14, 
							      FieldPlayerStates.Wait,
							      new THREE.Vector3(),
							      PlayerBase.CONFIG.PLAYER_MASS, 
							      PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL, 
							      PlayerBase.CONFIG.PLAYER_MAX_FORCE,
							      PlayerBase.CONFIG.PLAYER_MAX_TURN_RATE,
							      PlayerBase.ROLE.DEFENDER );

		player.object3D.rotation.set( 0, Math.PI * -0.5, 0);
		this.players.push( player );
		world.addObject3D( player.object3D );
	}
	
	// register all players for messaging
	for ( var index = 0; index < this.players.length; index++ )
	{
		eventManager.registerEntity( this.players[ index ] );
	}
	
	// finally register team
	eventManager.registerEntity( this );
};

/**
 * Called each frame. Sets "playerClosestToBall" to point to the player closest
 * to the ball.
 */
Team.prototype._calculateClosestPlayerToBall = function() {

	var index, distanceSq, player;

	var closestDistanceSq = Infinity;

	for ( index = 0; index < this.players.length; index++ )
	{
		player = this.players[ index ];

		// calculate the distance. use the squared value to avoid sqrt
		distanceSq = player.object3D.position.distanceToSquared( this.pitch.ball.object3D.position );

		// keep a record of this value for each player
		player.distanceSqToBall = distanceSq;

		if ( distanceSq < closestDistanceSq )
		{
			// set new closest distance
			closestDistanceSq = distanceSq;

			// save the reference to the player closest to the ball
			this.playerClosestToBall = player;
		}
	}

	// also save the value of the closest distance
	this.distSqToBallOfClosestPlayer = closestDistanceSq;

};

/**
 * Tests if a pass from positions "from" to "target" kicked with force
 * "PassingForce" can be intercepted by an opposing player.
 * 
 * @param {THREE.Vector3} start - The start position of the pass.
 * @param {THREE.Vector3} target - The target position of the pass.
 * @param {PlayerBase} receiver - The receiver of the pass.
 * @param {PlayerBase} opponent - The opposing player.
 * @param {number} passingForce - The force of the pass.
 * @param {THREE.Matrix4} matrixInverse - The inverse matrix of from position.
 * 
 * @returns {boolean} Can the pass be intercepted by an opposing player?
 */
Team.prototype._isPassSafeFromOpponent = ( function() {

	var localPositionOfOpponent = new THREE.Vector3();
	var origin = new THREE.Vector3();
	var orthoPosition = new THREE.Vector3();

	return function( start, target, receiver, opponent, passingForce, matrixInverse ) {
		
		var timeForBall, reach;

		// do transformation to the ball's object space
		localPositionOfOpponent.copy( opponent.object3D.position ).applyMatrix4( matrixInverse );
		
		var test = target.clone().applyMatrix4( matrixInverse );

		// if opponent is behind the ball then pass is considered okay (this
		// is based on the assumption that the ball is going to be kicked with a
		// velocity greater than the opponent's max velocity)
		if ( localPositionOfOpponent.z < 0 )
		{
			return true;
		}

		// if the opponent is further away than the target we need to
		// consider if the opponent can reach the position before the receiver.
		if ( start.distanceToSquared( target ) < start.distanceToSquared( opponent.object3D.position ) )
		{
			// this condition is here because sometimes this function may be
			// called without reference to a receiver. (For example, you may
			// want to find out if a ball can reach a position on the field
			// before an opponent can get to it)
			if ( receiver !== null )
			{
				if ( target.distanceToSquared( opponent.object3D.position ) > target.distanceToSquared( receiver.object3D.position ) )
				{
					return true;
				}
				else
				{
					return false;
				}
			}
			else
			{
				return true;
			}
		}

		// calculate how long it takes the ball to cover the distance to the
		// position orthogonal to the opponents position
		orthoPosition.set( localPositionOfOpponent.z, 0, 0 );

		timeForBall = this.pitch.ball.calculateTimeToCoverDistance( origin, orthoPosition, passingForce );

		// now calculate how far the opponent can run in this time
		reach = opponent.maxSpeed * timeForBall + this.pitch.ball.boundingRadius + opponent.boundingRadius;

		// if the distance to the opponent's z position is less than his running
		// range plus the radius of the ball then the ball can be intercepted
		if ( Math.abs( localPositionOfOpponent.x ) < reach )
		{
			return false;
		}
		else
		{
			return true;
		}
	};

}() );

/**
 * Three potential passes are calculated. One directly toward the receiver's
 * current position and two that are the tangents from the ball position to the
 * circle of radius "range" from the receiver. These passes are then tested to
 * see if they can be intercepted by an opponent and to make sure they terminate
 * within the playing area. If all the passes are invalidated the function
 * returns false. Otherwise the function returns the pass that takes the ball
 * closest to the opponent's goal area.
 * 
 * @param {PlayerBase} passer - The player who passes the ball.
 * @param {PlayerBase} receiver - The player who receives the ball.
 * @param {THREE.Vector3} passTarget - The target of the pass.
 * @param {number} passPower - The power of the pass.
 * 
 * @returns {boolean} Is a pass to the receiver possible?
 */
Team.prototype._isPassToReceiverPossible = ( function() {

	var intersectPosition1 = new THREE.Vector3();
	var intersectPosition2 = new THREE.Vector3();

	var passes = [];

	var SCALING_FACTOR = 0.3;

	return function( passer, receiver, passTarget, passPower ) {
		
		var index, time, interceptRange, distance, pass, result = false;

		// this will be used to track the shortest pass
		var closestPassSoFar = Infinity;
		
		// reset the array
		passes.length = 0;

		// first, calculate how much time it will take for the ball to reach
		// this receiver, if the receiver was to remain motionless
		time = this.pitch.ball.calculateTimeToCoverDistance( this.pitch.ball.object3D.position, receiver.object3D.position, passPower );

		// return false if the ball cannot reach the receiver after having been
		// kicked with the given power
		if ( time < 0 )
		{
			return false;
		}

		// the maximum distance the receiver can cover in this time
		interceptRange = time * receiver.maxSpeed;

		// scale the intercept range
		interceptRange *= SCALING_FACTOR;

		// now calculate the pass targets which are positioned at the intercepts
		// of the tangents from the ball to the receiver's range circle
		this._getTangentPoints( receiver.object3D.position, interceptRange, this.pitch.ball.object3D.position, intersectPosition1, intersectPosition2 );

		// store pass targets
		passes.push( intersectPosition1, receiver.object3D.position, intersectPosition2 );

		for ( index = 0; index < passes.length; index++ )
		{
			pass = passes[ index ];

			// calculate simplified distance to goal
			distance = Math.abs( pass.x - this.opponentsGoal.center.x );

			// this pass is the best found so far if it is:
			//
			// 1. Further upfield than the closest valid pass for this receiver
			// found so far
			// 2. Within the playing area
			// 3. Cannot be intercepted by any opponents
			if ( distance < closestPassSoFar && this.pitch.playingArea.isInside( pass ) && this.isPassSafeFromAllOpponents( this.pitch.ball.object3D.position, pass, receiver, passPower ) )
			{
				// save values
				closestPassSoFar = distance;

				passTarget.copy( pass );

				result = true;
			}
		}

		return result;
	};

}() );

/**
 * Given a point P and a circle of radius R centered at C this function
 * determines the two points on the circle that intersect with the tangents from
 * P to the circle. Returns false if P is within the circle.
 * 
 * @param {THREE.Vector3} C - The center of the circle.
 * @param {number} R - The radius of the circle.
 * @param {THREE.Vector3} P - The origin point.
 * @param {THREE.Vector3} T1 - The first tangent.
 * @param {THREE.Vector3} T2 - The second tangent.
 * 
 * @returns {boolean} Is point P inside the circle?
 */
Team.prototype._getTangentPoints = ( function() {

	var toPoint = new THREE.Vector3();

	return function( C, R, P, T1, T2 ) {
		
		var lengthSq, lengthSqInv, RSq, root;

		toPoint.subVectors( P, C );
		lengthSq = toPoint.lengthSq();
		RSq = R * R;

		if ( lengthSq <= RSq )
		{
			// P is inside or on the circle
			return false;
		}

		lengthSqInv = 1 / lengthSq;
		root = Math.sqrt( lengthSq - RSq );

		T1.x = C.x + R * ( R * toPoint.x - toPoint.z * root ) * lengthSqInv;
		T1.z = C.z + R * ( R * toPoint.z + toPoint.x * root ) * lengthSqInv;
		T2.x = C.x + R * ( R * toPoint.x + toPoint.z * root ) * lengthSqInv;
		T2.z = C.z + R * ( R * toPoint.z - toPoint.x * root ) * lengthSqInv;

		return true;
	};

}() );

Team.BLUE = 0x0000ff;
Team.RED = 0xff0000;

module.exports = Team;