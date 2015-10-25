/**
 * @file This prototype represents the character of a teammate.
 * 
 * @author Human Interactive
 */
"use strict";

var GameEntity = require( "../game/entity/GameEntity" );

/**
 * Creates a teammate instance.
 * 
 * @constructor
 * @augments GameEntity
 * 
 * @param {number} id - The multiplayer id of the teammate entity.
 * @param {THREE.Mesh} mesh - The mesh of the teammate.
 */
function Teammate( id, mesh ) {

	GameEntity.call( this, mesh );

	Object.defineProperties( this, {
		multiplayerId : {
			value : id,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
	
}

Teammate.prototype = Object.create( GameEntity.prototype );
Teammate.prototype.constructor = Teammate;

/**
 * Updates the teammate.
 * 
 * @param {THREE.Vector3} position - The new position of the teammate.
 * @param {THREE.Quaternion} quaternion - The new orientation of the teammate.
 */
Teammate.prototype.update = function( position, quaternion ) {

	this.position.copy( position );
	this.quaternion.copy( quaternion );
};

module.exports = Teammate;