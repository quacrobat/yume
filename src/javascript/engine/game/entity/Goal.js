/**
 * @file Prototype to define a goal for a soccer pitch.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );
var GameEntity = require( "./GameEntity" );

/**
 * Creates a goal.
 * 
 * @constructor
 * @augments GameEntity
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {THREE.Vector3} position - The position of the goal
 * @param {THREE.Vector3} size - A vector representing the the size of the goal.
 * @param {THREE.Vector3} facing - A vector representing the facing direction of
 * the goal.
 * 
 */
function Goal( entityManager, position, size, facing, color ) {

	GameEntity.call( this, entityManager );

	Object.defineProperties( this, {
		facing : {
			value : facing,
			configurable : false,
			enumerable : true,
			writable : false
		},
		size : {
			value : size,
			configurable : false,
			enumerable : true,
			writable : false
		},
		leftPost : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		rightPost : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		center : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		numberGoalsScored : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
	
	// setup mesh components
	var geometry = new THREE.BoxGeometry( this.size.x, this.size.y, this.size.z );
	var material = new THREE.MeshBasicMaterial( {
		color : color
	} );
	
	// apply mesh
	this.object3D = new THREE.Mesh( geometry, material );

	// apply position
	this.object3D.position.copy( position );

	// calculate posts
	this._calculatePosts();

	// calculate center of goal line
	this.center.addVectors( this.leftPost, this.rightPost ).multiplyScalar( 0.5 );
}

Goal.prototype = Object.create( GameEntity.prototype );
Goal.prototype.constructor = Goal;

/**
 * Given the current ball position, this method returns true if the ball is
 * inside the goal and increments "numberGoalsScored".
 * 
 * @param {SoccerBall} ball - The soccer ball.
 * 
 * @returns {boolean} Is the ball behind the goal line?
 */
Goal.prototype.isScored = function( ball ) {

	var isScored = false;

	// goal of team blue
	if ( this.facing.x > 0 )
	{
		if ( ball.object3D.position.x < this.center.x && ball.previousPosition.x > this.center.x )
		{
			isScored = true;
			this.numberGoalsScored++;
		}

	}
	// goal of team red
	else
	{
		if ( ball.object3D.position.x > this.center.x && ball.previousPosition.x < this.center.x )
		{
			isScored = true;
			this.numberGoalsScored++;
		}
	}

	return isScored;

};

/**
 * Resets the scored goals.
 */
Goal.prototype.resetGoalsScored = function() {

	this.numberGoalsScored = 0;
};

/**
 * Calculate the left and the right post of the goal.
 */
Goal.prototype._calculatePosts = function() {

	// calculate half size vector
	var halfSize = this.size.clone().multiplyScalar( 0.5 );

	// the values of the posts depends of the facing of the goal.
	// the post are calculated form the players's viewpoint.
	if ( this.facing.x > 0 )
	{
		this.leftPost.x = this.object3D.position.x + halfSize.x;
		this.leftPost.z = this.object3D.position.z - halfSize.z;
		
		this.rightPost.x = this.object3D.position.x + halfSize.x;
		this.rightPost.z = this.object3D.position.z + halfSize.z;
	}
	else
	{
		this.leftPost.x = this.object3D.position.x - halfSize.x;
		this.leftPost.z = this.object3D.position.z - halfSize.z;
		
		this.rightPost.x = this.object3D.position.x - halfSize.x;
		this.rightPost.z = this.object3D.position.z + halfSize.z;
	}
};

module.exports = Goal;