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
var camera = require("./Camera");
var controls = require("../controls/FirstPersonControls");
var userInterfaceManager = require("../ui/UserInterfaceManager");
var saveGameManager = require("../etc/SaveGameManager");
var multiplayerManager = require("../etc/MultiplayerManager");
var networkManager = require("../network/NetworkManager");
var utils = require("../etc/Utils");

/**
 * Creates a Bootstrap instance, which initializes the entire application.
 * 
 * @constructor
 */
function Bootstrap(){
	
	this._getStartupParameter();
	
	this._initEngine();
	
	this._loadStage();	
}

/**
 * Gets startup parameter from session context. The data were stored in the
 * session context by the index.html.
 */
Bootstrap.prototype._getStartupParameter = function(){
	
	var parameters = JSON.parse(global.sessionStorage.getItem("parameters"));
	utils.setRuntimeInformation(parameters);
};

/**
 * Initializes the core engine logic.
 */
Bootstrap.prototype._initEngine = function(){
	
	// check capabilities of the runtime environment/ browser 
	if(environment.check() === true){
		
		renderer.init();
		camera.init();
		controls.init();
		userInterfaceManager.init();
		
		// initialize network and multiplayer manager only if necessary
		if(utils.isMultiplayerActive() === true){
			networkManager.init();
			multiplayerManager.init();
		}
	}else{
		
		var message = "ERROR: Bootstrap: The browser does not support all required APIs. Missing APIs: " + environment.unsupportedAPIs;
		global.alert(message);
		throw message;
	}
};

/**
 * Loads the stage. The respective stage is determined by the
 * save game data. If no save game is available, the engine uses
 * the first stage.
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