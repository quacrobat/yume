/**
 * @file Prototype to define a field player.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var PlayerBase = require( "./PlayerBase" );
var Regulator = require( "../../core/Regulator" );
var world = require( "../../core/World" );
var system = require( "../../core/System" );

var StateMachine = require( "../fsm/StateMachine" );
var FieldPlayerStates = require( "../fsm/FieldPlayerStates" );

/**
 * Creates a field player.
 * 
 * @constructor
 * @augments PlayerBase
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {number} boundingRadius - The bounding radius of the goal keeper.
 * @param {Team} team - The player's team.
 * @param {number} homeRegionId - The id of the home region.
 * @param {State} startState - The initial state of the goalkeeper.
 * @param {THREE.Vector3} velocity - The velocity of the entity.
 * @param {number} mass - The mass of the entity.
 * @param {number} maxSpeed - The maximum speed at which this entity may travel.
 * @param {number} maxForce - The maximum force this entity can produce to power itself (think rockets and thrust).
 * @param {number} maxTurnRate - The maximum rate (radians per second) at which this vehicle can rotate.
 * @param {number} role - The role of the player.
 * 
 */
function FieldPlayer( entityManager, boundingRadius, team, homeRegionId, startState, velocity, mass, maxSpeed, maxForce, maxTurnRate, role ) {

	PlayerBase.call( this, entityManager, null, boundingRadius, team, homeRegionId, velocity, mass, maxSpeed, maxForce, maxTurnRate, role );

	Object.defineProperties( this, {
		// an instance of the state machine prototype
		stateMachine : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// limits the number of kicks a player may take per second
		_kickLimiter : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// setup state machine
	this.stateMachine = new StateMachine( this );
	this.stateMachine.currentState = startState;
	this.stateMachine.previousState = startState;
	this.stateMachine.globalState = FieldPlayerStates.GlobalState;

	this.stateMachine.currentState.enter( this );

	// setup the kick regulator
	this._kickLimiter = new Regulator( PlayerBase.CONFIG.PLAYER_KICK_FREQUENCY );

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
	
	// add helpers in dev mode
	if ( system.isDevModeActive === true )
	{
		world.addObject3D( this._arrowHelper );
	}
}

FieldPlayer.prototype = Object.create( PlayerBase.prototype );
FieldPlayer.prototype.constructor = FieldPlayer;

/**
 * Update function.
 */
FieldPlayer.prototype.update = ( function() {

	var acceleration = new THREE.Vector3();
	var rotationMatrix = new THREE.Matrix4();

	return function() {

		// run the logic for the current state
		this.stateMachine.update();

		// calculate the combined force from each steering behavior
		var steeringForce = this.steering.calculate();

		// if no steering force is produced decelerate the player by applying a
		// braking force
		if ( steeringForce.lengthSq() === 0 )
		{
			this.velocity.multiplyScalar( PlayerBase.CONFIG.PLAYER_BRAKING_RATE );
		}

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

		// update helpers in dev mode
		if ( system.isDevModeActive === true )
		{
			this._arrowHelper.setDirection( this.getDirection() );
			this._arrowHelper.position.copy( this.object3D.position );
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
FieldPlayer.prototype.handleMessage = function( telegram ){
	
	return this.stateMachine.handleMessage( telegram );
};

/**
 * Returns true if the field player is ready for the next kick.
 * 
 * @returns {boolean} Is the player ready for the next kick?
 */
FieldPlayer.prototype.isReadyForNextKick = function() {

	return this._kickLimiter.isReady();
};

module.exports = FieldPlayer;