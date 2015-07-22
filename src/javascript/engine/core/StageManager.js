/**
 * @file Interface for entire stage-handling.
 * 
 * @author Human Interactive
 */
"use strict";
	
var self;

var PubSub = require("pubsub-js");

var saveGameManager = require("../etc/SaveGameManager");
var userInterfaceManager = require("../ui/UserInterfaceManager");
var utils = require("../etc/Utils");

// stages
var Stage_001 = require("../stages/Stage_001");
var Stage_002 = require("../stages/Stage_002");
var Stage_003 = require("../stages/Stage_003");
var Stage_004 = require("../stages/Stage_004");
var Stage_005 = require("../stages/Stage_005");
var Stage_006 = require("../stages/Stage_006");
var Stage_007 = require("../stages/Stage_007");
var Stage_008 = require("../stages/Stage_008");
var Stage_009 = require("../stages/Stage_009");

/**
 * Creates the stage manager.
 * 
 * @constructor
 */
function StageManager() {

	Object.defineProperties(this, {
		_stage: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_total: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_loaded: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_isStageChangeActive: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_isApplicationStartActive: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
	
	// subscriptions
	PubSub.subscribe("application.start", this._onApplicationStart);
	PubSub.subscribe("stage.start", this._onStageStart);
	PubSub.subscribe("stage.change", this._onStageChange);
	PubSub.subscribe("loading.start", this._onLoadStart);
	PubSub.subscribe("loading.complete", this._onLoadComplete);
	
	self = this;
}

/**
 * Loads the stage with the given ID.
 * 
 * @param {string} stageId - The ID of the stage.
 */
StageManager.prototype.load = function(stageId) {

	switch(stageId) {

		case "001":
	
			this._stage = new Stage_001();
			break;
	
		case "002":
		
			this._stage = new Stage_002();
			break;
		
		case "003":
			
			this._stage = new Stage_003();
			break;
			
		case "004":
			
			this._stage = new Stage_004();
			break;
		
		case "005":
			
			this._stage = new Stage_005();
			break;
	
		case "006":
			
			this._stage = new Stage_006();
			break;
	
		case "007":
			
			this._stage = new Stage_007();
			break;
			
		case "008":
			
			this._stage = new Stage_008();
			break;
			
		case "009":
			
			this._stage = new Stage_009();
			break;
			
		default:
			throw "ERROR: StageManager: Invalid Stage-ID: " + stageId;
	}
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: StageManager: Start loading scene with ID: %s", stageId);
	}
	
	this._stage.setup();
};

/**
 * Clears the current stage.
 */
StageManager.prototype.clear = function() {

	if (this._stage !== null) {
		this._stage.destroy();
	}
};

/**
 * Handles the "application.start" topic. This topic is used load the
 * first scene after application start.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
StageManager.prototype._onApplicationStart = function(message, data){
	
	if(data !== undefined){
		
			// set flag
			self._isApplicationStartActive = true;
			
			// load new stage
			self.load(data.stageId);
	}else{
		throw "ERROR: StageManager: Application start not possible. Missing message data.";
	}
};

/**
 * Handles the "stage.change" topic. This topic is used to change from
 * one stage to an other.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
StageManager.prototype._onStageChange = function(message, data){
	
	if(data !== undefined){
		
		// show loading screen. execute scene change, when animation ends
		userInterfaceManager.showLoadingScreen(function(){
			
			// set flag
			self._isStageChangeActive = true;
		
			// clear stage
			self.clear();
			
			// load new stage
			self.load(data.stageId);
			
			// save game
			if(data.isSaveGame === true){
				saveGameManager.save(data.stageId);
			}
		});
		
	}else{
		throw "ERROR: StageManager: Stage change not possible. Missing message data.";
	}
};

/**
 * Handles the "stage.start" topic. This hierarchical topic is used to indicate
 * the finished setup process of the new scene.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
StageManager.prototype._onStageStart = function(message, data){
	
	self._stage.start();
};

/**
 * Handles the "loading.start" topic. This hierarchical topic is used to count
 * the loads per stage.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
StageManager.prototype._onLoadStart = function(message, data){
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: StageManager: Start asset loading. Message: %s. URL: %s", message, data.url);
	}
	
	self._total++;
};

/**
 * Handles the "loading.complete" topic. This method subscribes to all 
 * topics in the "loading.complete" hierarchy.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
StageManager.prototype._onLoadComplete = function(message, data){
	
	if(self._isStageChangeActive === true || self._isApplicationStartActive === true){
		
		if(utils.isDevelopmentModeActive() === true){
			console.log("INFO: StageManager: Asset loading complete. Message: %s. URL: %s", message, data.url);
		}
		self._loaded++;
		
		// calculate progress
		var loadingProgress = Math.round(self._loaded * 100 / self._total);
		
		// inform ui-element about progress
		PubSub.publish("ui.loading.progress", {loadingProgress: loadingProgress, isApplicationStart: self._isApplicationStartActive});
		
		// check message limit
		if(self._loaded === self._total){
			
			// publish message
			PubSub.publish("ui.loading.ready", {isApplicationStart: self._isApplicationStartActive});
			
			// reset attributes
			self._isStageChangeActive = false;
			self._isApplicationStartActive = false;
			self._loaded = 0;
			self._total = 0;
			
			// log event
			if(utils.isDevelopmentModeActive() === true){
				console.log("INFO: StageManager: Scene completely loaded and ready.");
			}
		}
	}
};

module.exports = new StageManager();