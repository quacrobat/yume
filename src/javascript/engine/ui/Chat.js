/**
 * @file Prototype for ui-element chat.
 * 
 * @author Human Interactive
 */
"use strict";

var PubSub = require("pubsub-js");
var UiElement = require("./UiElement");

var self;

/**
 * Creates the chat-ui.
 * 
 * @constructor
 * @augments UiElement
 */
function Chat() {
	
	UiElement.call(this);
	
	Object.defineProperties(this, {	
		_$chat: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_$input: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_$messages: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_timer: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
	
	self = this;
}

Chat.prototype = Object.create(UiElement.prototype);
Chat.prototype.constructor = Chat;

/**
 * Inits the control
 */
Chat.prototype.init = function(){
	
	this._$chat = global.document.querySelector("#chat");
	this._$messages = global.document.querySelector("#messages");
	this._$input = this._$chat.querySelector(".form-control");
	
	PubSub.subscribe("multiplayer.message", this._onMessage);
};

/**
 * Toogles the chat-ui and sends the message. While the input
 * field for writing a chat message is visible, the controls
 * are disabled. That means typing wasd won't move the player.
 */
Chat.prototype.toogle = function(){
	
	if(this._$chat.style.display === "block"){
		
		// if the input field contains text,
		// send it to the server and to the message box(ui)
		this._checkAndSend();
		
		// hide input field
		this.hide();
		
		// activate controls
		PubSub.publish("controls.active", {isActive: true});
	}
	else
	{
		// show input field
		this.show();
		
		// deactivate controls
		PubSub.publish("controls.active", {isActive: false});
	}
};

/**
 * Shows the chat-ui.
 */
Chat.prototype.show = function(){
	
	this._$chat.style.display = "block";
	this._$input.focus();
};

/**
 * Hides the chat-ui.
 */
Chat.prototype.hide = function(){
	
	this._$chat.style.display = "none";
	this._$input.value = "";
};

/**
 * Posts a message to the chat-box.
 * 
 * @param {stirng} message - The message to post.
 */
Chat.prototype._postMessage = function(message){
	
	// clear timeout
	clearTimeout(this._timer);
	
	// create new DOM-entry for message
	var node = global.document.createElement("div");
	node.textContent = message;
	this._$messages.appendChild(node);
	
	// show message box
	this._$messages.style.display = "block";
	
	// scroll to bottom (to latest messages)
	this._$messages.scrollTop = this._$messages.scrollHeight;
	
	// after some time, hide message box
	this._timer = setTimeout(function(){
		self._$messages.style.display = "none";
	}, 10000);
};

/**
 * Checks and sends the message.
 */
Chat.prototype._checkAndSend = function(){
	
	var message = this._$input.value.trim();
	
	if(message !== ""){
		
		// post message
		this._postMessage(message);
		
		// publish message for sending to server
		PubSub.publish("message.chat", message);
	}
};

/**
 * Handles the "multiplayer.message" topic. Posts a message from other players
 * to a chat-box on the ui.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
Chat.prototype._onMessage = function(message, data){
	
	self._postMessage(data.message);
};

module.exports = new Chat();