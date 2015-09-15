/**
 * @file Base prototype from which all moving game agents are derived.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require("three");

var GameEntity = require("./GameEntity");

/**
 * Creates a new moving entity.
 * 
 * @constructor
 * 
 * @param {THREE.Vector3} velocity - The velocity of the agent.
 * @param {number} mass - The mass of the agent.
 * @param {number} maxSpeed - The maximum speed at which this entity may travel.
 * @param {number} maxForce - The maximum force this entity can produce to power itself (think rockets and thrust).
 * @param {number} maxTurnRate - The maximum rate (radians per second) at which this vehicle can rotate.
 */
function MovingEntity( velocity, mass, maxSpeed, maxForce, maxTurnRate ){
		
	GameEntity.call( this );
	
	Object.defineProperties(this, {
		velocity: {
			value: velocity || new THREE.Vector3(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		mass: {
			value: mass || 1,
			configurable: false,
			enumerable: true,
			writable: true
		},
		maxSpeed: {
			value: maxSpeed || 1,
			configurable: false,
			enumerable: true,
			writable: true
		},
		maxForce: {
			value: maxForce || 100,
			configurable: false,
			enumerable: true,
			writable: true
		},
		maxTurnRate: {
			value: maxTurnRate || Math.PI,
			configurable: false,
			enumerable: true,
			writable: true
		}
	});
}

MovingEntity.prototype = Object.create( GameEntity.prototype );
MovingEntity.prototype.constructor = MovingEntity;

/**
 * Given a target object, this method rotates the entity by an amount not greater 
 * than maxTurnRate until it directly faces the target.
 * 
 * @param {THREE.Object3D} - The target object to face.
 * 
 * @returns {boolean} Is the entity facing in the desired direction?
 */
MovingEntity.prototype.rotateToTarget = ( function( ){
	
	var look = new THREE.Vector3();
	
	var rotationToTarget = new THREE.Matrix4();
	var quaternionToTarget = new THREE.Quaternion();
	
	var angle = 0, t = 0;
	
	return function( targetObject ){
		
		// first determine the angle between the look vector and the target
		look.set( 0, 0, -1 );
		look.applyQuaternion( this.quaternion );
		angle = look.angleTo( targetObject.position );
		
		// return true if the player is facing the target
		if( angle < 0.00001 ){
			return true;
		}
		
		// clamp the amount to turn to the max turn rate
		t = ( angle > this.maxTurnRate ) ? ( this.maxTurnRate / angle ) : 1;
		
		// get target rotation
		rotationToTarget.lookAt( targetObject.position, this.position, this.up );
		quaternionToTarget.setFromRotationMatrix( rotationToTarget );
		
		// interpolate rotation
		this.quaternion.slerp( quaternionToTarget, t );
		
		// adjust velocity
		this.velocity.applyQuaternion( this.quaternion );
		
		return false;
	};

} ( ) );

/**
 * Gets the speed of the moving entity.
 * 
 * @returns {number} The speed of the entity.
 */
MovingEntity.prototype.getSpeed = function(){

	return this.velocity.length();
};

/**
 * Gets the speed of the moving entity in squared space.
 * 
 * @returns {number} The speed of the entity.
 */
MovingEntity.prototype.getSpeedSq = function(){

	return this.velocity.lengthSq();
};

/**
 * Gets the normalized direction of the vehicle.
 * 
 * @returns {THREE.Vector3} The direction vector.
 */
MovingEntity.prototype.getDirection = function(){

	return new THREE.Vector3( 0, 0, 1 ).applyQuaternion( this.quaternion ).normalize();
};

module.exports = MovingEntity;