/**
 * @file Interface for entire stage-handling.
 * 
 * @author Human Interactive
 */
"use strict";

var self;

var EventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var saveGameManager = require( "../etc/SaveGameManager" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );
var logger = require( "../etc/Logger" );

// stages
var Stage_001 = require( "../stages/Stage_001" );
var Stage_002 = require( "../stages/Stage_002" );
var Stage_003 = require( "../stages/Stage_003" );
var Stage_004 = require( "../stages/Stage_004" );
var Stage_005 = require( "../stages/Stage_005" );
var Stage_006 = require( "../stages/Stage_006" );
var Stage_007 = require( "../stages/Stage_007" );
var Stage_008 = require( "../stages/Stage_008" );
var Stage_009 = require( "../stages/Stage_009" );
var Stage_010 = require( "../stages/Stage_010" );
var Stage_011 = require( "../stages/Stage_011" );

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
	EventManager.subscribe( TOPIC.APPLICATION.START, this._onApplicationStart );
	EventManager.subscribe( TOPIC.STAGE.START, this._onStageStart );
	EventManager.subscribe( TOPIC.STAGE.CHANGE, this._onStageChange );
	EventManager.subscribe( TOPIC.STAGE.LOADING.START.ALL, this._onLoadStart );
	EventManager.subscribe( TOPIC.STAGE.LOADING.COMPLETE.ALL, this._onLoadComplete );

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

		case "010":

			this._stage = new Stage_010();
			break;

		case "011":

			this._stage = new Stage_011();
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
				saveGameManager.save( data.stageId );
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
		EventManager.publish( TOPIC.STAGE.LOADING.PROGRESS, {
			loadingProgress : loadingProgress,
			isApplicationStart : self._isApplicationStartActive
		} );

		// check message count
		if ( self._loaded === self._total )
		{
			// publish message
			EventManager.publish( TOPIC.STAGE.READY, {
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