/**
 * @file Prototype to define a goal for a soccer pitch.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var MovingEntity = require( "./MovingEntity" );
var world = require( "../../core/World" );

/**
 * Creates a soccer ball.
 * 
 * @constructor
 * @augments MovingEntity
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {number} ballSize - The size (radius) of the ball.
 * @param {number} mass - The mass of the entity.
 * 
 */
function Ball( entityManager, ballSize, mass ) {

	MovingEntity.call( this, entityManager, null, ballSize, new THREE.Vector3(), mass );

	Object.defineProperties( this, {
		previousPosition : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		}
	} );

	// setup mesh components
	var geometry = new THREE.SphereGeometry( ballSize, 20, 20 );
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, ballSize, 0 ) );
	
	var material = new THREE.MeshBasicMaterial( {
		color : 0xffffff
	} );
	
	// apply mesh
	this.object3D = new THREE.Mesh( geometry, material );
}

Ball.prototype = Object.create( MovingEntity.prototype );
Ball.prototype.constructor = Ball;

/**
 * Updates the ball physics, tests for any collisions and adjusts the ball's
 * velocity accordingly.
 */
Ball.prototype.update = ( function() {

	var newVelocity = new THREE.Vector3();

	return function() {
		
		// save current position of ball
		this.previousPosition.copy( this.object3D.position );
		
		// do wall collision test
		this._testCollisionWithWalls();

		// simulate friction. make sure the speed is positive first though
		if ( this.velocity.lengthSq() > ( Ball.FRICTION * Ball.FRICTION ) )
		{
			newVelocity.copy( this.velocity ).normalize().multiplyScalar( Ball.FRICTION );

			this.velocity.add( newVelocity );

			this.object3D.position.add( this.velocity );
			
			// update the orientation if the vehicle has a non zero velocity
			if ( this.velocity.lengthSq() > 0.00000001 )
			{
				this.rotateToDirection( this.velocity );
			}
		}
	};

}() );

/**
 * Applies a force to the ball in the direction of heading. Truncates the new
 * velocity to make sure it doesn't exceed the max allowable.
 * 
 * @param {THREE.Vector3} direction - The direction of the kick.
 * @param {number} force - The amount of force.
 */
Ball.prototype.kick = function( direction, force ) {

	var acceleration = new THREE.Vector3();

	// ensure direction is normalized
	direction.normalize();

	// calculate the acceleration
	acceleration.copy( direction ).multiplyScalar( force ).divideScalar( this.mass );

	// update the velocity
	this.velocity.copy( acceleration );
};

/**
 * This can be used to vary the accuracy of a player's kick. Just call it prior
 * to kicking the ball using the ball target as a parameter.
 * 
 * @param {THREE.Vector3} target - The target of the kick.
 */
Ball.prototype.addNoiseToKick = ( function() {

	var toTarget = new THREE.Vector3();

	var rotationMatrix = new THREE.Matrix4();

	return function( target ) {

		// create displacement
		var displacement = ( Math.PI - Math.PI * Ball.ACCURACY ) * THREE.Math.randFloat( -1, 1 );

		// create rotation matrix from displacement value
		rotationMatrix.makeRotationY( displacement );

		// calculate vector displacement
		toTarget.subVectors( target, this.object3D.position ).applyMatrix4( rotationMatrix );

		// calculate new target
		target.addVectors( toTarget, this.object3D.position );

		return;
	};

}() );

/**
 * Given a force and a distance to cover given by two vectors, this method
 * calculates how long it will take the ball to travel between the two points.
 * 
 * @param {THREE.Vector3} start - The start point of the distance.
 * @param {THREE.Vector3} end - The end point of the distance.
 * @param {number} force - The amount of force.
 * 
 * @returns {number} The time value.
 */
