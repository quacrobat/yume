/**
 * @file All entities that are part of the game logic inherit from this
 * prototype.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var nextId = 0;

/**
 * Creates a game entity.
 * 
 * @constructor
 * 
 * @param {THREE.Object3D} object3D - The 3D object of the entity.
 */
function GameEntity( object3D ) {

	Object.defineProperties( this, {
		// a unique id to identify a game entity
		id : {
			value : nextId++,
			configurable : false,
			enumerable : true,
			writable : false
		},
		// each game entity is a 3D object
		object3D : {
			value : object3D || new THREE.Object3D(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// this will be used for collision detection
		boundingRadius : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this will be used to determine the lifetime of a game entity
		scope : {
			value : GameEntity.SCOPE.STAGE,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the following are shortcuts to object3D properties
		position : {
			configurable : false,
			enumerable : true,
			get : function() {

				return this.object3D.position;
			},
			set : function( value ) {

				this.object3D.position.copy( value );
			}
		},
		rotation : {
			configurable : false,
			enumerable : true,
			get : function() {

				return this.object3D.rotation;
			},
			set : function( value ) {

				this.object3D.rotation.copy( value );
			}
		},
		quaternion : {
			configurable : false,
			enumerable : true,
			get : function() {

				return this.object3D.quaternion;
			},
			set : function( value ) {

				this.object3D.quaternion.copy( value );
			}
		},
		scale : {
			configurable : false,
			enumerable : true,
			get : function() {

				return this.object3D.scale;
			},
			set : function( value ) {

				this.object3D.scale.copy( value );
			}
		}

	} );
}

/**
 * All entities must implement an update function.
 * 
 * @param {number} delta - The time delta value.
 */
GameEntity.prototype.update = function( delta ) {

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

/**
 * Updates the matrix of the 3D object.
 */
GameEntity.prototype.updateMatrix = function() {

	this.object3D.updateMatrix();
};

/**
 * Updates the world matrix of the 3D object and its children.
 */
GameEntity.prototype.updateMatrixWorld = function() {

	this.object3D.updateMatrixWorld();
};

GameEntity.SCOPE = {
	WORLD : 0,
	STAGE : 1
};

module.exports = GameEntity;