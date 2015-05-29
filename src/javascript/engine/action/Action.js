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
 * @param {string} type - The type of the action.
 * @param {function} actionCallback - The action callback.
 * @param {string} label - The label of the action.
 */
function Action(type, actionCallback, label) {

	Object.defineProperties(this, {
		type: {
			value: type,
			configurable: false,
			enumerable: true,
			writable: false
		},
		label: {
			value: label || "",
			configurable: false,
			enumerable: true,
			writable: true
		},
		isActive: {
			value: true,
			configurable: false,
			enumerable: true,
			writable: true
		},
		_actionCallback: {
			value: actionCallback,
			configurable: false,
			enumerable: false,
			writable: false
		},
	});
}

/**
 * This method executes the assigned callback function.
 */
Action.prototype.run = function() {

	if (typeof this._actionCallback === "function") {
		this._actionCallback();
	} else {
		throw "ERROR: Action: Assigned callback not of type 'function'.";
	}
};

Action.TYPES = {
	INTERACTION : 0,
	SCRIPT : 1
};

module.exports = Action;