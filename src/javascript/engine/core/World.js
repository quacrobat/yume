/**
 * @file This prototype contains all important environment data of a stage.
 * 
 * @author Human Interactive
 */

"use strict";

var scene = require( "./Scene" );
var actionManager = require( "../action/ActionManager" );

/**
 * Creates a world object.
 * 
 * @constructor
 * 
 */
function World() {

	Object.defineProperties( this, {

		scene : {
			value : scene,
			configurable : false,
			enumerable : true,
			writable : false
		},
		grounds : {
			value : [],
			configurable : false,
			enumerable : true,
			writable : false
		},
		walls : {
			value : [],
			configurable : false,
			enumerable : true,
			writable : false
		}

	} );
}

/**
 * Adds a 3D object to the internal scene.
 * 
 * @param {THREE.Mesh} ground - The ground to add.
 * 
 */
World.prototype.addObject3D = function( object ) {

	this.scene.add( object );
};

/**
 * Removes a 3D object from the internal scene.
 * 
 * @param {THREE.Mesh} ground - The ground to add.
 * 
 */
World.prototype.removeObject3D = function( object ) {

	this.scene.remove( object );
};

/**
 * Removes all 3D object from the internal scene.
 * 
 */
World.prototype.removeObjects3D = function( object ) {

	this.scene.clear();
};

/**
 * Adds a ground to the internal array.
 * 
 * @param {THREE.Mesh} ground - The ground to add.
 * 
 */
World.prototype.addGround = function( ground ) {

	this.grounds.push( ground );

	// ground objects always needs to be added to the scene
	this.addObject3D( ground );
};

/**
 * Removes a ground from the internal array.
 * 
 * @param {THREE.Mesh} ground - The ground to remove.
 */
World.prototype.removeGround = function( ground ) {

	var index = this.grounds.indexOf( ground );
	this.grounds.splice( index, 1 );

	// ground objects always needs to be removed from the scene
	this.removeObject3D( ground );
};

/**
 * Removes all grounds from the internal array.
 */
World.prototype.removeGrounds = function() {

	for ( var index = this.grounds.length - 1; index >= 0; index-- )
	{
		this.removeGround( this.grounds[ index ] );
	}
};

/**
 * Adds a wall to the internal array.
 * 
 * @param {THREE.Mesh} wall - The wall to add.
 * 
 */
World.prototype.addWall = function( wall ) {

	this.walls.push( wall );

	// wall objects always needs to be added to the scene
	this.addObject3D( wall );
};

/**
 * Removes a wall from the internal array.
 * 
 * @param {THREE.Mesh} wall - The wall to remove.
 */
World.prototype.removeWall = function( wall ) {

	var index = this.walls.indexOf( wall );
	this.walls.splice( index, 1 );

	// wall objects always needs to be removed from the scene
	this.removeObject3D( wall );
};

/**
 * Removes all walls from the internal array.
 */
World.prototype.removeWalls = function() {

	for ( var index = this.walls.length - 1; index >= 0; index-- )
	{
		this.removeWall( this.walls[ index ] );
	}
};

/**
 * Gets an obstacle by index.
 * 
 * @param {number} index - The index of the obstacle.
 * @param {object} obstacle - The target object.
 * 
 */
World.prototype.getObstacle = function( index ) {

	var i = index;

	if ( i < actionManager.interactiveObjects.length )
	{
		return actionManager.interactiveObjects[ i ];
	}
	else
	{
		i -= actionManager.interactiveObjects.length;
	}

	if ( i < actionManager.staticObjects.length )
	{
		return actionManager.staticObjects[ i ];
	}
	else
	{
		throw "ERROR: World: Obstacle index out of range.";
	}

};

/**
 * Returns the number of obstacles in the game world.
 * 
 * @returns {number} The number of obstacles.
 */
World.prototype.getNumberOfObstacles = function() {

	return actionManager.interactiveObjects.length + actionManager.staticObjects.length;
};

/**
 * Clears the world object.
 */
World.prototype.clear = function() {

	this.removeWalls();
	this.removeGrounds();
	this.removeObjects3D();
};

module.exports = new World();