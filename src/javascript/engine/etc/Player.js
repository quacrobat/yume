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
 * 
 * @param {number} id - The id of the player.
 */
function Player(id){
	
	THREE.Mesh.call(this);

	Object.defineProperties(this, {
		playerId: {
			value: id,
			configurable: false,
			enumerable: true,
			writable: true
		},
		type: {
			value: "Player",
			configurable: false,
			enumerable: true,
			writable: false
		},
		geometry: {
			value: new THREE.BoxGeometry(4, 4, 4),
			configurable: false,
			enumerable: true,
			writable: false
		},
		material: {
			value: new THREE.MeshBasicMaterial({color: "#ff0000"}),
			configurable: false,
			enumerable: true,
			writable: false
		}
	});
}

Player.prototype = Object.create(THREE.Mesh.prototype);
Player.prototype.constructor = Player;

module.exports = Player;