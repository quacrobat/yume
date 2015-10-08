/**
 * @file Prototype for ui-element modal dialog.
 * 
 * @author Human Interactive
 */
"use strict";

var UiElement = require( "./UiElement" );
var utils = require( "../etc/Utils" );

var self;
/**
 * Creates the modal label.
 * 
 * @constructor
 */
function ModalDialog() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$modal : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$overlay : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$close : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$headline : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$button : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$content : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	self = this;
}

ModalDialog.prototype = Object.create( UiElement.prototype );
ModalDialog.prototype.constructor = ModalDialog;

/**
 * Inits the control
 */
ModalDialog.prototype.init = function() {

	this._$modal = global.document.querySelector( "#modal-dialog" );
	this._$overlay = global.document.querySelector( ".md-overlay" );
	this._$close = this._$modal.querySelector( ".md-close" );
	this._$headline = this._$modal.querySelector( "h2" );
	this._$button = this._$modal.querySelector( ".btn" );
	this._$content = this._$modal.querySelector( ".md-text" );

	this._$close.addEventListener( "click", this._onClose );
	this._$overlay.addEventListener( "click", this._onClose );
};

/**
 * Shows the modal dialog.
 * 
 * @param {object} textKeys - The texts to display.
 */
ModalDialog.prototype.show = function( textKeys ) {

	// set texts
	this._$headline.textContent = this.textManager.get( textKeys.headline );
	this._$button.textContent = this.textManager.get( textKeys.button );
	this._$content.innerHTML = this.textManager.get( textKeys.content );

	// show modal
	this._$modal.classList.add( "md-show" );

	// release pointer lock
	global.document.dispatchEvent( new global.Event( "releasePointer" ) );
};

/**
 * Hides the modal dialog.
 */
ModalDialog.prototype.hide = function() {

	// hide modal
	this._$modal.classList.remove( "md-show" );

	// lock pointer
	global.document.dispatchEvent( new global.Event( "lockPointer" ) );
};

/**
 * This method handles event for closing the element.
 */
ModalDialog.prototype._onClose = function( event ) {

	event.stopPropagation();
	self.hide();
};

module.exports = new ModalDialog();