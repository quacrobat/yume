/**
 * @file Prototype for ui-element interaction label.
 * 
 * @author Human Interactive
 */

"use strict";

var UiElement = require( "./UiElement" );

/**
 * Creates the interaction label.
 * 
 * @constructor
 * @augments UiElement
 */
function InteractionLabel() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$content : {
			value : null,
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
}

InteractionLabel.prototype = Object.create( UiElement.prototype );
InteractionLabel.prototype.constructor = InteractionLabel;

/**
 * Initializes the control.
 */
InteractionLabel.prototype.init = function() {

	this._$root = global.document.querySelector( "#interaction-label" );
	this._$content = this._$root.querySelector( ".content" );
};

/**
 * Shows the interaction label.
 * 
 * @param {string} textKey - The text key of the corresponding action.
 */
InteractionLabel.prototype.show = function( textKey ) {

	if ( this.isActive === false )
	{
		this._$content.textContent = this._textManager.get( textKey );
		this._$root.style.display = "block";
		this.isActive = true;
	}
};

/**
 * Hides the interaction label.
 */
InteractionLabel.prototype.hide = function() {

	if ( this.isActive === true )
	{
		this._$root.style.display = "none";
		this.isActive = false;
	}
};

module.exports = new InteractionLabel();