Ball.prototype.calculateTimeToCoverDistance = function( start, end, force ) {

	// this will be the velocity of the ball in the next time step *if*
	// the player was to make the pass
	var speed = force / this.mass;

	// calculate the velocity at B using the equation: v^2 = u^2 + 2as

	// first calculate s (the distance between the two positions)
	var distanceToCover = start.distanceTo( end );

	var term = ( speed * speed ) + ( 2 * distanceToCover * Ball.FRICTION );

	// if (u^2 + 2as) is negative it means the ball cannot reach point B
	if ( term <= 0.0 )
	{
		return -1.0;
	}

	// it IS possible for the ball to reach B and we know its speed when it
	// gets there, so now it's easy to calculate the time using the equation
	//
	// t = ( v-u ) / a
	//

	return ( Math.sqrt( term ) - speed ) / Ball.FRICTION;

};

/**
 * Given a time this method returns the ball position at that time in the
 * future.
 * 
 * @param {number} time - The time value.
 * @param {THREE.Vector3} predictedPosition - The target vector.
 * 
 */
Ball.prototype.calculateFuturePosition = ( function() {

	var ut = new THREE.Vector3();
	var scalarToVector = new THREE.Vector3();

	return function( time, predictedPosition ) {

		// using the equation s = ut + 1/2at^2, where s = distance,
		// a = friction, u = start velocity

		// calculate the ut term, which is a vector
		ut.copy( this.velocity ).multiplyScalar( time );

		// calculate the 1/2at^2 term, which is scalar
		var half_a_t_squared = 0.5 * Ball.FRICTION * time * time;

		// turn the scalar quantity into a vector by multiplying the value with
		// the normalized velocity vector (because that gives the direction)
		scalarToVector.copy( this.velocity ).normalize().multiplyScalar( half_a_t_squared );

		// the predicted position is the balls position plus these two terms
		// ( ut, scalarToVector )
		predictedPosition.copy( this.object3D.position ).add( ut ).add( scalarToVector );
	};

}() );

/**
 * Positions the ball at the desired location and sets the ball's velocity to
 * zero.
 * 
 * @param {THREE.Vector3} position - The new position of the ball.
 */
Ball.prototype.placeAtPosition = function( position ) {

	if ( position === undefined )
	{
		this.object3D.position.set( 0, 0, 0 );
	}
	else
	{
		this.object3D.position.copy( position );
	}

	this.velocity.set( 0, 0, 0 );
};

/**
 * This is used by players and goalkeepers to "trap" a ball, to stop it dead.
 * That player is then assumed to be in possession of the ball.
 * 
 * @param {THREE.Vector3} position - The new position of the ball.
 */
Ball.prototype.trap = function() {

	this.velocity.set( 0, 0, 0 );
};

/**
 * Tests to see if the ball has collided with a ball and reflects the ball's
 * velocity accordingly.
 */
Ball.prototype._testCollisionWithWalls = ( function() {

	var raycaster = new THREE.Raycaster();

	return function() {
		
		var index, intersects;

		// this will be used to track the distance to the closest wall
		var distanceToClosestWall = Infinity;

		// this will keep track of the normal of the closest wall
		var normal = null;

		// calculate reach of the ray
		var far = this.boundingRadius + this.getSpeed();

		// setup raycaster
		raycaster.ray.origin.copy( this.object3D.position );
		raycaster.ray.direction.copy( this.velocity ).normalize();
		raycaster.far = far;

		// iterate through each wall and calculate if the ball intersects. If it
		// does then store the normal of the closest intersection point.
		for ( index = 0; index < world.walls.length; index++ )
		{
			intersects = raycaster.intersectObject( world.walls[ index ] );

			if ( intersects.length > 0 )
			{
				// if the distance of the intersection point is smaller
				// than the current distanceToClosestWall and smaller than the
				// speed of the ball, continue
				if ( intersects[ 0 ].distance < distanceToClosestWall )
				{
					distanceToClosestWall = intersects[ 0 ].distance;

					normal = intersects[ 0 ].face.normal;
					
					normal.transformDirection( world.walls[ index ].matrixWorld );
				}
			}
		}

		if ( normal !== null )
		{
			this.velocity.reflect( normal );
		}
	};

}() );

// In the range zero to 1.0. adjusts the amount of noise added to a kick,
// the lower the value the worse the players get.
Ball.ACCURACY = 0.99;

// This value will decrease the velocity of the ball.
Ball.FRICTION = -0.005;

// physics
Ball.SIZE = 1;
Ball.MASS = 1;

module.exports = Ball;