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
 * @param {number} id - The id of the teammate.
 */
function Teammate( id ) {

	GameEntity.call( this );

	Object.defineProperties( this, {
		type : {
			value : "Teammate",
			configurable : false,
			enumerable : true,
			writable : false
		},
		teammateId : {
			value : id,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );

	// apply exemplary geometry
	this.geometry = new THREE.BoxGeometry( 4, 4, 4 );

	// apply exemplary material
	this.material = new THREE.MeshBasicMaterial( {
		color : "#ff0000"
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