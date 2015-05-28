/**
 * @file Prototype for ui-element interaction label.
 * 
 * @author Human Interactive
 */

"use strict";

var UiElement = require("./UiElement");

/**
 * Creates the interaction label.
 * 
 * @constructor
 */
function InteractionLabel() {
	
	UiElement.call(this);
	
	Object.defineProperties(this, {	
		_$interactionLabel: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		isInteractionLabelActive: {
			value: false,
			configurable: false,
			enumerable: true,
			writable: true
		}
	});
}

InteractionLabel.prototype = Object.create(UiElement.prototype);
InteractionLabel.prototype.constructor = InteractionLabel;

/**
 * Inits the control
 */
InteractionLabel.prototype.init = function(){
	
	this._$interactionLabel = global.document.querySelector("#interaction-label .label");
};

/**
 * Shows the interaction label.
 * 
 * @param {string} textKey - The label of the corresponding action.
 */
InteractionLabel.prototype.show = function(textKey){
	
	if(this.isInteractionLabelActive === false){
		this._$interactionLabel.textContent = this.textManager.get(textKey);
		this._$interactionLabel.style.display = "block";
		this.isInteractionLabelActive = true;
	}
};

/**
 * Hides the interaction label.
 */
InteractionLabel.prototype.hide = function(){
	
	if(this.isInteractionLabelActive === true){
		this._$interactionLabel.style.display = "none";
		this.isInteractionLabelActive = false;
	}
};

module.exports = new InteractionLabel();