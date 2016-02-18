/**
 * @file This prototype contains the entire logic for starting the application.
 * 
 * @author Human Interactive
 */

"use strict";

var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var environment = require( "./Environment" );
var renderer = require( "./Renderer" );
var camera = require( "./Camera" );
var system = require( "./System" );
var world = require( "./World" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );
var saveGameManager = require( "../etc/SaveGameManager" );
var settingsManager = require( "../etc/SettingsManager" );
var multiplayerManager = require( "../etc/MultiplayerManager" );
var networkManager = require( "../network/NetworkManager" );

/**
 * Creates a Bootstrap instance, which initializes the entire application.
 * 
 * @constructor
 */
function Bootstrap() {

	this._getStartupParameter();

	this._initEngine();

	this._loadStage();
}

/**
 * This method provides the startup parameter for the engine from session
 * context. The data were stored originally by index.ejs and will be deleted
 * after parsing.
 */
Bootstrap.prototype._getStartupParameter = function() {
	
	// read and parse parameter from session context
	var parameter = JSON.parse( global.sessionStorage.getItem( "parameter" ) );
	
	// remove the parameter from session context
	global.sessionStorage.removeItem( "parameter" );

	// initialize the engine with the parameter object
	system.init( parameter );
};

/**
 * Initializes the core components of the engine.
 */
Bootstrap.prototype._initEngine = function() {

	var message;

	// check capabilities of the runtime environment/ browser
	if ( environment.isCompatible() === true )
	{
		// if the browser supports a touch-based user interface, show info
		// message
		if ( environment.isTouchDevice() === true )
		{
			message = "Please note: This demo works only with keyboard and mouse.";
			global.alert( message );
		}
		
		// load savegame and settings
		saveGameManager.load();
		settingsManager.load();

		// initialize basic components
		renderer.init();
		camera.init();
		world.init();
		userInterfaceManager.init();

		// initialize network and multiplayer manager only if necessary
		if ( system.isMultiplayerActive === true )
		{
			networkManager.init();
			multiplayerManager.init();
		}
	}
	else
	{
		message = "ERROR: Bootstrap: The browser does not support all required APIs. Missing APIs: " + environment.unsupportedAPIs;
		global.alert( message );
		throw message;
	}
};

/**
 * Loads the stage. The respective stage is determined by the save game data. If
 * no save game is available, the engine uses the first stage.
 */
Bootstrap.prototype._loadStage = function() {

	eventManager.publish( TOPIC.APPLICATION.START, {
		stageId : "001"
	} );
};

module.exports = Bootstrap;