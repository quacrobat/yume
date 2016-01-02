/**
 * @file Prototype for ui-element text screen.
 * 
 * @author Human Interactive
 */
"use strict";

var self;

var UiElement = require( "./UiElement" );
var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

/**
 * Creates the text screen.
 * 
 * @constructor
 */
function TextScreen() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$content : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_textKeys : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : true
		},
		_completeCallback : {
			value : undefined,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isDone : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isPrint : {
			value : false,
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
		_textIndex : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_printId : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	self = this;
}

TextScreen.prototype = Object.create( UiElement.prototype );
TextScreen.prototype.constructor = TextScreen;

/**
 * Initializes the control.
 */
TextScreen.prototype.init = function() {

	this._$root = global.document.querySelector( "#text-screen" );
	this._$content = this._$root.querySelector( ".content" );
};

/**
 * Shows the text screen.
 * 
 * @param {object} textKeys - The conversation of the text screen.
 * @param {function} completeCallback - This function is executed, when all
 * texts are shown and the ui-element is going to hide.
 */
TextScreen.prototype.show = function( textKeys, completeCallback ) {

	if ( this.isActive === false )
	{
		this._textKeys = textKeys;
		this._completeCallback = completeCallback;
		this._isDone = false;

		this.isActive = true;
		this._isPrint = true;

		this._printName();
		this._printText();
		this._$root.classList.add( "slideEffect" );
		
		// lock controls
		eventManager.publish( TOPIC.CONTROLS.LOCK, {
			isLocked : true
		} );
	}
};

/**
 * Hides the text screen.
 */
TextScreen.prototype.hide = function() {

	if ( this.isActive === true )
	{
		this.isActive = false;
		this._$root.classList.remove( "slideEffect" );
		this._$content.textContent = "";
		this._textIndex = 0;
		
		// release controls
		eventManager.publish( TOPIC.CONTROLS.LOCK, {
			isLocked : false
		} );
	}
};

/**
 * Handles the "complete-order" of the player. This happens when the player
 * presses the space key.
 */
TextScreen.prototype.complete = function() {

	// text completion
	if ( this._isPrint === true )
	{
		this._isPrint = false;
		clearTimeout( this._printId );
		this._$content.textContent = "";
		this._printName();
		this._$content.textContent += self._textManager.get( this._textKeys[ this._textIndex ].text );
		// switch to next text and start printing
	}
	else if ( this._textIndex < this._textKeys.length - 1 )
	{
		this._isPrint = true;
		this._textIndex++;
		this._$content.textContent = "";
		this._printName();
		this._printText();
		// finish
	}
	else
	{
		if ( this._isDone === false )
		{
			if ( typeof this._completeCallback === "function" )
			{
				this._completeCallback();
			}
			this._isDone = true;
			this.hide();
		}
	}
};

/**
 * Prints a single text of the conversation to the text screen. The printing is
 * done letter by letter.
 * 
 * @param {number} index - The array-index of the current text.
 */
TextScreen.prototype._printText = function( index ) {

	// receive text
	var text = self._textManager.get( self._textKeys[ self._textIndex ].text );
	
	// if index is undefined, set the value to zero
	index = index || 0;

	if ( index < text.length )
	{
		// get the next character of the text
		self._$content.textContent += text[ index ];
		
		// set a timeout to print the next character
		self._printId = setTimeout( self._printText, 75, ++index );
	}
	else
	{
		self._isPrint = false;
	}

};

/**
 * Prints the name of the speaking person.
 */
TextScreen.prototype._printName = function() {

	if ( this._textKeys[ this._textIndex ].name !== undefined )
	{
		var name = this._textManager.get( this._textKeys[ this._textIndex ].name );
		this._$content.textContent += name + ": ";
	}
};

module.exports = new TextScreen();