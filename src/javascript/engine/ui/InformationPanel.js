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
		_$informationPanel : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$informationPanelContent : {
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
 * Inits the control
 */
InformationPanel.prototype.init = function() {

	this._$informationPanel = global.document.querySelector( "#information-panel" );
	this._$informationPanelContent = this._$informationPanel.querySelector( ".text" );
};

/**
 * Sets the text of the information panel.
 * 
 * @param {string} textKey - The text-content of the information panel.
 */
InformationPanel.prototype.setText = function( textKey ) {

	this._$informationPanelContent.innerHTML = this.textManager.get( textKey );
};

module.exports = new InformationPanel();