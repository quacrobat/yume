/**
 * @file This prototype contains all important environment data of a stage.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var scene = require( "./Scene" );
var actionManager = require( "../action/ActionManager" );
var entityManager = require( "../game/entity/EntityManager" );
var GameEntity = require( "../game/entity/GameEntity" );

/**
 * Creates a world object.
 * 
 * @constructor
 */
function World() {

	Object.defineProperties( this, {

		player : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true,
		},
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
		},
		// this is just a reference to the action objects of the action manager
		obstacles : {
			value : actionManager._actionObjects,
			configurable : false,
			enumerable : true,
			writable : false
		}

	} );
}

/**
 * Initializes the world.
 */
World.prototype.init = function() {

	// create player instance
	this.player = entityManager.createPlayer( this );

	// set the scope of this entity to WORLD. it won't get deleted within a
	// stage change
	this.player.scope = GameEntity.SCOPE.WORLD;

	// add player to world
	this.addObject3D( this.player.object3D );
};

/**
 * Adds a 3D object to the internal scene.
 * 
 * @param {THREE.Mesh} ground - The ground to add.
 */
World.prototype.addObject3D = function( object ) {

	this.scene.add( object );
};

/**
 * Removes a 3D object from the internal scene.
 * 
 * @param {THREE.Mesh} ground - The ground to add.
 */
World.prototype.removeObject3D = function( object ) {

	this.scene.remove( object );
};

/**
 * Removes all 3D object from the internal scene.
 */
World.prototype.removeObjects3D = function( object ) {

	this.scene.clear();
};

/**
 * Adds a ground to the internal array.
 * 
 * @param {THREE.Mesh} ground - The ground to add.
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
 * Calculates neighbors for a given vehicle.
 * 
 * @param {Vehicle} vehicle - The given vehicle.
 * @param {number} viewDistance - The view distance of the vehicle.
 * @param {object} neighbors - The calculated neighbors.
 */
World.prototype.calculateNeighbors = ( function() {

	var toEntity = new THREE.Vector3();

	return function( vehicle, viewDistance, neighbors ) {
		
		var index, entity;

		// reset array
		neighbors.length = 0;

		// iterate over all entities
		for ( index = 0; index < entityManager.entities.length; index++ )
		{
			entity = entityManager.entities[ index ];

			if ( entity !== vehicle )
			{
				// calculate displacement vector
				toEntity.subVectors( entity.position, vehicle.object3D.position );

				// if entity within range, push into neighbors array for further
				// consideration.
				if ( toEntity.lengthSq() < ( viewDistance * viewDistance ) )
				{
					neighbors.push( entity );
				}

			}
			
		}
		
	};

}() );

/**
 * Clears the world object.
 */
World.prototype.clear = function() {

	this.removeWalls();
	this.removeGrounds();
	this.removeObjects3D();
};

module.exports = new World();