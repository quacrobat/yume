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
var BSPTree = require( "./BSPTree" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );
var logger = require( "../core/Logger" );
var timing = require( "../core/Timing" );

var self;

/**
 * Creates the action manager.
 * 
 * @constructor
 */
function ActionManager() {

	Object.defineProperties( this, {
		// if you have many objects in your stage, you can use this flag turn on
		// space partitioning with a BSP Tree. right now, raytracing would be
		// executed faster with this. collision detection with a BSP Tree
		// is not yet implemented
		useSpacePartitioning : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this array holds references to all action objects. objects in this
		// array are part of the internal collision detection
		_actionObjects : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this array holds references to action objects that are part of the
		// interaction system. ray-tracing operations will regard only objects
		// in this special array
		_interactiveObjects : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this array holds references to all triggers
		_triggers : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this will be used for ray-tracing operations
		_raycaster : {
			value : new THREE.Raycaster(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// a BSP Tree for spatial space partitioning
		_bspTree : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
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
	
	// create BSP-Tree
	this._bspTree = new BSPTree( this._interactiveObjects );

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

	// update action objects
	for ( index = 0; index < this._actionObjects.length; index++ )
	{
		this._actionObjects[ index ].update();
	}

	// update triggers
	for ( index = 0; index < this._triggers.length; index++ )
	{
		this._triggers[ index ].update( player.position );
	}

	// check interaction objects
	this._checkInteraction( player.getHeadPosition(), player.getDirection() );
};

/**
 * Generates the internal BSP-Tree with data from the current stage.
 * 
 * @param {World} world - The world object.
 */
ActionManager.prototype.generateBSPTree = function( world ) {

	timing.mark( "BSP_START" );
	
	this._bspTree.generate( world );
	
	timing.mark( "BSP_END" );
	
	timing.measure( "BSP-Tree Generation", "BSP_START", "BSP_END" );
	
	timing.print( "BSP-Tree Generation" );
};

/**
 * Creates a new action object and stores it to the respective internal array. A
 * static object is part of the collision detection. Interactions with the
 * object are initially not possible.
 * 
 * @param {THREE.Mesh} mesh - The mesh object.
 * @param {number} collisionType - The type of collision detection.
 * 
 * @returns {ActionObject} The new action object.
 */
ActionManager.prototype.createActionObject = function( mesh, collisionType ) {

	var object = new ActionObject( mesh, collisionType );
	this._actionObjects.push( object );
	return object;
};

/**
 * Creates a new interactive object and stores it to the respective internal
 * arrays. An interactive object is part of the collision detection and
 * ray-tracing system.
 * 
 * @param {THREE.Mesh} mesh - The mesh object.
 * @param {number} collisionType - The type of collision detection.
 * @param {number} raycastPrecision - The precision of the raycast operation.
 * @param {string} label - The label of the action.
 * @param {function} actionCallback - The action callback.
 * 
 * @returns {ActionObject} The new interactive object.
 */
ActionManager.prototype.createInteractiveObject = function( mesh, collisionType, raycastPrecision, label, actionCallback ) {

	var object = new ActionObject( mesh, collisionType, raycastPrecision, new Action( actionCallback, label ) );

	// the object will be stored in two separate data structures
	this._actionObjects.push( object );
	this._interactiveObjects.push( object );

	return object;
};

/**
 * Creates a new trigger and stores it to the respective internal array.
 * 
 * @param {string} label - The label of the trigger.
 * @param {THREE.Vector3} position - The position of the trigger.
 * @param {number} radius - The radius of the trigger.
 * @param {boolean} isOnetime - Should the trigger run it's action just one
 * time?
 * @param {function} actionCallback - The action callback.
 * 
 * @returns {ActionTrigger} The new action trigger.
 */
ActionManager.prototype.createTrigger = function( label, position, radius, isOnetime, actionCallback ) {

	var trigger = new ActionTrigger( position, radius, isOnetime, new Action( actionCallback, label ) );
	this._triggers.push( trigger );
	return trigger;
};

/**
 * Removes a single action object from the internal array.
 * 
 * @param {ActionObject} actionObject - The action object to be removed.
 */
ActionManager.prototype.removeActionObject = function( actionObject ) {

	var index = this._actionObjects.indexOf( actionObject );
	this._actionObjects.splice( index, 1 );
};

/**
 * Removes a single interactive object from the internal array.
 * 
 * @param {ActionObject} interactiveObject - The interactive object to be
 * removed.
 */
ActionManager.prototype.removeInteraction = function( interactiveObject ) {

	// we need to remove the object from both arrays
	var index = this._interactiveObjects.indexOf( interactiveObject );
	this._interactiveObjects.splice( index, 1 );

	// also remove it from the action object array
	this.removeActionObject( interactiveObject );
};

/**
 * Removes a single trigger from the internal array.
 * 
 * @param {ActionTrigger} trigger - The trigger to be removed.
 */
ActionManager.prototype.removeTrigger = function( trigger ) {

	var index = this._triggers.indexOf( trigger );
	this._triggers.splice( index, 1 );
};

/**
 * Removes all action objects from the internal array.
 */
ActionManager.prototype.removeActionObjects = function() {

	this._actionObjects.length = 0;
	this._interactiveObjects.length = 0;
};

/**
 * Removes all triggers from the internal array.
 */
ActionManager.prototype.removeTriggers = function() {

	this._triggers.length = 0;
};

/**
 * Calculates the closest intersection with an interactive object.
 * 
 * @param {THREE.Vector3} position - The position of the player.
 * @param {THREE.Vector3} direction - The direction the player is looking at.
 */
ActionManager.prototype._calculateClosestIntersection = ( function() {

	var objectsToTest = [];

	return function( position, direction ) {

		var interactiveObject, intersects, index;

		// prepare raycaster
		this._raycaster.set( position, direction );
		this._raycaster.far = 20;

		// if space partitioning is activated, use a BSP Tree to decrease the
		// amount of objects to test
		if ( this.useSpacePartitioning === true )
		{
			// reset the array
			objectsToTest.length = 0;

			// check the BSP Tree
			this._bspTree.intersectRay( this._raycaster.ray, objectsToTest );

			// do the actual intersection test
			intersects = this._raycaster.intersectObjects( objectsToTest );
		}
		else
		{
			// do the intersection test without BSP Tree
			intersects = this._raycaster.intersectObjects( this._interactiveObjects );
		}

		// now check the results
		if ( intersects.length > 0 )
		{
			// the objects are already sorted by distance, so we are starting with the closest
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

}() );

/**
 * This method checks if the user interface should indicate, that the player can
 * interact with an object.
 * 
 * @param {THREE.Vector3} position - The position of the player.
 * @param {THREE.Vector3} direction - The direction the player is looking at.
 */
ActionManager.prototype._checkInteraction = function( position, direction ) {

	// calculate the intersection with the closest visible and active
	// interactive object
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

	// calculate the intersection with the closest visible and active
	// interactive object
	var interactiveObject = self._calculateClosestIntersection( data.position, data.direction );

	if ( interactiveObject !== undefined )
	{
		// execute the assigned action
		interactiveObject.action.run();

		logger.log( "INFO: ActionManager: Interaction with interactive object. Action executed." );

	}
};

module.exports = new ActionManager();