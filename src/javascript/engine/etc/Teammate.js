/**
 * @file This prototype represents the character of a teammate.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );
var GameEntity = require( "../game/entity/GameEntity" );

/**
 * Creates a teammate instance.
 * 
 * @constructor
 * @augments GameEntity
 * 
 * @param {number} id - The multiplayer id of the teammate entity.
 */
function Teammate( id ) {

	GameEntity.call( this );

	Object.defineProperties( this, {
		multiplayerId : {
			value : id,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );

	// apply exemplary mesh object
	this.object3D = new THREE.Mesh( new THREE.BoxGeometry( 4, 4, 4 ),  new THREE.MeshBasicMaterial( {color : "#ff0000"} ) );
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

	this.object3D.position.copy( position );
	this.object3D.quaternion.copy( quaternion );
};

module.exports = Teammate;