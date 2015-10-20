/**
 * @file Prototype to define a goalkeeper.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var PlayerBase = require( "./PlayerBase" );
var StateMachine = require( "../fsm/StateMachine" );
var GoalKeeperStates = require( "../fsm/GoalKeeperStates" );

/**
 * Creates a goalkeeper.
 * 
 * @constructor
 * @augments PlayerBase
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {number} boundingRadius - The bounding radius of the goal keeper.
 * @param {Team} team - The player's team.
 * @param {number} homeRegionId - The id of the home region.
 * @param {THREE.Vector3} velocity - The velocity of the entity.
 * @param {number} mass - The mass of the entity.
 * @param {number} maxSpeed - The maximum speed at which this entity may travel.
 * @param {number} maxForce - The maximum force this entity can produce to power itself (think rockets and thrust).
 * @param {number} maxTurnRate - The maximum rate (radians per second) at which this vehicle can rotate.
 */
function GoalKeeper( entityManager, boundingRadius, team, homeRegionId, startState, velocity, mass, maxSpeed, maxForce, maxTurnRate ) {
	
	PlayerBase.call( this, entityManager, null, boundingRadius, team, homeRegionId, velocity, mass, maxSpeed, maxForce, maxTurnRate, PlayerBase.ROLE.GOAL_KEEPER );

	Object.defineProperties( this, {
		// an instance of the state machine prototype
		stateMachine : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
	
	// setup state machine
	this.stateMachine = new StateMachine( this );
	this.stateMachine.currentState = startState;
	this.stateMachine.previousState = startState;
	this.stateMachine.globalState = GoalKeeperStates.GlobalState;
	
	this.stateMachine.currentState.enter( this );
	
	// setup mesh components
	var geometry = new THREE.CylinderGeometry( PlayerBase.CONFIG.PLAYER_RADIUS, PlayerBase.CONFIG.PLAYER_RADIUS, 4 );
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 2, 0 ) );
	var material = new THREE.MeshBasicMaterial( {
		color : team.color
	} );
	
	// setup mesh
	this.object3D = new THREE.Mesh( geometry, material );
	
	// set start position
	this.object3D.position.copy( this.getHomeRegion().center );

	// a player's start target is its start position (because it's just waiting)
	this.steering.target.copy( this.object3D.position );
}

GoalKeeper.prototype = Object.create( PlayerBase.prototype );
GoalKeeper.prototype.constructor = GoalKeeper;

/**
 * Update function.
 */
GoalKeeper.prototype.update = ( function() {

	var acceleration = new THREE.Vector3();

	return function() {
		
		// run the logic for the current state
		this.stateMachine.update();

		// calculate the combined force from each steering behavior
		var steeringForce = this.steering.calculate();
		
		// acceleration = force/mass
		acceleration.copy( steeringForce ).divideScalar( this.mass );

		// update velocity
		this.velocity.add( acceleration );

		// make sure player does not exceed maximum velocity
		if ( this.velocity.length() > this.maxSpeed )
		{
			this.velocity.normalize();

			this.velocity.multiplyScalar( this.maxSpeed );
		}

		// update the position
		this.object3D.position.add( this.velocity );

		// update the orientation if the vehicle has a non zero velocity
		if ( this.velocity.lengthSq() > 0.00000001 )
		{
			this.rotateToDirection( this.velocity );
		}
	};

}() );

/**
 * This method handles messages of other entities.
 * 
 * @param {Telegram} telegram - The telegram of the message.
 * 
 * @returns {boolean} Is the message handled successfully?
 */
GoalKeeper.prototype.handleMessage = function( telegram ){
	
	return this.stateMachine.handleMessage( telegram );
};

/**
 * Returns true if the ball comes close enough for the keeper to consider
 * intercepting.
 * 
 * @returns {boolean} Is the ball close enough for intercepting?
 */
GoalKeeper.prototype.isBallWithinRangeForIntercept = function() {

	return this.team.homeGoal.center.distanceToSquared( this.ball.object3D.position ) <= PlayerBase.CONFIG.KEEPER_INTERCEPT_RANGE_SQ;
};

/**
 * Returns true if the keeper has ventured too far away from the goalmouth.
 * 
 * @returns {boolean} Is the keeper too far away from the goalmouth?
 */
GoalKeeper.prototype.isTooFarFromGoalMouth = function() {

	return this.object3D.position.distanceToSquared( this.getRearInterposeTarget() ) > PlayerBase.CONFIG.KEEPER_INTERCEPT_RANGE_SQ;
};

/**
 * This method is called by the "interpose" state to determine the spot
 * along the goalmouth which will act as one of the interpose targets 
 * (the other is the ball). The specific point at the goal line that
 * the keeper is trying to cover is flexible and can move depending on 
 * where the ball is on the field. To achieve this we just scale the 
 * ball's z value by the ratio of the goal width to playing field height.
 * 
 * @returns {THREE.Vector3} The interpose target.
 */
GoalKeeper.prototype.getRearInterposeTarget = function() {
	
	var target = new THREE.Vector3();

	// save the width of the goal
	var goalWidth = this.team.homeGoal.size.z;

	// calculate x coordinate
	target.x = this.team.homeGoal.center.x;

	// calculate z coordinate
	target.z = this.ball.object3D.position.z * goalWidth / this.pitch.playingArea.height;

	return target;

};

module.exports = GoalKeeper;