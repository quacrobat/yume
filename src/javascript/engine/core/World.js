/**
 * @file This prototype contains all important environment data of a stage.
 * 
 * @author Human Interactive
 */

"use strict";

var actionManager = require( "../action/ActionManager" );

/**
 * Creates a world object.
 * 
 * @constructor
 * 
 */
function World() {

	Object.defineProperties( this, {

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
 * Adds a ground to the internal array.
 * 
 * @param {THREE.Mesh} ground - The ground to add.
 * 
 */
World.prototype.addGround = function( ground ) {

	this.grounds.push( ground );
};

/**
 * Removes a ground from the internal array.
 * 
 * @param {THREE.Mesh} ground - The ground to remove.
 */
World.prototype.removeGround = function( ground ) {

	var index = this.grounds.indexOf( ground );
	this.grounds.splice( index, 1 );
};

/**
 * Removes all grounds from the internal array.
 */
World.prototype.removeGrounds = function() {

	this.grounds.length = 0;
};

/**
 * Adds a wall to the internal array.
 * 
 * @param {THREE.Plane} wall - The wall to add.
 * 
 */
World.prototype.addWall = function( wall ) {

	this.walls.push( wall );
};

/**
 * Removes a wall from the internal array.
 * 
 * @param {THREE.Plane} wall - The wall to remove.
 */
World.prototype.removeWall = function( wall ) {

	var index = this.walls.indexOf( wall );
	this.walls.splice( index, 1 );
};

/**
 * Removes all walls from the internal array.
 */
World.prototype.removeWalls = function() {

	this.walls.length = 0;
};

/**
 * Gets an obstacle by index.
 * 
 * @param {number} index - The index of the obstacle.
 * @param {object} obstacle - The target object.
 * 
 */
World.prototype.getObstacle = ( function() {

	var i;

	return function( index ) {

		i = index;

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

}() );

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
};

module.exports = new World();