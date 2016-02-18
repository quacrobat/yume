/**
 * @file Interface for entire stage-handling.
 * 
 * @author Human Interactive
 */
"use strict";

var self;

var logger = require( "./Logger" );
var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var saveGameManager = require( "../etc/SaveGameManager" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );

// stages
var Stage_001 = require( "../stages/Stage_001" );

/**
 * Creates the stage manager.
 * 
 * @constructor
 */
function StageManager() {

	Object.defineProperties( this, {
		_stage : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_total : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_loaded : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isStageChangeActive : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isApplicationStartActive : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// subscriptions
	eventManager.subscribe( TOPIC.APPLICATION.START, this._onApplicationStart );
	eventManager.subscribe( TOPIC.STAGE.START, this._onStageStart );
	eventManager.subscribe( TOPIC.STAGE.CHANGE, this._onStageChange );
	eventManager.subscribe( TOPIC.STAGE.LOADING.START.ALL, this._onLoadStart );
	eventManager.subscribe( TOPIC.STAGE.LOADING.COMPLETE.ALL, this._onLoadComplete );

	self = this;
}

/**
 * Loads the stage with the given ID.
 * 
 * @param {string} stageId - The ID of the stage.
 */
StageManager.prototype.load = function( stageId ) {

	switch ( stageId )
	{
		case "001":

			this._stage = new Stage_001();
			break;

		default:
			throw "ERROR: StageManager: Invalid Stage-ID: " + stageId;
	}

	this._stage.setup();
	
	logger.log( "INFO: StageManager: Start loading stage with ID: %s", stageId );
};

/**
 * Clears the current stage.
 */
StageManager.prototype.clear = function() {

	if ( this._stage !== null )
	{
		this._stage.destroy();
	}
};

/**
 * This method is used load the first stage after application start.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
StageManager.prototype._onApplicationStart = function( message, data ) {

	if ( data !== undefined )
	{
		// set flag
		self._isApplicationStartActive = true;

		// load new stage
		self.load( data.stageId );
	}
	else
	{
		throw "ERROR: StageManager: Application start not possible. Missing message data.";
	}
};

/**
 * This method is used to change from one stage to an other.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
StageManager.prototype._onStageChange = function( message, data ) {

	if ( data !== undefined )
	{
		// show loading screen. execute stage change, when animation ends
		userInterfaceManager.showLoadingScreen( function() {

			// set flag
			self._isStageChangeActive = true;

			// clear stage
			self.clear();

			// load new stage
			self.load( data.stageId );

			// save game
			if ( data.isSaveGame === true )
			{
				saveGameManager.set( saveGameManager.KEYS.stageId, data.stageId );
				
				saveGameManager.save();
			}
		} );

	}
	else
	{
		throw "ERROR: StageManager: Stage change not possible. Missing message data.";
	}
};

/**
 * This method is used to execute the start method of a stage. This happens when all assets
 * are loaded and the player jumps into the stage (from loading screen or menu).
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
StageManager.prototype._onStageStart = function( message, data ) {

	self._stage.start();
};

/**
 * This method is used to count the loading processes per stage.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
StageManager.prototype._onLoadStart = function( message, data ) {

	logger.log( "INFO: StageManager: Start asset loading. Message: %s. URL: %s", message, data.url );

	self._total++;
};

/**
 * This method is checks, if all assets for the current stage are loaded.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
StageManager.prototype._onLoadComplete = function( message, data ) {

	if ( self._isStageChangeActive === true || self._isApplicationStartActive === true )
	{
		logger.log( "INFO: StageManager: Asset loading complete. Message: %s. URL: %s", message, data.url );

		self._loaded++;

		// calculate progress
		var loadingProgress = Math.round( self._loaded * 100 / self._total );

		// inform system about progress
		eventManager.publish( TOPIC.STAGE.LOADING.PROGRESS, {
			loadingProgress : loadingProgress,
			isApplicationStart : self._isApplicationStartActive
		} );

		// check message count
		if ( self._loaded === self._total )
		{
			// publish message to inform the system that all assets are loaded
			// and the stage is ready to enter
			eventManager.publish( TOPIC.STAGE.READY, {
				isApplicationStart : self._isApplicationStartActive
			} );

			// reset attributes
			self._isStageChangeActive = false;
			self._isApplicationStartActive = false;
			self._loaded = 0;
			self._total = 0;

			// log event
			logger.log( "INFO: StageManager: Stage loaded and ready." );
		}
	}
};

module.exports = new StageManager();