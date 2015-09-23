/**
 * @file All entities that are part of the game logic inherit from this
 * prototype.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates a game entity.
 * 
 * @constructor
 * @augments THREE.Mesh
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * 
 */
function GameEntity( entityManager ) {

	THREE.Mesh.call( this );

	Object.defineProperties( this, {
		entityManager : {
			value : entityManager,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

GameEntity.prototype = Object.create( THREE.Mesh.prototype );
GameEntity.prototype.constructor = GameEntity;

/**
 * All entities must implement an update function.
 */
GameEntity.prototype.update = function() {

};

module.exports = GameEntity;