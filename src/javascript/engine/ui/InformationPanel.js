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
 */
function InformationPanel() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$root : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
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

	this._$content.innerHTML = this.textManager.get( textKey );
};

module.exports = new InformationPanel();