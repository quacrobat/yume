/**
 * @file All entities that are part of the game logic inherit from this
 * prototype.
 * 
 * @author Human Interactive
 */

"use strict";

var nextId = 0;

/**
 * Creates a game entity.
 * 
 * @constructor
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {THREE.Object3D} object3D - The 3D object of the entity.
 * @param {number} boundingRadius - The bounding radius of the entity.
 */
function GameEntity( entityManager, object3D, boundingRadius ) {

	Object.defineProperties( this, {
		id : {
			value : nextId++,
			configurable : false,
			enumerable : true,
			writable : false
		},
		entityManager : {
			value : entityManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		object3D : {
			value : object3D,
			configurable : false,
			enumerable : true,
			writable : true
		},
		boundingRadius : {
			value : boundingRadius || 0,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

/**
 * All entities must implement an update function.
 */
GameEntity.prototype.update = function() {

};

/**
 * If an entity wants to communicate with other entities, it must implement this
 * method. Besides, the entity needs to register itself at the event manager.
 * 
 * @param {Telegram} telegram - The telegram of the message.
 * 
 * @returns {boolean} Is the message handled successfully?
 */
GameEntity.prototype.handleMessage = function( telegram ) {

	return false;
};

module.exports = GameEntity;