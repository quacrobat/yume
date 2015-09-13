/**
 * @file All entities that are part of the game logic
 * inherit from this prototype.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

/**
 * Creates a new state.
 * 
 * @constructor
 *  
 * @param {BaseGameEntity} entity - A reference to the entity.
 */
function GameEntity(){
		
	THREE.Object3D.call( this );
}

GameEntity.prototype = Object.create( THREE.Object3D.prototype );
GameEntity.prototype.constructor = GameEntity;

/**
 * All entities must implement an update function.
 */
GameEntity.prototype.update = function(){};

module.exports = GameEntity;