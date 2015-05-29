/**
 * @file This prototype contains the entire logic for starting
 * the application.
 * 
 * @author Human Interactive
 */

"use strict";

var PubSub = require("pubsub-js");

var environment = require("./Environment");
var renderer = require("./Renderer");
var controls = require("../controls/FirstPersonControls");
var userInterfaceManager = require("../ui/UserInterfaceManager");
var saveGameManager = require("../etc/SaveGameManager");
var networkManager = require("../etc/NetworkManager");
var multiplayerManager = require("../etc/MultiplayerManager");
var utils = require("../etc/Utils");

/**
 * Creates a Bootstrap instance, which inits the entire engine.
 * 
 * @constructor
 */
function Bootstrap(){
	
	this._initEngine();
	
	this._loadStage();	
}

/**
 * Inits the entire engine logic.
 * 
 */
Bootstrap.prototype._initEngine = function(){
	
	// check capabilities of the runtime environment/ browser 
	if(environment.check() === true){
		
		renderer.init();
		controls.init();
		userInterfaceManager.init();
		
		// initialize network and multiplayer manager only if necessary
		if(utils.isMultiplayerActive() === true){
			networkManager.init();
			multiplayerManager.init();
		}
	}else{
		throw "ERROR: Bootstrap: The browser does not support all required APIs. Missing APIs: " + environment.unsupportedAPIs;
	}
};

/**
 * Loads the stage.
 * 
 */
Bootstrap.prototype._loadStage = function(){
	
	var stageId = null;
	var saveGame = saveGameManager.load();
	
	if(saveGame === null){
		stageId = "001";
		saveGameManager.save(stageId);
	}else{
		stageId = saveGame.stageId;
	}
	
	PubSub.publish("application.start", {stageId: stageId});
};

module.exports = Bootstrap;