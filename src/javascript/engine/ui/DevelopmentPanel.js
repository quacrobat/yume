/**
 * @file Prototype for ui-element development panel. Only if the development
 * mode is active, this control is part of the UI.
 * 
 * @author Human Interactive
 */

"use strict";

var UiElement = require( "./UiElement" );

/**
 * Creates the development panel.
 * 
 * @constructor
 */
function DevelopmentPanel() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$developmentPanel : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$developmentPanelContent : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
}

DevelopmentPanel.prototype = Object.create( UiElement.prototype );
DevelopmentPanel.prototype.constructor = DevelopmentPanel;

/**
 * Initializes the control.
 */
DevelopmentPanel.prototype.init = function() {

	this._$developmentPanel = global.document.querySelector( "#development-panel" );
	this._$developmentPanelContent = this._$developmentPanel.querySelector( ".text" );
};

/**
 * Sets the text of the development panel.
 * 
 * @param {string} text - The text-content of the development panel.
 */
DevelopmentPanel.prototype.setText = function( text ) {

	this._$developmentPanelContent.innerHTML = text;
};

module.exports = new DevelopmentPanel();