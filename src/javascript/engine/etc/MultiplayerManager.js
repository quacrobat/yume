/**
 * @file This prototype manages the characters of
 * the other players.
 * 
 * @author Human Interactive
 */
"use strict";

var PubSub = require("pubsub-js");
var THREE = require("three");

var Player = require("./Player");
var scene = require("../core/Scene");
var utils = require("../etc/Utils");

var self;
/**
 * Creates a multiplayer manager instance.
 * 
 * @constructor
 * 
 */
function MultiplayerManager(){

	Object.defineProperties(this, {
		_players: {
			value: [],
			configurable: false,
			enumerable: true,
			writable: false
		}
	});
	
	self = this;
}

/**
 * Inits the multiplayer logic.
 */
MultiplayerManager.prototype.init = function(){
	
	PubSub.subscribe("multiplayer.update", this._onUpdate);
	PubSub.subscribe("multiplayer.status", this._onStatus);
};

/**
 * Handles the "multiplayer.update" topic. This topic is used update
 * the world information of other players. 
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
MultiplayerManager.prototype._onUpdate = (function(){
	
	var player = null;
	
	return function(message, data){
		
		player = self._getPlayer(data.clientId);
		
		// set position and rotation
		player.position.set(data.player.position.x, data.player.position.y, data.player.position.z);
		player.quaternion.set(data.player.quaternion._x, data.player.quaternion._y, data.player.quaternion._z, data.player.quaternion._w);
	};
	
})();

/**
 * Handles the "multiplayer.status" topic. This topic is used update
 * the status of other players. 
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
MultiplayerManager.prototype._onStatus = function(message, data){
	
	var player = null;
	
	if(data.online === true)
	{
		// create new player	
		player = new Player(data.clientId);
		
		// add player
		self._addPlayer(player);
		
		// logging
		if(utils.isDevelopmentModeActive() === true){		
			console.log("INFO: Player with ID %i online.", data.clientId);
		}
	}
	else
	{
		// get the player by its id
		player = self._getPlayer(data.clientId);
		
		// remove player
		self._removePlayer(player);
		
		// logging
		if(utils.isDevelopmentModeActive() === true){			
			console.log("INFO: Player with ID %i offline.", data.clientId);
		}
	}
};

/**
 * Adds a player object.
 * 
 * @param {Player} player - The player object to be added.
 */
MultiplayerManager.prototype._addPlayer = function(player){
	
	// add to internal array
	this._players.push(player);
	
	// add to scene
	scene.add(player);
};

/**
 * Removes a player.
 * 
 * @param {Player} player - The player object to be removed.
 */
MultiplayerManager.prototype._removePlayer = function(player) {

	// remove from array
	var index = this._players.indexOf(player);
	this._players.splice(index, 1);
	
	// remove from scene
	scene.remove(player);
};

/**
 * Gets a player of the internal array.
 * 
 * @param {number} id - The id of the player.
 * 
 * @returns {Player} The player.
 */
MultiplayerManager.prototype._getPlayer = function(id){
	
	var player = null;
	
	for( var index = 0; index < this._players.length; index++){
		if(this._players[index].playerId === id){
			player =  this._players[index];
			break;
		}
	}
	
	if(player === null){
		throw "ERROR: Player with ID " + id + " not existing.";
	}else{
		return player;
	}
};

module.exports = new MultiplayerManager();