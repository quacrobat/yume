/**
 * @file Interface for entire action-handling. This prototype is used in stages
 * to access action-based logic and to create action-entities.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );
var Action = require( "./Action" );
var ActionObject = require( "./ActionObject" );
var ActionTrigger = require( "./ActionTrigger" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );
var logger = require( "../core/Logger" );

var self;

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
		_raycaster : {
			value : new THREE.Raycaster(),
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

	// subscriptions
	eventManager.subscribe( TOPIC.ACTION.INTERACTION, this._onInteraction );

	self = this;
}

/**
 * Updates the action manager and all action objects.
 * 
 * @param {Player} player - The player object.
 */
ActionManager.prototype.update = function( player ) {

	var index;

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
	
	// update triggers
	for ( index = 0; index < this.triggers.length; index++ )
	{
		this.triggers[ index ].update( player.position );
	}

	// check interaction objects
	this._checkInteraction( player.getHeadPosition(), player.getDirection() );
};

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
 * @returns {ActionObject} The new interactive object.
 */
ActionManager.prototype.createInteraction = function( mesh, collisionType, raycastPrecision, label, actionCallback ) {

	var interactiveObject = new ActionObject( mesh, collisionType, raycastPrecision, new Action( actionCallback, label ) );
	this.addInteractiveObject( interactiveObject );
	return interactiveObject;
};

/**
 * Creates a new static object and stores it to the respective internal array.
 * 
 * @param {THREE.Mesh} mesh - The mesh object.
 * @param {number} collisionType - The type of collision detection.
 * 
 * @returns {ActionObject} The new static object.
 */
ActionManager.prototype.createStatic = function( mesh, collisionType ) {

	var staticObject = new ActionObject( mesh, collisionType );
	this.addStaticObject( staticObject );
	return staticObject;
};

/**
 * Creates a new trigger and stores it to the respective internal array.
 * 
 * @param {string} label - The label of the trigger.
 * @param {THREE.Vector3} position - The position of the trigger.
 * @param {number} radius - The radius of the trigger.
 * @param {boolean} isOnetime - Should the trigger run it's action just one time?
 * @param {function} actionCallback - The action callback.
 * 
 * @returns {ActionTrigger} The new action trigger.
 */
ActionManager.prototype.createTrigger = function( label, position, radius, isOnetime, actionCallback ) {

	var trigger = new ActionTrigger( position, radius, isOnetime, new Action( actionCallback, label ) );
	this.addTrigger( trigger );
	return trigger;
};

/**
 * Adds a single interactive object to the internal array.
 * 
 * @param {ActionObject} interactiveObject - The interactive object to be
 * added.
 */
ActionManager.prototype.addInteractiveObject = function( interactiveObject ) {

	this.interactiveObjects.push( interactiveObject );
};

/**
 * Removes a single interactive object from the internal array.
 * 
 * @param {ActionObject} interactiveObject - The interactive object to be
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
 * @param {ActionObject} staticObject - The static object to be added.
 */
ActionManager.prototype.addStaticObject = function( staticObject ) {

	this.staticObjects.push( staticObject );
};

/**
 * Removes a single static object from the internal array.
 * 
 * @param {ActionObject} staticObject - The static object to be removed.
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

/**
 * Calculates the closest intersection with an interactive object.
 */
ActionManager.prototype._calculateClosestIntersection = function( position, direction ) {

	var interactiveObject, intersects, index;

	// prepare raycaster
	this._raycaster.set( position, direction );
	this._raycaster.far = 20;

	// intersection test. the result is already sorted by distance
	intersects = this._raycaster.intersectObjects( this.interactiveObjects );

	if ( intersects.length > 0 )
	{
		for ( index = 0; index < intersects.length; index++ )
		{
			interactiveObject = intersects[ index ].object;

			// the action property must always set
			if ( interactiveObject.action !== undefined )
			{
				// return the object if it has an active action. if not,
				// continue with the next object
				if ( interactiveObject.action.isActive === true )
				{
					return interactiveObject;
				}
			}
			else
			{
				throw "ERROR: ActionManager: No action defined for interactive object.";
			}

		}
	}

};

/**
 * This method checks if the user interface should indicate, that the player can
 * interact with an object.
 * 
 * @param {THREE.Vector3} position - The position of the player.
 * @param {THREE.Vector3} direction - The direction the player is looking at.
 */
ActionManager.prototype._checkInteraction = function( position, direction ) {

	// calculate the intersection with the closest visible and active interactive object
	var interactiveObject = this._calculateClosestIntersection( position, direction );

	// show the interaction label if there is an intersection
	if ( interactiveObject !== undefined )
	{
		userInterfaceManager.showInteractionLabel( interactiveObject.action.label );
	}
	else
	{
		userInterfaceManager.hideInteractionLabel();
	}

};

/**
 * This method is used to handle the interaction command of the player.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
ActionManager.prototype._onInteraction = function( message, data ) {

	// calculate the intersection with the closest visible and active interactive object
	var interactiveObject = self._calculateClosestIntersection( data.position, data.direction );

	if ( interactiveObject !== undefined )
	{
		// execute the assigned action
		interactiveObject.action.run();
		
		logger.log( "INFO: ActionManager: Interaction with interactive object. Action executed." );
		
	}
};

module.exports = new ActionManager();