/**
 * @file Interface for entire action-handling. This prototype is used in stages
 * to access action-based logic and to create action-entities.
 * 
 * @author Human Interactive
 */

"use strict";

var Action = require( "./Action" );
var InteractiveObject = require( "./InteractiveObject" );
var StaticObject = require( "./StaticObject" );
var ActionTrigger = require( "./ActionTrigger" );

/**
 * Creates the action manager.
 * 
 * @constructor
 */
function ActionManager() {

	Object.defineProperties( this, {
		interactiveObjects : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		staticObjects : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		triggers : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		COLLISIONTYPES : {
			value : {
				AABB : 0,
				OBB : 1
			},
			configurable : false,
			enumerable : false,
			writable : false
		},
		RAYCASTPRECISION : {
			value : {
				AABB : 0,
				OBB : 1,
				FACE : 2
			},
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );
}

/**
 * Updates the action manager and all action objects.
 */
ActionManager.prototype.update = ( function() {

	var index;

	return function() {

		// update interactive objects
		for ( index = 0; index < this.interactiveObjects.length; index++ )
		{
			this.interactiveObjects[ index ].update();
		}

		// update static objects
		for ( index = 0; index < this.staticObjects.length; index++ )
		{
			this.staticObjects[ index ].update();
		}
	};

}() );

/**
 * Creates a new interactive object and stores it to the respective internal
 * array.
 * 
 * @param {THREE.Mesh} mesh - The mesh object.
 * @param {number} collisionType - The type of collision detection.
 * @param {number} raycastPrecision - The precision of the raycast operation.
 * @param {string} label - The label of the action.
 * @param {function} actionCallback - The action callback.
 * 
 * @returns {InteractiveObject} The new interactive object.
 */
ActionManager.prototype.createInteraction = function( mesh, collisionType, raycastPrecision, label, actionCallback ) {

	var interactiveObject = new InteractiveObject( mesh, collisionType, raycastPrecision, new Action( Action.TYPES.INTERACTION, actionCallback, label ) );
	this.addInteractiveObject( interactiveObject );
	return interactiveObject;
};

/**
 * Creates a new static object and stores it to the respective internal array.
 * 
 * @param {THREE.Mesh} mesh - The mesh object.
 * @param {number} collisionType - The type of collision detection.
 * 
 * @returns {StaticObject} The new static object.
 */
ActionManager.prototype.createStatic = function( mesh, collisionType ) {

	var staticObject = new StaticObject( mesh, collisionType );
	this.addStaticObject( staticObject );
	return staticObject;
};

/**
 * Creates a new trigger and stores it to the respective internal array.
 * 
 * @param {string} label - The label of the trigger.
 * @param {THREE.Object3D} object - The radius of the trigger.
 * @param {function} actionCallback - The action callback.
 * 
 * @returns {ActionTrigger} The new action trigger.
 */
ActionManager.prototype.createTrigger = function( label, radius, actionCallback ) {

	var trigger = new ActionTrigger( radius, new Action( Action.TYPES.SCRIPT, actionCallback, label ) );
	this.addTrigger( trigger );
	return trigger;
};

/**
 * Adds a single interactive object to the internal array.
 * 
 * @param {InteractiveObject} interactiveObject - The interactive object to be
 * added.
 */
ActionManager.prototype.addInteractiveObject = function( interactiveObject ) {

	this.interactiveObjects.push( interactiveObject );
};

/**
 * Removes a single interactive object from the internal array.
 * 
 * @param {InteractiveObject} interactiveObject - The interactive object to be
 * removed.
 */
ActionManager.prototype.removeInteractiveObject = function( interactiveObject ) {

	var index = this.interactiveObjects.indexOf( interactiveObject );
	this.interactiveObjects.splice( index, 1 );
};

/**
 * Removes all interactive objects from the internal array.
 */
ActionManager.prototype.removeInteractiveObjects = function() {

	this.interactiveObjects.length = 0;
};

/**
 * Adds a single trigger to the internal array.
 * 
 * @param {ActionTrigger} trigger - The trigger to be added.
 */
ActionManager.prototype.addTrigger = function( trigger ) {

	this.triggers.push( trigger );
};

/**
 * Removes a single trigger from the internal array.
 * 
 * @param {ActionTrigger} trigger - The trigger to be removed.
 */
ActionManager.prototype.removeTrigger = function( trigger ) {

	var index = this.triggers.indexOf( trigger );
	this.triggers.splice( index, 1 );
};

/**
 * Removes all triggers from the internal array.
 */
ActionManager.prototype.removeTriggers = function() {

	this.triggers.length = 0;
};

/**
 * Adds a single static object to the internal array.
 * 
 * @param {StaticObject} staticObject - The static object to be added.
 */
ActionManager.prototype.addStaticObject = function( staticObject ) {

	this.staticObjects.push( staticObject );
};

/**
 * Removes a single static object from the internal array.
 * 
 * @param {StaticObject} staticObject - The static object to be removed.
 */
ActionManager.prototype.removeStaticObject = function( staticObject ) {

	var index = this.staticObjects.indexOf( staticObject );
	this.staticObjects.splice( index, 1 );
};

/**
 * Removes all static objects from the internal array.
 */
ActionManager.prototype.removeStaticObjects = function() {

	this.staticObjects.length = 0;
};

module.exports = new ActionManager();