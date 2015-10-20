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
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {THREE.Object3D} object3D - The 3D object of the entity.
 * @param {number} boundingRadius - The bounding radius of the entity.
 * @param {THREE.Vector3} velocity - The velocity of the agent.
 * @param {number} mass - The mass of the agent.
 * @param {number} maxSpeed - The maximum speed at which this entity may travel.
 * @param {number} maxForce - The maximum force this entity can produce to power itself (think rockets and thrust).
 * @param {number} maxTurnRate - The maximum rate (radians per second) at which this vehicle can rotate.
 */
function MovingEntity( entityManager, object3D, boundingRadius, velocity, mass, maxSpeed, maxForce, maxTurnRate ) {

	GameEntity.call( this, entityManager, object3D, boundingRadius );

	Object.defineProperties( this, {
		velocity : {
			value : velocity || new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		mass : {
			value : mass || 1,
			configurable : false,
			enumerable : true,
			writable : true
		},
		maxSpeed : {
			value : maxSpeed || 1,
			configurable : false,
			enumerable : true,
			writable : true
		},
		maxForce : {
			value : maxForce || 100,
			configurable : false,
			enumerable : true,
			writable : true
		},
		maxTurnRate : {
			value : maxTurnRate || Math.PI,
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
		this.object3D.quaternion.setFromRotationMatrix( rotationMatrix );
	};

}() );

/**
 * Given a target position, this method rotates the entity by an amount not
 * greater than maxTurnRate until it directly faces the target.
 * 
 * @param {THREE.Object3D} - The target position to face.
 * 
 * @returns {boolean} Is the entity facing in the desired direction?
 */
MovingEntity.prototype.isRotateHeadingToFacePosition = ( function() {

	var toTarget = new THREE.Vector3(); 

	return function( position ) {
		
		var direction, angle, sign;

		toTarget.subVectors( position, this.object3D.position ).normalize();
		
		direction = this.getDirection();

		// first determine the angle between the view direction and the target
		angle = direction.angleTo( toTarget );

		// return true if the player is facing the target
		if ( angle < 0.00001 )
		{
			return true;
		}

		// clamp the amount to turn to the max turn rate
		if ( angle > this.maxTurnRate )
		{
			angle = this.maxTurnRate;
		}
		
		// calculate direction of rotation ( clockwise / anti-clockwise )
		sign =  (  ( direction.x * toTarget.z ) < ( direction.z * toTarget.x ) ) ? 1 : -1;
		
		// rotate player
		this.object3D.rotateY( angle * sign );

		// adjust velocity
		this.velocity.applyQuaternion( this.object3D.quaternion );
		
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

	return new THREE.Vector3( 0, 0, 1 ).applyQuaternion( this.object3D.quaternion ).normalize();
};

module.exports = MovingEntity;