/**
 * @file Prototype for ui-element menu.
 * 
 * @author Human Interactive
 */

"use strict";

var UiElement = require( "./UiElement" );
var utils = require( "../etc/Utils" );
var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var self;
/**
 * Creates the menu.
 * 
 * @constructor
 */
function Menu() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$menu : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$button : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$text : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$progress : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$progressBar : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
	} );

	self = this;
}

Menu.prototype = Object.create( UiElement.prototype );
Menu.prototype.constructor = Menu;

/**
 * Inits the control
 */
Menu.prototype.init = function() {

	this._$menu = global.document.querySelector( "#menu" );
	this._$button = this._$menu.querySelector( ".btn" );
	this._$text = this._$menu.querySelector( ".text" );
	this._$progress = this._$menu.querySelector( ".progress" );
	this._$progressBar = this._$menu.querySelector( ".progress-bar" );

	// subscriptions
	eventManager.subscribe( TOPIC.STAGE.LOADING.PROGRESS, this._onUpdate );
	eventManager.subscribe( TOPIC.STAGE.READY, this._onReady );

	this._$button.addEventListener( "click", this._onClick );
};

/**
 * Shows the menu.
 * 
 */
Menu.prototype.show = function() {

	this._$text.style.display = "none";
	this._$menu.style.display = "block";
	this._$button.style.display = "block";
};

/**
 * Hides the menu.
 */
Menu.prototype.hide = function() {

	this._$menu.style.display = "none";
};

/**
 * Click-Handler for Menu-Button
 */
Menu.prototype._onClick = function() {

	global.document.dispatchEvent( new global.Event( "lockPointer" ) );

	if ( utils.isFirefox() === true )
	{
		self._$button.style.display = "none";
		self._$text.style.display = "block";
	}
};

/**
 * This method updates the progress bar.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
Menu.prototype._onUpdate = function( message, data ) {

	if ( data.isApplicationStart === true )
	{
		self._$progressBar.style.width = data.loadingProgress + "%";
	}
};

/**
 * Removes the ready progressbar and shows the play-button
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
Menu.prototype._onReady = function( message, data ) {

	if ( data.isApplicationStart === true )
	{
		self._$button.addEventListener( "click", self._publishFinishEvent );
		self._$progress.classList.add( "fadeOut" );
		self._$button.classList.add( "fadeIn" );
	}
};

/**
 * This method is used to inform the system, that the player has started to play the stage.
 */
Menu.prototype._publishFinishEvent = function( message, data ) {

	eventManager.publish( TOPIC.STAGE.START, undefined );
	self._$button.removeEventListener( "click", self._publishFinishEvent );
};

module.exports = new Menu();