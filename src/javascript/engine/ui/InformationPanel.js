/**
 * @file Prototype for ui-element information panel.
 * 
 * @author Human Interactive
 */

"use strict";

var UiElement = require( "./UiElement" );

/**
 * Creates the information panel.
 * 
 * @constructor
 * @augments UiElement
 */
function InformationPanel() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$content : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
}

InformationPanel.prototype = Object.create( UiElement.prototype );
InformationPanel.prototype.constructor = InformationPanel;

/**
 * Initializes the control.
 */
InformationPanel.prototype.init = function() {

	this._$root = global.document.querySelector( "#information-panel" );
	this._$content = this._$root.querySelector( ".content" );
};

/**
 * Sets the text of the information panel.
 * 
 * @param {string} textKey - The text key of the information panel.
 */
InformationPanel.prototype.setText = function( textKey ) {

	this._$content.innerHTML = this._textManager.get( textKey );
};

module.exports = new InformationPanel();