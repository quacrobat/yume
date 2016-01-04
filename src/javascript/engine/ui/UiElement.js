/**
 * @file Super prototype of UI-Elements.
 * 
 * @author Human Interactive
 */

"use strict";

var textManager = require( "../etc/TextManager" );

/**
 * Creates an ui-element.
 * 
 * @constructor
 */
function UiElement() {

	Object.defineProperties( this, {
		// a reference to the root HTML element
		_$root : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// a reference to the text manager
		_textManager : {
			value : textManager,
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );
	
}

/**
 * Gets the correct transitionEnd event.
 * 
 * @returns {string} The name of the transitionEnd event.
 */
UiElement.prototype._getTransitionEndEvent = function() {

	var transition, element;
	
	element = global.document.querySelector( "body" );

	var transitions = {
		"transition" : "transitionend",
		"OTransition" : "oTransitionEnd",
		"MozTransition" : "transitionend",
		"WebkitTransition" : "webkitTransitionEnd"
	};

	for ( transition in transitions )
	{
		if ( element.style[ transition ] !== undefined )
		{
			return transitions[ transition ];
		}
	}
};

/**
 * Gets the correct animationEnd event.
 * 
 * @returns {string} The name of the animationEnd event.
 */
UiElement.prototype._getAnimationEndEvent = function() {

	var animation, element;
	
	element = global.document.querySelector( "body" );

	var animations = {
		"animation" : "animationend",
		"OAnimation" : "oAnimationEnd",
		"msAnimation" : "MSAnimationEnd",
		"WebkitAnimation" : "webkitAnimationEnd"
	};

	for ( animation in animations )
	{
		if ( element.style[ animation ] !== undefined )
		{
			return animations[ animation ];
		}
	}
};

module.exports = UiElement;