/**
 * @file This prototype contains the entire logic for network-based
 * functionality. The core logic is executed in a separate thread.
 * 
 * @author Human Interactive
 */
"use strict";

var PubSub = require( "pubsub-js" );
var WebSocket = require( "ws" );

var Message = require( "./Message" );
var threadMananger = require( "../core/ThreadManager" );
var logger = require( "../etc/Logger" );

var TOPIC = require( "../core/Topic" );

var script;
var self;
/**
 * Creates the network manager.
 * 
 * @constructor
 * 
 */
function NetworkManager() {

	Object.defineProperties( this, {
		_thread : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	self = this;
}

/**
 * Inits the network manager.
 */
NetworkManager.prototype.init = function() {

	// create thread
	this._thread = threadMananger.createThread( "network", script );

	// setup event listener
	this._thread.onMessage( this._onMessageThread );
	this._thread.onError( this._onErrorThread );

	// begin communication to server
	this._startUp();

	// subscriptions
	PubSub.subscribe( TOPIC.MULTIPLAYER.CHAT, this._onMessageChat );
	PubSub.subscribe( TOPIC.MULTIPLAYER.PLAYER, this._onMessagePlayer );
};

/**
 * Starts the communication to the server. It provides information like hostname
 * and port to the thread.
 */
NetworkManager.prototype._startUp = function( event ) {

	var message = new Message( Message.TYPES.SYSTEM, {
		location : global.window.location.hostname,
		port : NetworkManager.SERVER.PORT
	} );
	this._thread.postMessage( message );
};

/**
 * Sends a chat-message to the server.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
NetworkManager.prototype._onMessageChat = function( message, data ) {

	self._thread.postMessage( new Message( Message.TYPES.CHAT, {
		message : data
	} ) );
};

/**
 * Sends a game-message to the server.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
NetworkManager.prototype._onMessagePlayer = function( message, data ) {

	self._thread.postMessage( new Message( Message.TYPES.GAME, {
		player : data
	} ) );
};

/**
 * Handles the onMessage event. This is fired, when the thread posts a received
 * message to the manager.
 * 
 * @param {object} event - The message event.
 */
NetworkManager.prototype._onMessageThread = function( event ) {

	if ( event.data.type === Message.TYPES.CHAT )
	{
		PubSub.publish( TOPIC.MULTIPLAYER.MESSAGE, event.data.content );
	}
	else if ( event.data.type === Message.TYPES.GAME )
	{
		PubSub.publish( TOPIC.MULTIPLAYER.UPDATE, event.data.content );
	}
	else if ( event.data.type === Message.TYPES.STATUS )
	{
		PubSub.publish( TOPIC.MULTIPLAYER.STATUS, event.data.content );
	}
	else if ( event.data.type === Message.TYPES.INFO )
	{
		logger.log( event.data.content.message );
	}
	else if ( event.data.type === Message.TYPES.ERROR )
	{
		logger.error( event.data.content.message );
	}
};

/**
 * Handles the onError event. This is fired, when the thread posts an error
 * message to the manager.
 * 
 * @param {object} event - The message event.
 */
NetworkManager.prototype._onErrorThread = function( event ) {

	logger.log( "ERROR: NetworkManager: Runtime-Error in thread \"NetworkManager\", line %s in %s: %s", event.lineno, event.filename, event.message );

};

/**
 * The script for the thread. It creates and manages a WebSocket for
 * communication with the server.
 */
script = function() {

	var ws = null;

	function init( location, port ) {

		ws = new WebSocket( "ws://" + location + ":" + port );

		ws.onopen = function( event ) {

			self.postMessage( {
				type : 4,
				content : {
					message : "INFO: NetworkManager: Connected to multiplayer-server: " + location + " port: " + port
				}
			} );
		};

		ws.onclose = function( event ) {

			self.postMessage( {
				type : 4,
				content : {
					message : "INFO: NetworkManager: Disconnected from multiplayer-server: " + location + " port: " + port
				}
			} );
		};

		ws.onmessage = function( event ) {

			// convert string to JSON before posting to main-thread
			self.postMessage( JSON.parse( event.data ) );
		};

		ws.onerror = function( error ) {

			self.postMessage( {
				type : 5,
				content : {
					message : "ERROR: NetworkManager: WebSocket Error: " + error
				}
			} );
		};
	}

	function onMessage( event ) {

		// evaluate event data
		if ( event.data !== null && event.data.type !== null )
		{
			// startup
			if ( event.data.type === 0 )
			{
				if ( ws === null )
				{
					init( event.data.content.location, event.data.content.port );
				}
				// message
			}
			else if ( event.data.type === 1 || event.data.type === 2 || event.data.type === 3 )
			{
				if ( ws !== null )
				{
					if ( ws.readyState === WebSocket.OPEN )
					{
						// convert JSON to string before sending to server
						ws.send( JSON.stringify( event.data ) );
					}
					else if ( ws.readyState === WebSocket.CONNECTING )
					{
						self.postMessage( {
							type : 4,
							content : {
								message : "ERROR: NetworkManager: The connection to the server has not yet been established. Please try againg."
							}
						} );
					}
					else if ( ws.readyState === WebSocket.CLOSING && ws.readyState === WebSocket.CLOSED )
					{
						self.postMessage( {
							type : 4,
							content : {
								message : "ERROR: NetworkManager: Messaging not possible. The connection to the server has been closed or could not be opened."
							}
						} );
					}
				}
				else
				{
					self.postMessage( {
						type : 4,
						content : {
							message : "ERROR: NetworkManager: Messaging not possible. No connection to server."
						}
					} );
				}
			}
		}
	}

	self.onmessage = onMessage;
};

NetworkManager.SERVER = {
	PORT : 8000
};

module.exports = new NetworkManager();