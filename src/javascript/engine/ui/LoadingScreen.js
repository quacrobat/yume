/**
 * @file Prototype for ui-element loading screen.
 * 
 * @author Human Interactive
 */
"use strict";

var UiElement = require( "./UiElement" );
var EventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var self;

/**
 * Creates the loading screen.
 * 
 * @constructor
 * @augments UiElement
 */
function LoadingScreen() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$loadingScreen : {
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
		_$text : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_transitionEndEvent : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		isActive : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		isReady : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	self = this;
}

LoadingScreen.prototype = Object.create( UiElement.prototype );
LoadingScreen.prototype.constructor = LoadingScreen;

/**
 * Inits the control
 */
LoadingScreen.prototype.init = function() {

	this._transitionEndEvent = this._getTransitionEndEvent();

	this._$loadingScreen = global.document.querySelector( "#loading-screen" );
	this._$progress = this._$loadingScreen.querySelector( ".progress" );
	this._$progressBar = this._$loadingScreen.querySelector( ".progress-bar" );
	this._$text = this._$loadingScreen.querySelector( ".text" );

	// subscriptions
	EventManager.subscribe( TOPIC.STAGE.LOADING.PROGRESS, this._onUpdate );
	EventManager.subscribe(  TOPIC.STAGE.READY, this._onReady );
};

/**
 * Shows the loading screen.
 * 
 * @param {function} callback - This function is executed, when the loading
 * screen is shown.
 */
LoadingScreen.prototype.show = function( callback ) {

	// callback
	function onTransitionEnd( event ) {

		if ( event.target.id === self._$loadingScreen.id )
		{
			// remove event listener, so it runs only once
			self._$loadingScreen.removeEventListener( self._transitionEndEvent, onTransitionEnd );
			if ( typeof callback === "function" )
			{
				callback();
			}
		}
	}

	// add event-listener
	this._$loadingScreen.addEventListener( this._transitionEndEvent, onTransitionEnd );

	// show loading screen
	this._$loadingScreen.classList.add( "fadeIn" );

	// set flags
	this.isActive = true;
	this.isReady = false;
};

/**
 * Hides the loading screen.
 */
LoadingScreen.prototype.hide = function() {

	// callback
	function onTransitionEnd( event ) {

		if ( event.target.id === self._$loadingScreen.id )
		{
			// remove event listener, so it runs only once
			self._$loadingScreen.removeEventListener( self._transitionEndEvent, onTransitionEnd );

			// reset CSS classes
			self._$text.classList.remove( "fadeIn" );
			self._$progress.classList.remove( "fadeOut" );

			// reset progress bar
			self._$progressBar.style.width = "0%";
		}
	}

	// add event-listener
	this._$loadingScreen.addEventListener( this._transitionEndEvent, onTransitionEnd );

	// hide loading screen
	this._$loadingScreen.classList.remove( "fadeIn" );

	// set flags
	this.isActive = false;
};

/**
 * This method updates the progress bar.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
LoadingScreen.prototype._onUpdate = function( message, data ) {

	if ( data.isApplicationStart === false )
	{
		self._$progressBar.style.width = data.loadingProgress + "%";
	}
};

/**
 * Sets loading screen to ready.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
LoadingScreen.prototype._onReady = function( message, data ) {

	if ( data.isApplicationStart === false )
	{
		self.isReady = true;
		self._$progress.classList.add( "fadeOut" );
		self._$text.classList.add( "fadeIn" );
	}
};

module.exports = new LoadingScreen();