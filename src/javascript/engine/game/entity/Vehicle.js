/**
 * @file A simple vehicle that uses steering behaviors.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );

var MovingEntity = require( "./MovingEntity" );
var SteeringBehaviors = require( "../steering/SteeringBehaviors" );
var Smoother = require( "../steering/Smoother" );

/**
 * Creates a vehicle.
 * 
 * @constructor
 * @augments MovingEntity
 * 
 * @param {World} world - The reference to the world object.
 * @param {THREE.Object3D} object3D - The 3D object of the entity.
 * @param {number} numSamplesForSmoothing - How many samples the smoother will use to average the velocity.
 */
function Vehicle( world, object3D, numSamplesForSmoothing ) {

	MovingEntity.call( this, object3D );

	Object.defineProperties( this, {
		// the reference to the world object, so the vehicle can access
		// grounds, walls etc.
		world : {
			value : world,
			configurable : false,
			enumerable : true,
			writable : false
		},
		// an instance of the steering behavior prototype
		steering : {
			value : new SteeringBehaviors( this ),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// when true, smoothing is active
		isSmoothingOn : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// some steering behaviors give jerky looking movement. The following
		// member us are to smooth the vehicle's velocity
		_smoother : {
			value : new Smoother( numSamplesForSmoothing || 0 ),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this vector represents the average of the vehicle's heading vector
		// smoothed over the last few frames
		_smoothedVelocity : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
	
}

Vehicle.prototype = Object.create( MovingEntity.prototype );
Vehicle.prototype.constructor = Vehicle;

/**
 * Updates the position and orientation of the vehicle.
 * 
 * @param {number} delta - The time delta value.
 */
Vehicle.prototype.update = ( function() {

	var displacement = new THREE.Vector3();
	var acceleration = new THREE.Vector3();

	return function( delta ) {

		// calculate steering force
		var steeringForce = this.steering.calculate( delta );

		// acceleration = force / mass
		acceleration.copy( steeringForce ).divideScalar( this.mass );

		// update velocity
		this.velocity.add( acceleration.multiplyScalar( delta ) );

		// make sure vehicle does not exceed maximum speed
		if ( this.getSpeedSq() > ( this.maxSpeed * this.maxSpeed ) )
		{
			this.velocity.normalize();

			this.velocity.multiplyScalar( this.maxSpeed );
		}

		// calculate displacement
		displacement.copy( this.velocity ).multiplyScalar( delta );

		// update the position
		this.position.add( displacement );

		// update the orientation if the vehicle has non zero speed
		if ( this.getSpeedSq() > 0.00000001 )
		{
			// check smoothing
			if ( this.isSmoothingOn === true )
			{
				// decouple velocity and heading. calculate the orientation
				// with an averaged velocity to avoid oscillations/judder.
				this._smoother.update( this.velocity, this._smoothedVelocity );

				this.rotateToDirection( this._smoothedVelocity );
			}
			else
			{
				// couple velocity and orientation
				this.rotateToDirection( this.velocity );
			}
		}

	};

}() );

module.exports = Vehicle;