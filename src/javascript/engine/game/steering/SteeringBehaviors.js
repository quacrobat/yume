/**
 * @file Prototype to encapsulate steering behaviors for a vehicle.
 * 
 * see "Programming Game AI by Example", Mat Buckland, Chapter 3
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );

var logger = require( "../../core/Logger" );
var Path = require( "./Path" );

/**
 * Creates a steering behaviors instance.
 * 
 * @constructor
 * 
 * @param {Vehicle} vehicle - The vehicle agent.
 */
function SteeringBehaviors( vehicle ) {

	Object.defineProperties( this, {
		vehicle : {
			value : vehicle,
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the current target
		target : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		// these can be used to keep track of friends, pursuers or prey
		targetAgent1 : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		targetAgent2 : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// use these values to tweak the amount that each steering force
		// contributes to the total steering force
		weights : {
			value : {
				seek : 1,
				flee : 1,
				arrive : 1,
				wander : 1,
				cohesion : 4,
				separation : 1,
				alignment : 1,
				obstacleAvoidance : 10,
				wallAvoidance : 10,
				followPath : 1,
				pursuit : 1,
				evade : 1,
				interpose : 1,
				hide : 1,
				flock : 1,
				offsetPursuit : 1
			},
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the list of waypoints to follow
		path : {
			value : new Path(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		// distance from the hiding spot
		distanceFromBoundary : {
			value : 10,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// amount of deceleration for arrive behavior
		deceleration : {
			value : 1,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// offset for offset pursuit behavior
		offset : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		// panic distance for flee and evade behavior
		panicDistance : {
			value : 50,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the distance a waypoint is set to the new target
		waypointSeekDist : {
			value : 5,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the length of the "feeler/s" used in wall detection
		wallDetectionFeelerLength : {
			value : 20,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the radius of the constraining circle for the wander behavior
		wanderRadius : {
			value : 5,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the distance the wander sphere is projected in front of the agent
		wanderDistance : {
			value : 10,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum amount of displacement along the sphere each frame
		wanderJitter : {
			value : 80,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// how close a neighbour must be before an agent perceives it (considers
		// it to be within its neighborhood)
		viewDistance : {
			value : 200,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the actual target of the wander behavior
		_wanderTarget : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : false,
			writable : true
		},
		// the calculated steering force per simulation step
		_steeringForce : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : false,
			writable : true
		},
		// bitmask for enable/ disable behaviors
		_behaviorFlag : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// array with "feelers" for wall avoidance
		_feelers : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// array with neighbors for flocking
		_neighbors : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );

	this.setupWanderTarget();
}

/**
 * Calculates and sums the steering forces from any active behaviors.
 * 
 * @param {number} delta - The time delta value.
 * 
 * @returns {THREE.Vector3} The steering force.
 */
SteeringBehaviors.prototype.calculate = function( delta ) {

	// preparations
	this._prepareCalculation();

	// summing method
	this._calculatePrioritized( delta );

	// return a copy of the member
	return this._steeringForce.clone();
};

/**
 * This method calls each active steering behavior in order of priority and
 * accumulates their forces until the max steering force magnitude is reached,
 * at which time the function returns the steering force accumulated to that
 * point.
 * 
 * @param {number} delta - The time delta value.
 * 
 */
SteeringBehaviors.prototype._calculatePrioritized = function( delta ) {

	var force;

	// wall avoidance
	if ( this._isOn( SteeringBehaviors.TYPES.WALLAVOIDANCE ) )
	{
		force = this._wallAvoidance();

		force.multiplyScalar( this.weights.wallAvoidance );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// obstacle avoidance
	if ( this._isOn( SteeringBehaviors.TYPES.OBSTACLEAVOIDANCE ) )
	{
		force = this._obstacleAvoidance();

		force.multiplyScalar( this.weights.obstacleAvoidance );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// evade
	if ( this._isOn( SteeringBehaviors.TYPES.EVADE ) )
	{
		logger.assert( this.targetAgent1 !== null, "SteeringBehaviors: Evade target not assigned" );

		force = this._evade( this.targetAgent1 );

		force.multiplyScalar( this.weights.evade );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// separation
	if ( this._isOn( SteeringBehaviors.TYPES.SEPARATION ) )
	{
		force = this._separation();

		force.multiplyScalar( this.weights.separation );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// alignment
	if ( this._isOn( SteeringBehaviors.TYPES.ALIGNMENT ) )
	{
		force = this._alignment();

		force.multiplyScalar( this.weights.alignment );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// cohesion
	if ( this._isOn( SteeringBehaviors.TYPES.COHESION ) )
	{
		force = this._cohesion();

		force.multiplyScalar( this.weights.cohesion );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// flee
	if ( this._isOn( SteeringBehaviors.TYPES.FLEE ) )
	{
		force = this._flee( this.target );

		force.multiplyScalar( this.weights.flee );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// seek
	if ( this._isOn( SteeringBehaviors.TYPES.SEEK ) )
	{

		force = this._seek( this.target );

		force.multiplyScalar( this.weights.seek );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// arrive
	if ( this._isOn( SteeringBehaviors.TYPES.ARRIVE ) )
	{
		force = this._arrive( this.target, this.deceleration );

		force.multiplyScalar( this.weights.arrive );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// wander
	if ( this._isOn( SteeringBehaviors.TYPES.WANDER ) )
	{
		force = this._wander( delta );

		force.multiplyScalar( this.weights.wander );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// pursuit
	if ( this._isOn( SteeringBehaviors.TYPES.PURSUIT ) )
	{
		logger.assert( this.targetAgent1 !== null, "SteeringBehaviors: Pursuit target not assigned" );

		force = this._pursuit( this.targetAgent1 );

		force.multiplyScalar( this.weights.pursuit );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// offset pursuit
	if ( this._isOn( SteeringBehaviors.TYPES.OFFSETPURSUIT ) )
	{
		logger.assert( this.targetAgent1 !== null, "SteeringBehaviors: Pursuit target not assigned" );

		force = this._offsetPursuit( this.targetAgent1, this.offset );

		force.multiplyScalar( this.weights.offsetPursuit );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// interpose
	if ( this._isOn( SteeringBehaviors.TYPES.INTERPOSE ) )
	{
		logger.assert( this.targetAgent1 !== null && this.targetAgent2 !== null, "SteeringBehaviors: Interpose targets not assigned" );

		force = this._interpose( this.targetAgent1, this.targetAgent2 );

		force.multiplyScalar( this.weights.interpose );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// hide
	if ( this._isOn( SteeringBehaviors.TYPES.HIDE ) )
	{
		logger.assert( this.targetAgent1 !== null, "SteeringBehaviors: Hide target not assigned" );

		force = this._hide( this.targetAgent1 );

		force.multiplyScalar( this.weights.hide );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

	// follow path
	if ( this._isOn( SteeringBehaviors.TYPES.FOLLOWPATH ) )
	{
		force = this._followPath();

		force.multiplyScalar( this.weights.followPath );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}

	}

};

/**
 * This function calculates how much of its max steering force the vehicle has
 * left to apply and then applies that amount of the force to add.
 * 
 * @param {THREE.Vector3} forceToAdd - The time delta value.
 * 
 * @returns {boolean} The steering force.
 */
SteeringBehaviors.prototype._accumulateForce = function( forceToAdd ) {

	var magnitudeSoFar, magnitudeRemaining, magnitudeToAdd;

	// calculate how much steering force the vehicle has used so far
	magnitudeSoFar = this._steeringForce.length();

	// calculate how much steering force remains to be used by this vehicle
	magnitudeRemaining = this.vehicle.maxForce - magnitudeSoFar;

	// return false if there is no more force left to use
	if ( magnitudeRemaining <= 0 )
	{
		return false;
	}

	// calculate the magnitude of the force we want to add
	magnitudeToAdd = forceToAdd.length();

	// restrict the magnitude of forceToAdd, so we don't exceed the
	// maximum force of the vehicle
	if ( magnitudeToAdd > magnitudeRemaining )
	{
		forceToAdd.normalize().multiplyScalar( magnitudeRemaining );
	}

	// add force
	this._steeringForce.add( forceToAdd );

	return true;
};

/**
 * This method tests if a specific bit of m_iFlags is set.
 * 
 * @param {number} behaviorType - The type of behavior.
 * 
 * @returns {boolean} Is the behavior active?
 */
SteeringBehaviors.prototype._isOn = function( behaviorType ) {

	/* jslint bitwise: true */return ( this._behaviorFlag & behaviorType ) === behaviorType;
};

/**
 * Prepares the calculation of the steering behaviors.
 */
SteeringBehaviors.prototype._prepareCalculation = function() {

	// reset steering force
	this._steeringForce.set( 0, 0, 0 );

	// update model matrices of 3D object
	this.vehicle.object3D.updateMatrixWorld();

	if ( this.targetAgent1 !== null )
	{
		this.targetAgent1.object3D.updateMatrixWorld();
	}

	if ( this.targetAgent2 !== null )
	{
		this.targetAgent2.object3D.updateMatrixWorld();
	}

	// calculate neighbors if one of the following group behaviors is active
	if ( this._isOn( SteeringBehaviors.TYPES.SEPARATION ) || this._isOn( SteeringBehaviors.TYPES.ALIGNMENT ) || this._isOn( SteeringBehaviors.TYPES.COHESION ) )
	{
		this.vehicle.world.calculateNeighbors( this.vehicle, this.viewDistance, this._neighbors );
	}

};

/**
 * Creates the antenna utilized by wallAvoidance.
 */
SteeringBehaviors.prototype._createFeelers = ( function() {

	var rotation = new THREE.Matrix4();

	return function() {

		// if there are no feelers yet, create them
		if ( this._feelers.length === 0 )
		{
			this._feelers.push( new THREE.Raycaster(), new THREE.Raycaster(), new THREE.Raycaster() );
		}

		// first feeler pointing straight in front
		this._feelers[ 0 ].ray.origin.copy( this.vehicle.position );
		this._feelers[ 0 ].ray.direction = this.vehicle.getDirection();
		this._feelers[ 0 ].far = this.wallDetectionFeelerLength;

		// second feeler to left
		rotation.identity();
		rotation.makeRotationY( Math.PI * 1.75 );

		this._feelers[ 1 ].ray.origin.copy( this.vehicle.position );
		this._feelers[ 1 ].ray.direction = this.vehicle.getDirection().transformDirection( rotation );
		this._feelers[ 1 ].far = this.wallDetectionFeelerLength * 0.5;

		// third feeler to right
		rotation.identity();
		rotation.makeRotationY( Math.PI * 0.25 );

		this._feelers[ 2 ].ray.origin.copy( this.vehicle.position );
		this._feelers[ 2 ].ray.direction = this.vehicle.getDirection().transformDirection( rotation );
		this._feelers[ 2 ].far = this.wallDetectionFeelerLength * 0.5;
	};

}() );

/**
 * Given the position of a hunter, and the position and radius of an obstacle,
 * this method calculates a position distanceFromBoundary away from its bounding
 * radius and directly opposite the hunter.
 * 
 * @param {THREE.Vector3} positionObstacle - The position of the obstacle.
 * @param {THREE.Vector3} radiusObstacle - The radius of the obstacle.
 * @param {THREE.Vector3} positionHunter - The position of the hunter.
 * @param {THREE.Vector3} hidingSpot - The calculated hiding spot.
 */
SteeringBehaviors.prototype._getHidingPosition = ( function() {

	var toHidingSpot = new THREE.Vector3();

	return function( positionObstacle, radiusObstacle, positionHunter, hidingSpot ) {

		// calculate how far away the agent is to be from the chosen obstacle's
		// bounding radius
		var distanceAway = radiusObstacle + this.distanceFromBoundary;

		// calculate the heading toward the object from the hunter
		toHidingSpot.subVectors( positionObstacle, positionHunter ).normalize();

		// scale it to size
		toHidingSpot.multiplyScalar( distanceAway );

		// add direction vector to the obstacles position to get the hiding spot
		hidingSpot.addVectors( toHidingSpot, positionObstacle );
	};

}() );

/**
 * Setup wander target.
 */
SteeringBehaviors.prototype.setupWanderTarget = function() {

	var theta = Math.random() * Math.PI * 2;

	// setup a vector to a target position on the wander sphere
	this._wanderTarget.x = this.wanderRadius * Math.cos( theta );
	this._wanderTarget.y = 0;
	this._wanderTarget.z = this.wanderRadius * Math.sin( theta );

};

// /////////////////////////////////////////////////////////////////////////////
// START OF BEHAVIORS

/**
 * This behavior moves the agent towards a target position.
 * 
 * @param {THREE.Vector3} targetPosition - The target position.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._seek = ( function() {

	var desiredVelocity = new THREE.Vector3();

	return function( targetPosition ) {

		var force = new THREE.Vector3();

		// First the desired velocity is calculated.
		// This is the velocity the agent would need to reach the target
		// position in an ideal world.
		// It represents the vector from the agent to the target,
		// scaled to be the length of the maximum possible speed of the agent.
		desiredVelocity.subVectors( targetPosition, this.vehicle.position ).normalize();

		desiredVelocity.multiplyScalar( this.vehicle.maxSpeed );

		// The steering force returned by this method is the force required,
		// which when added to the agent’s current velocity vector gives the
		// desired velocity.
		// To achieve this you simply subtract the agent’s current velocity from
		// the desired velocity.
		force.subVectors( desiredVelocity, this.vehicle.velocity );

		return force;

	};

}() );

/**
 * Does the opposite of seek.
 * 
 * @param {THREE.Vector3} targetPosition - The target position.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._flee = ( function() {

	var desiredVelocity = new THREE.Vector3();

	return function( targetPosition ) {

		var force = new THREE.Vector3();

		// only flee if the target is within panic distance
		if ( this.vehicle.position.distanceToSquared( targetPosition ) < ( this.panicDistance * this.panicDistance ) )
		{
			// from here, the only difference compared to seek is that the
			// desired velocity is calculated using a vector pointing in the
			// opposite direction
			desiredVelocity.subVectors( this.vehicle.position, targetPosition ).normalize();

			desiredVelocity.multiplyScalar( this.vehicle.maxSpeed );

			force.subVectors( desiredVelocity, this.vehicle.velocity );

		}

		return force;

	};

}() );

/**
 * This behavior is similar to seek but it attempts to arrive at the target with
 * a zero velocity.
 * 
 * @param {THREE.Vector3} targetPosition - The target position.
 * @param {number} deceleration - The deceleration of the vehicle.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._arrive = ( function() {

	var desiredVelocity = new THREE.Vector3();
	var toTarget = new THREE.Vector3();

	return function( targetPosition, deceleration ) {
		
		var distance, speed;

		var force = new THREE.Vector3();

		// calculate displacement vector
		toTarget.subVectors( targetPosition, this.vehicle.position );

		// calculate the distance to the target
		distance = toTarget.length();

		if ( distance > 0 )
		{
			// calculate the speed required to reach the target given the
			// desired deceleration
			speed = distance / deceleration;

			// make sure the velocity does not exceed the max
			speed = Math.min( speed, this.vehicle.maxSpeed );

			// from here proceed just like "seek" except we don't need to
			// normalize
			// the "toTarget" vector because we have already gone to the trouble
			// of calculating its length: distance.
			desiredVelocity.copy( toTarget ).multiplyScalar( speed ).divideScalar( distance );

			force.subVectors( desiredVelocity, this.vehicle.velocity );
		}

		return force;
	};

}() );

/**
 * This behavior creates a force that steers the agent towards the evader.
 * 
 * @param {Vehicle} evader - The evader to pursuit.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._pursuit = ( function() {

	var toEvader = new THREE.Vector3();
	var newEvaderVelocity = new THREE.Vector3();
	var predcitedPosition = new THREE.Vector3();

	return function( evader ) {
		
		var isFacing, isEvaderAhead, vehicleDirection, lookAheadTime;

		// 1. if the evader is ahead and facing the agent then we can just seek
		// for the evader's current position

		// calculate displacement vector
		toEvader.subVectors( evader.position, this.vehicle.position );

		// buffer vehicle direction
		vehicleDirection = this.vehicle.getDirection();

		// check first condition. evader must be in front of the pursuer
		isEvaderAhead = toEvader.dot( vehicleDirection ) > 0;

		// check second condition. evader must almost directly facing the agent
		isFacing = vehicleDirection.dot( evader.getDirection() ) < 0.95;

		if ( isEvaderAhead && isFacing )
		{
			return this._seek( evader.position );
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
		return this._seek( predcitedPosition );
	};

}() );

/**
 * Produces a steering force that keeps a vehicle at a specified offset from a
 * leader vehicle.
 * 
 * @param {Vehicle} leader - The leader vehicle.
 * @param {THREE.Vector3} offset - The offset of the leader.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._offsetPursuit = ( function() {

	var offsetWorld = new THREE.Vector3();
	var toOffset = new THREE.Vector3();
	
	var newLeaderVelocity = new THREE.Vector3();
	var predcitedPosition = new THREE.Vector3();

	return function( leader, offset ) {
		
		var lookAheadTime;

		// calculate the offset's position in world space
		offsetWorld.copy( offset ).applyMatrix4( leader.object3D.matrixWorld );

		toOffset.subVectors( offsetWorld, this.vehicle.position );

		// the lookahead time is proportional to the distance between the leader
		// and the pursuer; and is inversely proportional to the sum of both
		// agent's velocities
		lookAheadTime = toOffset.length() / ( this.vehicle.maxSpeed + leader.getSpeed() );

		// calculate new velocity and predicted future position
		newLeaderVelocity.copy( leader.velocity ).multiplyScalar( lookAheadTime );

		predcitedPosition.addVectors( offsetWorld, newLeaderVelocity );

		// now arrive at the predicted future position of the offset
		return this._arrive( predcitedPosition, SteeringBehaviors.DECELERATION.VERY_FAST );

	};

}() );

/**
 * Similar to pursuit except the agent flees from the estimated future position
 * of the pursuer.
 * 
 * @param {Vehicle} pursuer - The pursuer.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._evade = ( function() {

	var toPursuer = new THREE.Vector3();
	
	var newPursuerVelocity = new THREE.Vector3();
	var predcitedPosition = new THREE.Vector3();

	return function( pursuer ) {
		
		var lookAheadTime;

		// calculate displacement vector
		toPursuer.subVectors( pursuer.position, this.vehicle.position );

		// evade only when pursuers are inside a threat range
		if ( toPursuer.lengthSq() > ( this.panicDistance * this.panicDistance ) )
		{
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
		return this._flee( predcitedPosition );
	};

}() );

/**
 * Given two agents, this method returns a force that attempts to position the
 * vehicle between them.
 * 
 * @param {Vehicle} agentA - The first agent.
 * @param {Vehicle} agentB - The second agent.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._interpose = ( function() {

	var midPoint = new THREE.Vector3();

	var newVelocityAgentA = new THREE.Vector3();
	var newVelocityAgentB = new THREE.Vector3();

	var predcitedPositionAgentA = new THREE.Vector3();
	var predcitedPositionAgentB = new THREE.Vector3();

	return function( agentA, agentB ) {
		
		var time;

		// first we need to figure out where the two agents are going to be
		// in the future. This is approximated by determining the time
		// taken to reach the mid way point at the current time at at max speed
		midPoint.addVectors( agentA.position, agentB.position ).multiplyScalar( 0.5 );

		time = this.vehicle.position.distanceTo( midPoint ) / this.vehicle.maxSpeed;

		// now we have the time, we assume that agent A and agent B will
		// continue on a straight trajectory and extrapolate to get their future positions
		newVelocityAgentA.copy( agentA.velocity ).multiplyScalar( time );
		predcitedPositionAgentA.addVectors( agentA.position, newVelocityAgentA );

		newVelocityAgentB.copy( agentB.velocity ).multiplyScalar( time );
		predcitedPositionAgentB.addVectors( agentB.position, newVelocityAgentB );

		// calculate the mid point of these predicted positions
		midPoint.addVectors( predcitedPositionAgentA, predcitedPositionAgentB ).multiplyScalar( 0.5 );

		// then steer to arrive at it
		return this._arrive( midPoint, SteeringBehaviors.DECELERATION.VERY_FAST );
	};

}() );

/**
 * Given another agent position to hide from and a list of obstacles this method
 * attempts to put an obstacle between itself and its opponent.
 * 
 * @param {Vehicle} hunter - The hunter agent.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._hide = ( function() {

	var hidingSpot = new THREE.Vector3();
	var bestHidingSpot = new THREE.Vector3();

	return function( hunter ) {
		
		var distanceSq, closestDistanceSq, numberOfObstacle, obstacle, index;

		// this will be used to track the distance to the closest hiding spot
		closestDistanceSq = Infinity;

		// get number of obstacles in the world
		numberOfObstacle = this.vehicle.world.getNumberOfObstacles();

		for ( index = 0; index < numberOfObstacle; index++ )
		{
			// retrieve obstacle
			obstacle = this.vehicle.world.getObstacle( index );

			// calculate the position of the hiding spot for this obstacle
			this._getHidingPosition( obstacle.boundingSphere.center, obstacle.boundingSphere.radius, hunter.position, hidingSpot );

			// work in distance-squared space to find the closest hiding spot to
			// the agent
			distanceSq = hidingSpot.distanceToSquared( this.vehicle.position );

			if ( distanceSq < closestDistanceSq )
			{
				// save values
				closestDistanceSq = distanceSq;

				bestHidingSpot = hidingSpot;
			}
		}

		// if no suitable obstacles found then evade the hunter
		if ( closestDistanceSq === Infinity )
		{
			return this._evade( hunter );
		}
		else
		{
			return this._arrive( bestHidingSpot, SteeringBehaviors.DECELERATION.VERY_FAST );
		}
	};

}() );

/**
 * This behavior makes the agent wander about randomly on a planar surface.
 * 
 * @param {number} delta - The time delta value.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._wander = ( function() {

	var target = new THREE.Vector3();
	var randomDisplacement = new THREE.Vector3();
	var distanceVector = new THREE.Vector3();

	return function( delta ) {
		
		var force = new THREE.Vector3();

		// this behavior is dependent on the update rate, so this line must be
		// included when using time independent frame rate.
		var jitterThisTimeSlice = this.wanderJitter * delta;

		// prepare random vector
		randomDisplacement.x = THREE.Math.randFloat( -1, 1 ) * jitterThisTimeSlice;
		randomDisplacement.y = 0;
		randomDisplacement.z = THREE.Math.randFloat( -1, 1 ) * jitterThisTimeSlice;

		// add random vector to the target's position
		this._wanderTarget.add( randomDisplacement );

		// re-project this new vector back onto a unit sphere
		this._wanderTarget.normalize();

		// increase the length of the vector to the same as the radius of the
		// wander sphere
		this._wanderTarget.multiplyScalar( this.wanderRadius );

		// move the target into a position wanderDist in front of the agent
		distanceVector.z = this.wanderDistance;
		target.addVectors( this._wanderTarget, distanceVector );

		// project the target into world space
		target.applyMatrix4( this.vehicle.object3D.matrixWorld );

		// and steer towards it
		force.subVectors( target, this.vehicle.position );

		return force;
	};

}() );

/**
 * Given an array of obstacles, this method returns a steering force that will
 * prevent the agent colliding with the closest obstacle.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._obstacleAvoidance = ( function() {

	var boundingBox = new THREE.Box3();
	var boundingSphere = new THREE.Sphere();

	var vehicleSize = new THREE.Vector3();
	var localPositionOfObstacle = new THREE.Vector3();
	var localPositionOfClosestObstacle = new THREE.Vector3();
	var intersectionPoint = new THREE.Vector3();

	var brakingWeight = 0.2;

	var inverseMatrix = new THREE.Matrix4();

	// this will be used for ray/sphere intersection test
	var ray = new THREE.Ray( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 1 ) );

	return function() {
		
		var index, obstacle, expandedRadius, multiplier;

		var force = new THREE.Vector3();
		
		// this will keep track of the closest intersecting obstacle
		var closestObstacle = null;

		// this will be used to track the distance to the closest obstacle
		var distanceToClosestObstacle = Infinity;
		
		// get number of obstacles in the world
		var numberOfObstacle = this.vehicle.world.getNumberOfObstacles();
		
		// the detection box length is proportional to the agent's velocity
		var detectionBoxLength = this.vehicle.getSpeed() + this.vehicle.maxSpeed + vehicleSize.z * 0.5;

		// calculate bounding box of vehicle
		boundingBox.setFromObject( this.vehicle.object3D );

		// get size of bounding box
		boundingBox.size( vehicleSize );

		// this matrix will transform points to the local space of the vehicle
		inverseMatrix.getInverse( this.vehicle.object3D.matrixWorld );

		for ( index = 0; index < numberOfObstacle; index++ )
		{
			// retrieve obstacle
			obstacle = this.vehicle.world.getObstacle( index );

			// calculate this obstacle's position in local space
			localPositionOfObstacle.copy( obstacle.boundingSphere.center ).applyMatrix4( inverseMatrix );

			// if the local position has a positive z value then it must lay
			// behind the agent. besides the absolute z value must be smaller
			// than the length of the detection box
			if ( localPositionOfObstacle.z > 0 && Math.abs( localPositionOfObstacle.z ) < detectionBoxLength )
			{
				// if the distance from the x axis to the object's position is less
				// than its radius + half the width of the detection box then
				// there is a potential intersection.
				expandedRadius = obstacle.boundingSphere.radius + vehicleSize.x * 0.5;

				if ( Math.abs( localPositionOfObstacle.x ) < expandedRadius )
				{
					// prepare intersection test
					boundingSphere.center = localPositionOfObstacle;
					boundingSphere.radius = expandedRadius;

					// do intersection test in local space of the vehicle
					ray.intersectSphere( boundingSphere, intersectionPoint );

					// compare distances
					if ( intersectionPoint.z < distanceToClosestObstacle )
					{
						// save new minimum distance
						distanceToClosestObstacle = intersectionPoint.z;

						// save closest obstacle
						closestObstacle = obstacle;

						// save local position for force calculation
						localPositionOfClosestObstacle.copy( localPositionOfObstacle );
					}
				}
			}
		}

		// if we have found an intersecting obstacle, calculate a steering force
		// away from it
		if ( closestObstacle !== null )
		{
			// the closer the agent is to an object, the stronger the steering
			// force should be
			multiplier = 1 + ( detectionBoxLength - localPositionOfClosestObstacle.z ) / detectionBoxLength;

			// calculate the lateral force
			force.x = ( closestObstacle.boundingSphere.radius - localPositionOfClosestObstacle.x ) * multiplier;

			// apply a braking force proportional to the obstacles distance from
			// the vehicle
			force.z = ( closestObstacle.boundingSphere.radius - localPositionOfClosestObstacle.z ) * brakingWeight;

			// finally, convert the steering vector from local to world space
			force.transformDirection( this.vehicle.object3D.matrixWorld );
		}

		return force;
	};

}() );

/**
 * This returns a steering force that will keep the agent away from any walls it
 * may encounter.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._wallAvoidance = ( function() {

	var overShoot = new THREE.Vector3();
	var closestPoint = new THREE.Vector3();
	var normal = new THREE.Vector3();

	return function() {
		
		var indexFeeler, indexWall, feeler, intersects;

		var force = new THREE.Vector3();

		// this will be used to track the distance to the closest wall
		var distanceToClosestWall = Infinity;
		
		// this will keep track of the closest wall
		var closestWall = null;
		
		// this will keep track of the feeler that caused an intersection
		var intersectionFeeler = null;
		
		// this will keep track of the closes point
		closestPoint.set( 0, 0, 0 );
		
		// this will keep track of the wall normal
		normal.set( 0, 0, 0 );

		// create feelers for test
		this._createFeelers();

		// examine each feeler in turn
		for ( indexFeeler = 0; indexFeeler < this._feelers.length; indexFeeler++ )
		{
			// run through each wall checking for any intersection points
			for ( indexWall = 0; indexWall < this.vehicle.world.walls.length; indexWall++ )
			{
				feeler = this._feelers[ indexFeeler ];

				// do intersection test
				intersects = feeler.intersectObject( this.vehicle.world.walls[ indexWall ] );
				
				if( intersects.length > 0 )
				{
					// if the distance of the intersection point is smaller 
					// than the current distanceToClosestWall, continue
					if ( intersects[ 0 ].distance < distanceToClosestWall )
					{
						distanceToClosestWall = intersects[ 0 ].distance;
						
						closestWall = this.vehicle.world.walls[ indexWall ];
						
						closestPoint.copy( intersects[ 0 ].point );
						
						normal.copy( intersects[ 0 ].face.normal );

						intersectionFeeler = feeler;
					}
				}
			}
		}

		// if a wall was found, calculate a force that will direct the agent away
		if ( closestWall !== null )
		{
			// calculate by what distance the projected position of the agent will overshoot the wall
			overShoot.copy( intersectionFeeler.ray.direction ).multiplyScalar( intersectionFeeler.far ).add( intersectionFeeler.ray.origin );
			overShoot.sub( closestPoint );

			// transform the normal with the world matrix of the wall
			// on this way you get the true orientation of the normal
			 normal.transformDirection( closestWall.matrixWorld );
			
			// create a force in the direction of the wall normal, with a magnitude of the overshoot
			force.copy( normal ).multiplyScalar( overShoot.length() );
		}

		return force;
	};
}() );

/**
 * Given a series of Vector2Ds, this method produces a force that will move the
 * agent along the waypoints in order. The agent uses the "seek" behavior to
 * move to the next waypoint - unless it is the last waypoint, in which case it
 * "arrives".
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._followPath = function() {

	// calculate distance in square space from current waypoint to vehicle
	var distanceSq = this.path.getCurrentWaypoint().distanceToSquared( this.vehicle.position );

	// move to next waypoint if close enough to current target
	if ( distanceSq < ( this.waypointSeekDist * this.waypointSeekDist ) )
	{
		this.path.setNextWaypoint();
	}

	if ( !this.path.isFinished() )
	{
		return this._seek( this.path.getCurrentWaypoint() );
	}
	else
	{
		return this._arrive( this.path.getCurrentWaypoint(), SteeringBehaviors.DECELERATION.MIDDLE );
	}
};

/**
 * This calculates a force repelling from the other neighbors
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._separation = ( function() {

	var toAgent = new THREE.Vector3();

	return function() {
		
		var index, neighbor, length;

		var force = new THREE.Vector3();

		for ( index = 0; index < this._neighbors.length; index++ )
		{
			neighbor = this._neighbors[ index ];

			// make sure this agent isn't included in the calculations
			// also make sure it doesn't include the evade target
			if ( neighbor !== this.vehicle && neighbor !== this.targetAgent1 )
			{
				// calculate displacement vector
				toAgent.subVectors( this.vehicle.position, neighbor.position );

				// get length
				length = toAgent.length();

				// handle zero length. this is necessary if both vehicles have
				// the same position
				if ( length === 0 )
				{
					length = 0.0001;
				}

				// scale the force inversely proportional to the agents distance
				// from its neighbor
				toAgent.normalize().divideScalar( length );

				// add force
				force.add( toAgent );
			}
		}

		return force;
	};

}() );

/**
 * Returns a force that attempts to align this agents heading with that of its
 * neighbors.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._alignment = ( function() {

	// used to record the average heading of the neighbors
	var averageHeading = new THREE.Vector3();

	return function() {
		
		var index, neighbor;
		
		// used to count the number of vehicles in the neighborhood
		var neighborCount = 0;

		var force = new THREE.Vector3();

		// reset values
		averageHeading.set( 0, 0, 0 );

		for ( index = 0; index < this._neighbors.length; index++ )
		{
			neighbor = this._neighbors[ index ];

			// make sure this agent isn't included in the calculations
			// also make sure it doesn't include the evade target
			if ( neighbor !== this.vehicle && neighbor !== this.targetAgent1 )
			{
				averageHeading.add( neighbor.getDirection() );

				neighborCount++;
			}
		}

		// if the neighborhood contained one or more vehicles, average their
		// heading vectors
		if ( neighborCount > 0 )
		{
			averageHeading.divideScalar( neighborCount );

			force.subVectors( averageHeading, this.vehicle.getDirection() );
		}

		return force;

	};

}() );

/**
 * Returns a steering force that attempts to move the agent towards the center
 * of mass of the agents in its immediate area.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._cohesion = ( function() {

	var averageHeading = new THREE.Vector3();

	// center of mass of all the agents
	var centerOfMass = new THREE.Vector3(); 

	return function() {
		
		var index, neighbor;
		
		// used to count the number of vehicles in the neighborhood
		var neighborCount = 0; 

		var force = new THREE.Vector3();

		// reset values
		centerOfMass.set( 0, 0, 0 );

		for ( index = 0; index < this._neighbors.length; index++ )
		{
			neighbor = this._neighbors[ index ];

			// make sure this agent isn't included in the calculations
			// also make sure it doesn't include the evade target
			if ( neighbor !== this.vehicle && neighbor !== this.targetAgent1 )
			{
				centerOfMass.add( neighbor.position );

				neighborCount++;
			}

		}

		if ( neighborCount > 0 )
		{
			// the center of mass is the average of the sum of positions
			centerOfMass.divideScalar( neighborCount );

			// now seek towards that position
			force = this._seek( centerOfMass );
		}

		// the magnitude of cohesion is usually much larger than separation or
		// allignment so it usually helps to normalize it
		return force.normalize();
	};

}() );

// /////////////////////////////////////////////////////////////////////////////
// END OF BEHAVIORS

// /////////////////////////////////////////////////////////////////////////////
// START OF CONTROL METHODS

/* jshint ignore:start */

SteeringBehaviors.prototype.seekOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.SEEK; };
SteeringBehaviors.prototype.fleeOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.FLEE; };
SteeringBehaviors.prototype.arriveOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.ARRIVE; };
SteeringBehaviors.prototype.pursuitOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.PURSUIT; };
SteeringBehaviors.prototype.offsetPursuitOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.OFFSETPURSUIT; };
SteeringBehaviors.prototype.evadeOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.EVADE; };
SteeringBehaviors.prototype.interposeOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.INTERPOSE; };
SteeringBehaviors.prototype.hideOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.HIDE; };
SteeringBehaviors.prototype.wanderOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.WANDER; };
SteeringBehaviors.prototype.obstacleAvoidanceOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.OBSTACLEAVOIDANCE; };
SteeringBehaviors.prototype.wallAvoidanceOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.WALLAVOIDANCE; };
SteeringBehaviors.prototype.followPathOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.FOLLOWPATH; };
SteeringBehaviors.prototype.cohesionOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.COHESION; };
SteeringBehaviors.prototype.separationOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.SEPARATION; };
SteeringBehaviors.prototype.alignmentOn = function() { this._behaviorFlag |= SteeringBehaviors.TYPES.ALIGNMENT; };
SteeringBehaviors.prototype.flockingOn = function() { this.cohesionOn(); this.separationOn(); this.alignmentOn(); this.wanderOn(); };

SteeringBehaviors.prototype.seekOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.SEEK ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.SEEK; };
SteeringBehaviors.prototype.fleeOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.FLEE ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.FLEE; };
SteeringBehaviors.prototype.arriveOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.ARRIVE ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.ARRIVE; };
SteeringBehaviors.prototype.pursuitOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.PURSUIT ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.PURSUIT; };
SteeringBehaviors.prototype.offsetPursuitOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.OFFSETPURSUIT ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.OFFSETPURSUIT; };
SteeringBehaviors.prototype.evadeOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.EVADE ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.EVADE; };
SteeringBehaviors.prototype.interposeOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.INTERPOSE ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.INTERPOSE; };
SteeringBehaviors.prototype.hideOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.HIDE ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.HIDE; };
SteeringBehaviors.prototype.wanderOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.WANDER ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.WANDER; };
SteeringBehaviors.prototype.obstacleAvoidanceOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.OBSTACLEAVOIDANCE ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.OBSTACLEAVOIDANCE; };
SteeringBehaviors.prototype.wallAvoidanceOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.WALLAVOIDANCE ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.WALLAVOIDANCE; };
SteeringBehaviors.prototype.followPathOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.FOLLOWPATH ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.FOLLOWPATH; };
SteeringBehaviors.prototype.cohesionOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.COHESION ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.COHESION; };
SteeringBehaviors.prototype.separationOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.SEPARATION ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.SEPARATION; };
SteeringBehaviors.prototype.alignmentOff = function() { if ( this._isOn( SteeringBehaviors.TYPES.ALIGNMENT ) ) this._behaviorFlag ^= SteeringBehaviors.TYPES.ALIGNMENT; };
SteeringBehaviors.prototype.flockingOff = function() { this.cohesionOff(); this.separationOff(); this.alignmentOff(); this.wanderOff(); };

/* jshint ignore:end */

// /////////////////////////////////////////////////////////////////////////////
// END OF CONTROL METHODS
// types of behavior as flags
SteeringBehaviors.TYPES = {
	NONE : 0x00000,
	SEEK : 0x00002,
	FLEE : 0x00004,
	ARRIVE : 0x00008,
	WANDER : 0x00010,
	COHESION : 0x00020,
	SEPARATION : 0x00040,
	ALIGNMENT : 0x00080,
	OBSTACLEAVOIDANCE : 0x00100,
	WALLAVOIDANCE : 0x00200,
	FOLLOWPATH : 0x00400,
	PURSUIT : 0x00800,
	EVADE : 0x01000,
	INTERPOSE : 0x02000,
	HIDE : 0x04000,
	FLOCK : 0x08000,
	OFFSETPURSUIT : 0x10000
};

// amounts of deceleration
SteeringBehaviors.DECELERATION = {
	VERY_FAST : 1.5,
	FAST : 3,
	MIDDLE : 4,
	SLOW : 5,
	VERY_SLOW : 6
};

module.exports = SteeringBehaviors;