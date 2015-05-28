/**
 * @file Super prototype of UI-Elements.
 * 
 * @author Human Interactive
 */

"use strict";

var textManager = require("../etc/TextManager");

/**
 * Creates an ui-element
 * 
 * @constructor
 */
function UiElement() {
	
	this.textManager = textManager; 
}

/**
 * Gets the correct transitionEnd event.
 * 
 * @returns {string} The name of the transitionEnd event.
 */
UiElement.prototype._getTransitionEndEvent = function() {

	var transition;
	var element = global.document.querySelector("body");
	
	var transitions = {
	  'transition':'transitionend',
	  'OTransition':'oTransitionEnd',
	  'MozTransition':'transitionend',
	  'WebkitTransition':'webkitTransitionEnd'
	};

    for(transition in transitions){
        if( element.style[transition] !== undefined ){
            return transitions[transition];
        }
    }
};

module.exports = UiElement;