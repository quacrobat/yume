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
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {THREE.Object3D} object3D - The 3D object of the entity.
 * @param {number} boundingRadius - The bounding radius of the entity.
 * @param {THREE.Vector3} velocity - The velocity of the agent.
 * @param {number} mass - The mass of the agent.
 * @param {number} maxSpeed - The maximum speed at which this entity may travel.
 * @param {number} maxForce - The maximum force this entity can produce to power itself (think rockets and thrust).
 * @param {number} maxTurnRate - The maximum rate (radians per second) at which this vehicle can rotate.
 * @param {number} numSamplesForSmoothing - How many samples the smoother will use to average the velocity.
 */
function Vehicle( entityManager, object3D, boundingRadius, velocity, mass, maxSpeed, maxForce, maxTurnRate, numSamplesForSmoothing ) {

	MovingEntity.call( this, entityManager, object3D, boundingRadius, velocity, mass, maxSpeed, maxForce, maxTurnRate );

	Object.defineProperties( this, {
		steering : {
			value : new SteeringBehaviors( this ),
			configurable : false,
			enumerable : true,
			writable : false
		},
		isSmoothingOn : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		_smoother : {
			value : new Smoother( numSamplesForSmoothing || 0 ),
			configurable : false,
			enumerable : false,
			writable : false
		},
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

	var steeringForce = null;

	var displacement = new THREE.Vector3();
	var acceleration = new THREE.Vector3();

	return function( delta ) {

		// calculate steering force
		steeringForce = this.steering.calculate( delta );

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
		this.object3D.position.add( displacement );

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