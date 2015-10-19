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
var controls = require( "../controls/FirstPersonControls" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );
var saveGameManager = require( "../etc/SaveGameManager" );
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
 * Gets startup parameter from session context. The data were stored in the
 * session context by the index.html.
 */
Bootstrap.prototype._getStartupParameter = function() {

	system.init( JSON.parse( global.sessionStorage.getItem( "parameters" ) ) );
};

/**
 * Initializes the core engine logic.
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

		// initialize basic components
		renderer.init();
		camera.init();
		controls.init();
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

	var stageId = null;
	var saveGame = saveGameManager.load();

	if ( saveGame === null )
	{
		stageId = "001";
		saveGameManager.save( stageId );
	}
	else
	{
		stageId = saveGame.stageId;
	}

	eventManager.publish( TOPIC.APPLICATION.START, {
		stageId : stageId
	} );
};

module.exports = Bootstrap;