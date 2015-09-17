/**
 * @file Prototype to encapsulate steering behaviors for a vehicle.
 * 
 * see "Programming Game AI by Example", Mat Buckland, Chapter 3
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require("three");
var Path = require("./Path");

/**
 * Creates a steering behaviors instance.
 * 
 * @constructor
 *
 * @param {Vehicle} vehicle - The vehicle agent.
 */
function SteeringBehaviors( vehicle ){
	
	Object.defineProperties( this, {
		vehicle: {
			value: vehicle,
			configurable: false,
			enumerable: true,
			writable: false
		},
		path: {
			value: new Path(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		// the distance a waypoint is set to the new target
		waypointSeekDist: {
			value: 5,
			configurable: false,
			enumerable: true,
			writable: true
		},
		// the radius of the constraining circle for the wander behavior
		wanderRadius: {
			value: 5,
			configurable: false,
			enumerable: true,
			writable: true
		},
		// the distance the wander sphere is projected in front of the agent
		wanderDistance: {
			value: 10,
			configurable: false,
			enumerable: true,
			writable: true
		},
		// the maximum amount of displacement along the sphere each frame
		wanderJitter: {
			value: 80,
			configurable: false,
			enumerable: true,
			writable: true
		},
		_wanderTarget: {
			value: new THREE.Vector3(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		_steeringForce: {
			value: new THREE.Vector3(),
			configurable: false,
			enumerable: true,
			writable: true
		}
	});
	
	this.setupWanderTarget();
}

/**
 * Calculates and sums the steering forces from any active behaviors.
 * 
 * @param {number} delta - The time delta value.
 * 
 * @returns {THREE.Vector3} The steering force.
 */
SteeringBehaviors.prototype.calculate = function( delta ){
	
	// reset steering force
	this._steeringForce.set( 0, 0, 0 );
	
	// update model matrices
	this.vehicle.updateMatrix();
	this.vehicle.target.updateMatrix();
	
	// calculate seek steering behavior
	this._steeringForce = this.seek( this.vehicle.target.position, SteeringBehaviors.DECELERATION.MIDDLE );
	
	// make sure vehicle does not exceed maximum force
	if( this._steeringForce.length() > this.vehicle.maxForce ){
		
		this._steeringForce.normalize();
		
		this._steeringForce.multiplyScalar( this.vehicle.maxForce );
	}
	
	return this._steeringForce.clone();
};

/**
 * This behavior moves the agent towards a target position.
 * 
 * @param {THREE.Vector3} targetPosition - The target position.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype.seek = ( function(){
	
	var desiredVelocity = new THREE.Vector3();
	
	return function( targetPosition ){
		
		var force = new THREE.Vector3();
		
		// First the desired velocity is calculated. 
		// This is the velocity the agent would need to reach the target position in an ideal world. 
		// It represents the vector from the agent to the target, 
		// scaled to be the length of the maximum possible speed of the agent.
		desiredVelocity.subVectors( targetPosition, this.vehicle.position ).normalize();
		
		desiredVelocity.multiplyScalar( this.vehicle.maxSpeed );
		
		// The steering force returned by this method is the force required, 
		// which when added to the agent’s current velocity vector gives the desired velocity. 
		// To achieve this you simply subtract the agent’s current velocity from the desired velocity. 
		force.subVectors( desiredVelocity, this.vehicle.velocity );
		
		return force;
		
	};
	
} ( ) );

/**
 * Does the opposite of seek.
 * 
 * @param {THREE.Vector3} targetPosition - The target position.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype.flee = ( function(){
	
	var desiredVelocity = new THREE.Vector3();
		
	return function( targetPosition ){
		
		var force = new THREE.Vector3();
		
		// only flee if the target is within panic distance
		if( this.vehicle.position.distanceToSquared( targetPosition ) < ( SteeringBehaviors.FLEE.RANGE * SteeringBehaviors.FLEE.RANGE ) ){
			
			// from here, the only difference compared to seek is that the desired velocity
			// is calculated using a vector pointing in the opposite direction
			desiredVelocity.subVectors( this.vehicle.position, targetPosition ).normalize();
			
			desiredVelocity.multiplyScalar( this.vehicle.maxSpeed );
	
			force.subVectors( desiredVelocity, this.vehicle.velocity );
			
		}
		
		return force;
		
	};
	
} ( ) );

/**
 *  This behavior is similar to seek but it attempts to arrive at the target with a zero velocity.
 * 
 * @param {THREE.Vector3} targetPosition - The target position.
 * @param {number} deceleration - The deceleration of the vehicle.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype.arrive = ( function(){
	
	var desiredVelocity = new THREE.Vector3();
	var toTarget = new THREE.Vector3();
	
	var distance = 0;
	var speed = 0;
	
	return function( targetPosition, deceleration ){
		
		var force = new THREE.Vector3();
		
		// calculate displacement vector
		toTarget.subVectors( targetPosition, this.vehicle.position );
		
		// calculate the distance to the target
		distance = toTarget.length();
		
		if( distance > 0 ){
			
			// calculate the speed required to reach the target given the desired deceleration
			speed = distance / deceleration;
			
			// make sure the velocity does not exceed the max
			speed = Math.min( speed, this.vehicle.maxSpeed );
			
			// from here proceed just like "seek" except we don't need to normalize 
		    // the "toTarget" vector because we have already gone to the trouble
		    // of calculating its length: distance.	
			desiredVelocity.copy( toTarget ).multiplyScalar( speed ).divideScalar( distance );
			
			force.subVectors( desiredVelocity, this.vehicle.velocity );
		}
		
		return force;
	};
	
} ( ) );

/**
 *  This behavior creates a force that steers the agent towards the evader.
 * 
 * @param {Vehicle} evader - The evader to pursuit.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype.pursuit = ( function(){
	
	var toEvader = new THREE.Vector3();
	var newEvaderVelocity = new THREE.Vector3();
	var predcitedPosition = new THREE.Vector3();
	
	var isFacing = false;
	var isEvaderAhead = false;
	
	var vehicleDirection = null;
	
	var lookAheadTime = 0;
	
	return function( evader ){
		
		// 1. if the evader is ahead and facing the agent then we can just seek for the evader's current position
		
		// calculate displacement vector
		toEvader.subVectors( evader.position, this.vehicle.position );
		
		// buffer vehicle direction
		vehicleDirection = this.vehicle.getDirection();
		
		// check first condition. evader must be in front of the pursuer
		isEvaderAhead = toEvader.dot( vehicleDirection ) > 0;
		
		// check second condition. evader must almost directly facing the agent
		isFacing = vehicleDirection.dot( evader.getDirection() ) < 0.95; // acos( 0.95 ) = 18 degs

		if( isEvaderAhead && isFacing ){ 
			
			return this.seek( evader.position );
		}
		
		// 2. not considered ahead so we predict where the evader will be
		
		// the lookahead time is proportional to the distance between the evader
		// and the pursuer. and is inversely proportional to the sum of the
		// agent's velocities
		lookAheadTime = toEvader.length() / ( this.vehicle.maxSpeed + evader.getSpeed() );
		
		// calculate new velocity and predicted future position
		newEvaderVelocity.copy( evader.velocity ).multiplyScalar( lookAheadTime );
		
		predcitedPosition.addVectors( evader.position, newEvaderVelocity );
		
		// now seek to the predicted future position of the evader
		return this.seek( predcitedPosition );
	};
	
} ( ) );

/**
 *  Produces a steering force that keeps a vehicle at a specified 
 *  offset from a leader vehicle.
 *  
 * @param {Vehicle} leader - The leader vehicle.
 * @param {THREE.Vector3} offset - The offset of the leader.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype.offsetPursuit = ( function(){
	
	var offsetWorld = new THREE.Vector3();
	var toOffset = new THREE.Vector3();
	
	var lookAheadTime = 0;
	
	var newLeaderVelocity = new THREE.Vector3();
	var predcitedPosition = new THREE.Vector3();

	return function( leader, offset ){

		// calculate the offset's position in world space
		offsetWorld.copy( offset ).applyMatrix4( leader.matrix );
		
		toOffset.subVectors( offsetWorld, this.vehicle.position );
		
		// the lookahead time is proportional to the distance between the leader
		// and the pursuer; and is inversely proportional to the sum of both
		// agent's velocities
		lookAheadTime = toOffset.length() / ( this.vehicle.maxSpeed + leader.getSpeed() );
		
		// calculate new velocity and predicted future position
		newLeaderVelocity.copy( leader.velocity ).multiplyScalar( lookAheadTime );
		
		predcitedPosition.addVectors( offsetWorld, newLeaderVelocity );
		
		// now arrive at the predicted future position of the offset
		return this.arrive( predcitedPosition, 1 );
		
	};
	
} ( ) );

/**
 * Similar to pursuit except the agent flees from the estimated future position of the pursuer.
 * 
 * @param {Vehicle} pursuer - The pursuer.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype.evade = ( function(){
	
	var toPursuer = new THREE.Vector3();
	var newPursuerVelocity = new THREE.Vector3();
	var predcitedPosition = new THREE.Vector3();
	
	var lookAheadTime = 0;
	 
	return function( pursuer ){
		
		/* Not necessary to include the check for facing direction this time */
		
		// calculate displacement vector
		toPursuer.subVectors( pursuer.position, this.vehicle.position );
		
		// evade only when pursuers are inside a threat range.
		if( toPursuer.lengthSq() > ( SteeringBehaviors.FLEE.RANGE * SteeringBehaviors.FLEE.RANGE ) ){
			return new THREE.Vector3();
		}
		
		// the lookahead time is proportional to the distance between the evader
		// and the pursuer. and is inversely proportional to the sum of the
		// agent's velocities
		lookAheadTime = toPursuer.length() / ( this.vehicle.maxSpeed + pursuer.getSpeed() );
		
		// calculate new velocity and predicted future position
		newPursuerVelocity.copy( pursuer.velocity ).multiplyScalar( lookAheadTime );
		
		predcitedPosition.addVectors( pursuer.position, newPursuerVelocity );
		
		// now flee away from predicted future position of the pursuer
		return this.flee( predcitedPosition );
	};
	
} ( ) );

/**
 * This behavior makes the agent wander about randomly on a planar surface.
 * 
 * @param {number} delta - The time delta value.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype.wander = ( function(){
	
	var randomDisplacement = new THREE.Vector3();
	var distanceVector = new THREE.Vector3();
	
	var jitterThisTimeSlice = 0;
	
	return function( delta ){
		
		var target = new THREE.Vector3();
		
		// this behavior is dependent on the update rate, so this line must be included 
		// when using time independent frame rate.
		jitterThisTimeSlice = this.wanderJitter * delta;
		
		// prepare random vector
		randomDisplacement.x = THREE.Math.randFloat( -1, 1 ) * jitterThisTimeSlice;
		randomDisplacement.y = 0;
		randomDisplacement.z = THREE.Math.randFloat( -1, 1 ) * jitterThisTimeSlice;
		
		// add random vector to the target's position
		this._wanderTarget.add( randomDisplacement );
		
		// re-project this new vector back onto a unit sphere
		this._wanderTarget.normalize();
		
		// increase the length of the vector to the same as the radius of the wander sphere
		this._wanderTarget.multiplyScalar( this.wanderRadius );
		
		// move the target into a position wanderDist in front of the agent
		distanceVector.z = this.wanderDistance;
		target.addVectors( this._wanderTarget, distanceVector );
		
		// project the target into world space
		target.applyMatrix4( this.vehicle.matrix );
		
		// and steer towards it
		target.sub( this.vehicle.position );
		
		return target;
	};
	
} ( ) );

/**
 *  Given a series of Vector2Ds, this method produces a force that will
 *  move the agent along the waypoints in order. The agent uses the
 * "seek" behavior to move to the next waypoint - unless it is the last
 *  waypoint, in which case it "arrives".
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype.followPath = ( function(){
	
	var distanceSq = 0;

	return function(){
		
		// calculate distance in square space from current waypoint to vehicle
		distanceSq = this.path.getCurrentWaypoint().distanceToSquared( this.vehicle.position );
		
		// move to next waypoint if close enough to current target
		if( distanceSq < ( this.waypointSeekDist * this.waypointSeekDist ) ){
			
			this.path.setNextWaypoint();
		}
		
		if( !this.path.isFinished() ){
			
			return this.seek( this.path.getCurrentWaypoint() );
		}
		else{
			
			return this.arrive( this.path.getCurrentWaypoint(), SteeringBehaviors.DECELERATION.MIDDLE );
		}
	};
	
} ( ) );

/**
 * Setup wander target.
 */
SteeringBehaviors.prototype.setupWanderTarget = function(){
	
	var theta = Math.random() * Math.PI * 2;
	
	// setup a vector to a target position on the wander sphere
	this._wanderTarget.x = this.wanderRadius * Math.cos( theta );
	this._wanderTarget.y = 0;
	this._wanderTarget.z = this.wanderRadius * Math.sin( theta );

};

SteeringBehaviors.FLEE = {
		RANGE: 50
};

SteeringBehaviors.DECELERATION = {
		VERY_FAST: 1.5,
		FAST: 3,
		MIDDLE: 4,
		SLOW: 5,
		VERY_SLOW: 6
};

module.exports = SteeringBehaviors;