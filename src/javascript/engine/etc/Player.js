/**
 * @file This prototype represents the character of
 * an other player.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require("three");

/**
 * Creates a player instance.
 * 
 * @constructor
 * @augments THREE.Mesh
 * 
 * @param {number} id - The id of the player.
 */
function Player(id){
	
	THREE.Mesh.call(this);

	Object.defineProperties(this, {
		type: {
			value: "Player",
			configurable: false,
			enumerable: true,
			writable: false
		},
		playerId: {
			value: id,
			configurable: false,
			enumerable: true,
			writable: true
		}
	});
	
	// apply exemplary geometry
	this.geometry = new THREE.BoxGeometry(4, 4, 4);
	
	// apply exemplary material
	this.material = new THREE.MeshBasicMaterial({color: "#ff0000"});
}

Player.prototype = Object.create(THREE.Mesh.prototype);
Player.prototype.constructor = Player;

module.exports = Player;