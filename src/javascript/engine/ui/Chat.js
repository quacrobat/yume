/**
 * @file Prototype for ui-element chat.
 * 
 * @author Human Interactive
 */
"use strict";

var UiElement = require( "./UiElement" );
var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var self;

/**
 * Creates the chat-ui.
 * 
 * @constructor
 * @augments UiElement
 */
function Chat() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$input : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$messages : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_timer : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		isActive : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );

	self = this;
}

Chat.prototype = Object.create( UiElement.prototype );
Chat.prototype.constructor = Chat;

/**
 * Initializes the control.
 */
Chat.prototype.init = function() {

	this._$root = global.document.querySelector( "#chat" );
	this._$messages = global.document.querySelector( "#messages" );
	this._$input = this._$root.querySelector( ".form-control" );

	eventManager.subscribe( TOPIC.MULTIPLAYER.MESSAGE, this._onMessage );
};

/**
 * Toggles the chat-ui and sends the message. While the input field for writing
 * a chat message is visible, the controls are disabled. That means typing wasd
 * won't move the player.
 */
Chat.prototype.toggle = function() {

	if ( this._$root.style.display === "block" )
	{
		// if the input field contains text,
		// send it to the server and to the message box(ui)
		this._checkAndSend();

		// hide input field
		this.hide();

		// capture controls
		eventManager.publish( TOPIC.CONTROLS.CAPTURE, {
			isCaptured : true
		} );
	}
	else
	{
		// show input field
		this.show();

		// release controls
		eventManager.publish( TOPIC.CONTROLS.CAPTURE, {
			isCaptured : false
		} );
	}
};

/**
 * Shows the chat-ui.
 */
Chat.prototype.show = function() {

	this._$root.style.display = "block";
	this._$input.focus();
	this.isActive = true;
};

/**
 * Hides the chat-ui.
 */
Chat.prototype.hide = function() {

	this._$root.style.display = "none";
	this._$input.value = "";
	this.isActive = false;
};

/**
 * Posts a message to the chat-box.
 * 
 * @param {stirng} message - The message to post.
 */
Chat.prototype._postMessage = function( message ) {

	// clear timeout
	clearTimeout( this._timer );

	// create new DOM-entry for message
	var node = global.document.createElement( "div" );
	node.textContent = message;
	this._$messages.appendChild( node );

	// show message box
	this._$messages.style.display = "block";

	// scroll to bottom (to latest messages)
	this._$messages.scrollTop = this._$messages.scrollHeight;

	// after some time, hide message box
	this._timer = setTimeout( function() {

		self._$messages.style.display = "none";
	}, 10000 );
};

/**
 * Checks and sends the message.
 */
Chat.prototype._checkAndSend = function() {

	var message = this._$input.value.trim();

	if ( message !== "" )
	{
		// post message
		this._postMessage( message );

		// publish chat message for sending to server
		eventManager.publish( TOPIC.MULTIPLAYER.CHAT, message );
	}
};

/**
 * Posts a message from other players to a chat-box.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
Chat.prototype._onMessage = function( message, data ) {

	self._postMessage( data.message );
};

module.exports = new Chat();