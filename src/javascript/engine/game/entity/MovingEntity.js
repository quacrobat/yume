/**
 * @file Base prototype from which all moving game agents are derived.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );

var GameEntity = require( "./GameEntity" );

/**
 * Creates a moving entity.
 * 
 * @constructor
 * @augments GameEntity
 * 
 * @param {THREE.Object3D} object3D - The 3D object of the entity.
 */
function MovingEntity( object3D ) {

	GameEntity.call( this, object3D );

	Object.defineProperties( this, {
		// the velocity of the agent
		velocity : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the mass of the agent
		mass : {
			value : 1,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum speed at which this entity may travel
		maxSpeed : {
			value : 1,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum force this entity can produce to power itself (think
		// rockets and thrust).
		maxForce : {
			value : 100,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum rate (radians per second) at which this vehicle can
		// rotate.
		maxTurnRate : {
			value : Math.PI,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

MovingEntity.prototype = Object.create( GameEntity.prototype );
MovingEntity.prototype.constructor = MovingEntity;

/**
 * This method rotates the entity to the given direction.
 * 
 * @param {THREE.Vector3} direction - The direction to rotate.
 */
MovingEntity.prototype.rotateToDirection = ( function() {

	var xAxis = new THREE.Vector3(); // right
	var yAxis = new THREE.Vector3(); // up
	var zAxis = new THREE.Vector3(); // front

	var upTemp = new THREE.Vector3( 0, 1, 0 );

	var rotationMatrix = new THREE.Matrix4();

	return function( direction ) {

		// the front vector always points to the direction vector
		zAxis.copy( direction ).normalize();

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

		// setup a rotation matrix of the basis
		rotationMatrix.makeBasis( xAxis, yAxis, zAxis );

		// apply rotation
		this.quaternion.setFromRotationMatrix( rotationMatrix );
	};

}() );

/**
 * Given a target position, this method rotates the entity by an amount not
 * greater than maxTurnRate until it directly faces the target.
 * 
 * @param {THREE.Vector3} targetPosition - The target position to face.
 * 
 * @returns {boolean} Is the entity facing the target?
 */
MovingEntity.prototype.isRotateToTarget = ( function() {

	var rotationToTarget = new THREE.Matrix4();
	var quaternionToTarget = new THREE.Quaternion();

	return function( targetPosition ) {
		
		var angle, t;

		// first determine the angle between the look vector and the target
		angle = targetPosition.angleTo( this.getDirection() );

		// return true if the player is facing the target
		if ( angle < 0.00001 )
		{
			return true;
		}

		// clamp the amount to turn to the max turn rate
		t = ( angle > this.maxTurnRate ) ? ( this.maxTurnRate / angle ) : 1;

		// get target rotation
		rotationToTarget.lookAt( targetPosition, this.position, this.object3D.up );
		quaternionToTarget.setFromRotationMatrix( rotationToTarget );

		// interpolate rotation
		this.quaternion.slerp( quaternionToTarget, t );

		// adjust velocity
		this.velocity.applyQuaternion( this.quaternion );

		return false;
	};

}() );

/**
 * Gets the speed of the moving entity.
 * 
 * @returns {number} The speed of the entity.
 */
MovingEntity.prototype.getSpeed = function() {

	return this.velocity.length();
};

/**
 * Gets the speed of the moving entity in squared space.
 * 
 * @returns {number} The speed of the entity.
 */
MovingEntity.prototype.getSpeedSq = function() {

	return this.velocity.lengthSq();
};

/**
 * Gets the normalized direction of the vehicle.
 * 
 * @returns {THREE.Vector3} The direction vector.
 */
MovingEntity.prototype.getDirection = function() {

	return new THREE.Vector3( 0, 0, 1 ).applyQuaternion( this.quaternion ).normalize();
};

module.exports = MovingEntity;