/**
 * @file Prototype to encapsulate steering behaviors for a soccer player.
 * 
 * see "Programming Game AI by Example", Mat Buckland, Chapter 3
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );

/**
 * Creates a steering behaviors instance.
 * 
 * @constructor
 * 
 * @param {PlayerBase} player - The player.
 * @param {Ball} ball - The soccer ball.
 * @param {Pitch} pitch - The soccer pitch.
 */
function SteeringBehaviors( player, ball, pitch ) {

	Object.defineProperties( this, {
		player : {
			value : player,
			configurable : false,
			enumerable : true,
			writable : false
		},
		ball : {
			value : ball,
			configurable : false,
			enumerable : true,
			writable : false
		},
		pitch : {
			value : pitch,
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the current target (usually the ball or predicted ball position)
		target : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		// use these values to tweak the amount that each steering force
		// contributes to the total steering force
		weights : {
			value : {
				seek : 1,
				arrive : 1,
				separation : 10,
				pursuit : 1,
				interpose : 1
			},
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the distance the player tries to interpose from the target
		interposeDistance : {
			value : 0,
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
		// how close a neighbor must be to be considered for separation
		viewDistance : {
			value : 5,
			configurable : false,
			enumerable : true,
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
		// array with neighbors for flocking
		_neighbors : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );

}

/**
 * Calculates and sums the steering forces from any active behaviors.
 * 
 * @returns {THREE.Vector3} The steering force.
 */
SteeringBehaviors.prototype.calculate = function() {

	// preparations
	this._prepareCalculation();

	// summing method
	this._calculatePrioritized();

	// return a copy of the member
	return this._steeringForce.clone();
};

/**
 * Prepares the calculation of the steering behaviors.
 */
SteeringBehaviors.prototype._prepareCalculation = function() {

	// reset steering force
	this._steeringForce.set( 0, 0, 0 );

	// calculate neighbors for separation
	this._calculateNeighbors();
};

/**
 * This method calls each active steering behavior in order of priority and
 * accumulates their forces until the max steering force magnitude is reached,
 * at which time the function returns the steering force accumulated to that
 * point.
 */
SteeringBehaviors.prototype._calculatePrioritized = function() {

	var force;

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
		force = this._arrive( this.target, SteeringBehaviors.DECELERATION.FAST );

		force.multiplyScalar( this.weights.arrive );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}
	}

	// pursuit
	if ( this._isOn( SteeringBehaviors.TYPES.PURSUIT ) )
	{
		force = this._pursuit( this.ball );

		force.multiplyScalar( this.weights.pursuit );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}
	}

	// interpose
	if ( this._isOn( SteeringBehaviors.TYPES.INTERPOSE ) )
	{
		force = this._interpose( this.ball, this.target, this.interposeDistance );

		force.multiplyScalar( this.weights.interpose );

		if ( !this._accumulateForce( force ) )
		{
			return;
		}
	}

};

/**
 * This function calculates how much of its max steering force the player has
 * left to apply and then applies that amount of the force to add.
 * 
 * @param {THREE.Vector3} forceToAdd - The time delta value.
 * 
 * @returns {boolean} The steering force.
 */
SteeringBehaviors.prototype._accumulateForce = function( forceToAdd ) {

	var magnitudeSoFar, magnitudeRemaining, magnitudeToAdd;

	// calculate how much steering force the player has used so far
	magnitudeSoFar = this._steeringForce.length();

	// calculate how much steering force remains to be used by this player
	magnitudeRemaining = this.player.maxForce - magnitudeSoFar;

	// return false if there is no more force left to use
	if ( magnitudeRemaining <= 0 )
	{
		return false;
	}

	// calculate the magnitude of the force we want to add
	magnitudeToAdd = forceToAdd.length();

	// restrict the magnitude of forceToAdd, so we don't exceed the
	// maximum force of the player
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
 * Calculates all neighbors of the player.
 */
SteeringBehaviors.prototype._calculateNeighbors = ( function() {

	var toPlayer = new THREE.Vector3();
	
	return function() {
		
		var index, player;

		// reset array
		this._neighbors.length = 0;

		// iterate over red team
		for ( index = 0; index < this.pitch.redTeam.players.length; index++ )
		{
			player = this.pitch.redTeam.players[ index ];

			if ( player !== this.player )
			{
				// calculate displacement vector
				toPlayer.subVectors( player.object3D.position, this.player.object3D.position );

				// if player within range, push into neighbors array for further
				// consideration.
				if ( toPlayer.lengthSq() < ( this.viewDistance * this.viewDistance ) )
				{
					this._neighbors.push( player );
				}

			}
		}

		// iterate over blue team
		for ( index = 0; index < this.pitch.blueTeam.players.length; index++ )
		{
			player = this.pitch.blueTeam.players[ index ];

			if ( player !== this.player )
			{
				// calculate displacement vector
				toPlayer.subVectors( player.object3D.position, this.player.object3D.position );

				// if player within range, push into neighbors array for further
				// consideration.
				if ( toPlayer.lengthSq() < ( this.viewDistance * this.viewDistance ) )
				{
					this._neighbors.push( player );
				}

			}
		}

	};

}() );

/**
 * Calculates the forward component of the steering force.
 * 
 * @returns {number} The force in forward direction.
 */
SteeringBehaviors.prototype.calculateForwardComponent = function() {

	return this.player.getDirection().dot( this._steeringForce );
};

/**
 * Calculates the side component of the steering force.
 * 
 * @returns {number} The force in side direction.
 */
SteeringBehaviors.prototype.calculateSideComponent = ( function() {

	var side = new THREE.Vector3();
	
	return function() {

		// get direction
		var direction = this.player.getDirection();

		// calculate a perpendicular vector
		side.x = -direction.z;
		side.y = direction.y;
		side.z = direction.x;

		return side.dot( this._steeringForce ) * this.player.maxTurnRate;
	};

}() );

/**
 * Test, if the "pursuit" behavior is active.
 * 
 * @returns {boolean} Is the  "pursuit" behavior active?
 */
SteeringBehaviors.prototype.isPursuitOn = function() {

	return this._isOn( SteeringBehaviors.TYPES.PURSUIT );
};

// /////////////////////////////////////////////////////////////////////////////
// START OF BEHAVIORS

/**
 * This behavior moves the player towards a target position.
 * 
 * @param {THREE.Vector3} targetPosition - The target position.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._seek = ( function() {

	var desiredVelocity = new THREE.Vector3();

	return function( targetPosition ) {

		var force = new THREE.Vector3();

		desiredVelocity.subVectors( targetPosition, this.player.object3D.position ).normalize();

		desiredVelocity.multiplyScalar( this.player.maxSpeed );

		force.subVectors( desiredVelocity, this.player.velocity );

		return force;
	};

}() );

/**
 * This behavior is similar to seek but it attempts to arrive at the target with
 * a zero velocity.
 * 
 * @param {THREE.Vector3} targetPosition - The target position.
 * @param {number} deceleration - The deceleration of the player.
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
		toTarget.subVectors( targetPosition, this.player.object3D.position );

		// calculate the distance to the target
		distance = toTarget.length();

		if ( distance > 0 )
		{
			// calculate the speed required to reach the target given the
			// desired deceleration
			speed = distance / deceleration;

			// make sure the velocity does not exceed the max
			speed = Math.min( speed, this.player.maxSpeed );

			// from here proceed just like "seek" except we don't need to
			// normalize the "toTarget" vector because we have already gone to
			// the trouble of calculating its length: distance.
			desiredVelocity.copy( toTarget ).multiplyScalar( speed ).divideScalar( distance );

			force.subVectors( desiredVelocity, this.player.velocity );
		}

		return force;
	};

}() );

/**
 * This behavior creates a force that steers the player towards the ball.
 * 
 * @param {Ball} ball - The soccer ball.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._pursuit = ( function() {

	var toBall = new THREE.Vector3();
	var predcitedPosition = new THREE.Vector3();

	return function( ball ) {
		
		var ballSpeed, lookAheadTime;

		// the lookahead time is proportional to the distance between the ball
		// and the pursuer
		lookAheadTime = 0;

		// calculate displacement vector
		toBall.subVectors( ball.object3D.position, this.player.object3D.position );

		// get speed of ball
		ballSpeed = ball.getSpeed();

		if ( ballSpeed !== 0 )
		{
			lookAheadTime = toBall.length() / ballSpeed;
		}

		// calculate where the ball will be at this time in the future
		this.ball.calculateFuturePosition( lookAheadTime, predcitedPosition );

		// now arrive to the predicted future position of the ball
		return this._arrive( predcitedPosition, SteeringBehaviors.DECELERATION.FAST );
	};

}() );

/**
 * Given the soccer ball and a target position (e.g. goal center) this method
 * returns a force that attempts to position the player between them.
 * 
 * @param {Ball} ball - The soccer ball.
 * @param {THREE.Vector3} target - The position of the target.
 * @param {number} distanceFromTarget - The distance from target.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._interpose = ( function() {

	var displacement = new THREE.Vector3();
	var interposePosition = new THREE.Vector3();

	return function( ball, target, distanceFromTarget ) {

		displacement.subVectors( ball.object3D.position, target ).normalize().multiplyScalar( distanceFromTarget );

		interposePosition.copy( target ).add( displacement );

		return this._arrive( interposePosition, SteeringBehaviors.DECELERATION.MIDDLE );
	};

}() );

/**
 * This calculates a force repelling from the other neighbors.
 * 
 * @returns {THREE.Vector3} The calculated force.
 */
SteeringBehaviors.prototype._separation = ( function() {

	var toNeighbor = new THREE.Vector3();

	return function() {
		
		var index, neighbor, length;

		var force = new THREE.Vector3();

		for ( index = 0; index < this._neighbors.length; index++ )
		{
			neighbor = this._neighbors[ index ];

			// make sure this player isn't included in the calculations
			if ( neighbor !== this.player )
			{
				// calculate displacement vector
				toNeighbor.subVectors( this.player.object3D.position, neighbor.object3D.position );

				// get length
				length = toNeighbor.length();

				// handle zero length. this is necessary if both players have
				// the same position
				if ( length === 0 )
				{
					length = 0.0001;
				}

				// scale the force inversely proportional to the player's
				// distance
				// from its neighbor
				toNeighbor.normalize().divideScalar( length );

				// add force
				force.add( toNeighbor );
			}
		}

		return force;
	};

}() );

// /////////////////////////////////////////////////////////////////////////////
// END OF BEHAVIORS

// /////////////////////////////////////////////////////////////////////////////
// START OF CONTROL METHODS

/* jshint ignore:start */
SteeringBehaviors.prototype.seekOn = function() {

	this._behaviorFlag |= SteeringBehaviors.TYPES.SEEK;
};
SteeringBehaviors.prototype.arriveOn = function() {

	this._behaviorFlag |= SteeringBehaviors.TYPES.ARRIVE;
};
SteeringBehaviors.prototype.pursuitOn = function() {

	this._behaviorFlag |= SteeringBehaviors.TYPES.PURSUIT;
};
SteeringBehaviors.prototype.interposeOn = function( d ) {

	this._behaviorFlag |= SteeringBehaviors.TYPES.INTERPOSE;
	this.interposeDistance = d;
};

SteeringBehaviors.prototype.separationOn = function() {

	this._behaviorFlag |= SteeringBehaviors.TYPES.SEPARATION;
};

SteeringBehaviors.prototype.seekOff = function() {

	if ( this._isOn( SteeringBehaviors.TYPES.SEEK ) )
		this._behaviorFlag ^= SteeringBehaviors.TYPES.SEEK;
};

SteeringBehaviors.prototype.arriveOff = function() {

	if ( this._isOn( SteeringBehaviors.TYPES.ARRIVE ) )
		this._behaviorFlag ^= SteeringBehaviors.TYPES.ARRIVE;
};

SteeringBehaviors.prototype.pursuitOff = function() {

	if ( this._isOn( SteeringBehaviors.TYPES.PURSUIT ) )
		this._behaviorFlag ^= SteeringBehaviors.TYPES.PURSUIT;
};

SteeringBehaviors.prototype.interposeOff = function() {

	if ( this._isOn( SteeringBehaviors.TYPES.INTERPOSE ) )
		this._behaviorFlag ^= SteeringBehaviors.TYPES.INTERPOSE;
};

SteeringBehaviors.prototype.separationOff = function() {

	if ( this._isOn( SteeringBehaviors.TYPES.SEPARATION ) )
		this._behaviorFlag ^= SteeringBehaviors.TYPES.SEPARATION;
};

/* jshint ignore:end */

// /////////////////////////////////////////////////////////////////////////////
// END OF CONTROL METHODS
// types of behavior as flags
SteeringBehaviors.TYPES = {
	NONE : 0x0000,
	SEEK : 0x0001,
	ARRIVE : 0x0002,
	SEPARATION : 0x0004,
	PURSUIT : 0x0008,
	INTERPOSE : 0x0010,
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