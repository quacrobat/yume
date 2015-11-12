/**
 * @file Prototype for defining script-based actions.
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates an action.
 * 
 * @constructor
 * 
 * @param {function} actionCallback - The action callback.
 * @param {string} label - The label of the action.
 */
function Action( actionCallback, label ) {

	Object.defineProperties( this, {
		label : {
			value : label || "",
			configurable : false,
			enumerable : true,
			writable : false
		},
		isActive : {
			value : true,
			configurable : false,
			enumerable : true,
			writable : true
		},
		_actionCallback : {
			value : actionCallback,
			configurable : false,
			enumerable : false,
			writable : false
		},
	} );
}

/**
 * This method executes the assigned callback function.
 */
Action.prototype.run = function() {

	if ( typeof this._actionCallback === "function" )
	{
		this._actionCallback();
	}
	else
	{
		throw "ERROR: Action: Assigned callback not type of 'function'.";
	}
};

module.exports = Action;