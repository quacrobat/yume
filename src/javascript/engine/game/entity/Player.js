/**
 * @file This prototype represents the player body.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );

var GameEntity = require( "./GameEntity" );
var eventManager = require( "../../messaging/EventManager" );
var TOPIC = require( "../../messaging/Topic" );
var FirstPersonControls = require( "../../controls/FirstPersonControls" );
var system = require( "../../core/System" );

/**
 * Creates a player object.
 * 
 * @constructor
 * @augments GameEntity
 * 
 */
function Player( world ) {

	GameEntity.call( this );

	Object.defineProperties( this, {
		// the reference to the world object, so the player can access
		// grounds, walls etc.
		world : {
			value : world,
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the controls of the player
		controls : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the bounding volume of the player
		boundingVolume : {
			value : new THREE.Box3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// this will be used as the parent object for the camera
		head : {
			value : new THREE.Object3D(),
			configurable : false,
			enumerable : true,
			writable : false
		}
	} );
	
	// create controls
	this.controls = new FirstPersonControls( this );
	
	// change the default type of the object3D.
	// this prevents the player object to be deleted 
	// within a stage change
	this.object3D.type = "Player";
	
	// build object hierarchy
	this.object3D.add( this.head );
}

Player.prototype = Object.create( GameEntity.prototype );
Player.prototype.constructor = Player;

/**
 * The update method of the player.
 * 
 * @param {number} delta - The time delta value.
 */
Player.prototype.update = ( function() {

	var oldPosition = new THREE.Vector3();
	var displacement = new THREE.Vector3();

	return function( delta ) {
		
		// only update the controls if the mouse pointer is captured AND
		// the controls are not locked
		if ( this.controls.isCaptured === true && this.controls.isLocked === false )
		{
			// store current position
			oldPosition.copy( this.position );
			
			// update the controls and retrieve new displacement values
			this.controls.update( delta, displacement );

			// translate the player to the new position. the used methods
			// translate the player object on the rotated cardinal axis
			this.object3D.translateX( displacement.x );
			this.object3D.translateY( displacement.y );
			this.object3D.translateZ( displacement.z );
			
			// update the bounding volume of the player
			this._updateBoundingVolume();

			// do ground and collision test. in this game scenario the
			// player can only move on valid grounds and if there is no
			// intersection
			if ( this._isPlayerOnGround() === true && this._isCollisionDetected() === false )
			{
				// calculate camera motions only if the player can move without
				// hindrance
				this.controls.calculateCameraMotion( delta, displacement );
			}
			else
			{
				// restore old position
				this.position.copy( oldPosition );
				
				// restore old bounding volume
				this._updateBoundingVolume();

				// reset camera position
				this.controls.resetCamera();
			}

			// only publish player status if multiplayer components are active
			if ( system.isMultiplayerActive === true )
			{
				this._publishPlayerStatus();
			}
		}
		else
		{
			// reset the camera position to its native position
			// if the player is not moving due to locked controls
			this.controls.resetCamera();
			
			// the bounding volume must also calculated if the controls are locked
			this._updateBoundingVolume();
		}

	};

}() );

/**
 * Sets the direction of the player.
 * 
 * @param {THREE.Vector3} direction - The new direction of the player.
 */
Player.prototype.setDirection = function( direction ) {

	this.controls.setDirection( direction );
};

/**
 * Returns the direction of the player.
 * 
 * @param {THREE.Vector3} optionalTarget - The optional target vector.
 * 
 * @returns {THREE.Vector3} The direction of the player.
 */
Player.prototype.getDirection = function( optionalTarget ) {
	
	var result = optionalTarget || new THREE.Vector3();

	return this.controls.getDirection( result );
};

/**
 * Returns the position of the head in world coordinates.
 * 
 * @param {THREE.Vector3} optionalTarget - The optional target vector.
 * 
 * @returns {THREE.Vector3} The position of the head.
 */
Player.prototype.getHeadPosition = function( optionalTarget ) {
	
	var result = optionalTarget || new THREE.Vector3();

	return this.head.getWorldPosition( result );
};

/**
 * Publish the world information of the player to all players in the multiplayer
 * session.
 */
Player.prototype._publishPlayerStatus = ( function() {

	var position = new THREE.Vector3();
	var quaternion = new THREE.Quaternion();

	return function() {

		position.copy( this.position );
		quaternion.copy( this.quaternion );

		eventManager.publish( TOPIC.MULTIPLAYER.PLAYER, {
			position : position,
			quaternion : quaternion
		} );

	};

}() );

/**
 * Updates the bounding volume of the player.
 */
Player.prototype._updateBoundingVolume = ( function() {

	var center = new THREE.Vector3();
	var size = new THREE.Vector3();

	return function() {

		// calculate the center of the player's body
		center.copy( this.position );
		center.y += this.head.position.y * 0.5;

		// calculate size of the player's body
		size.set( 4, this.head.position.y, 4 );

		// create bounding box
		this.boundingVolume.setFromCenterAndSize( center, size );
	};

}() );

/**
 * Checks, of the player is on a ground object.
 * 
 * @returns {boolean} Is the player on a ground?
 */
Player.prototype._isPlayerOnGround = ( function() {

	// this will be used for a intersection test to determine the distance to
	// the current ground
	var rayCaster = new THREE.Raycaster();

	// ray properties
	var origin = new THREE.Vector3();
	var direction = new THREE.Vector3( 0, -1, 0 );

	return function() {

		var intersects;

		// only do intersection test if there are grounds
		if ( this.world.grounds.length !== 0 )
		{
			origin.copy( this.position );
			origin.y += this.head.position.y;

			// set origin and direction of raycast
			rayCaster.set( origin, direction );
			rayCaster.far = this.head.position.y + 1;

			// do intersection test
			intersects = rayCaster.intersectObjects( this.world.grounds );

			// if there is an intersection, update the height of the player and return true
			if ( intersects.length > 0 )
			{
				this.position.y += ( this.head.position.y - intersects[ 0 ].distance );
				
				return true;
			}
			else
			{
				// no ground intersection
				return false;
			}
		}
		
		// no grounds
		return false;
	};

}() );

/**
 * This method checks, if there are collision between the any action objects in the
 * world and the player's bounding volume.
 * 
 * @returns {boolean} Is there a collision between an action object and the player.
 */
Player.prototype._isCollisionDetected = function() {

	var index, object;

	// now do the collision test with all objects
	for ( index = 0; index < this.world.actionObjects.length; index++ )
	{
		object =  this.world.actionObjects[ index ];

		// do collision detection but only with visible objects
		if ( object.mesh.visible === true && object.isIntersection( this.boundingVolume ) === true )
		{
			// exit method, because there is an intersection
			return true;
		}

	} // next object 

	// no intersection
	return false;
};

module.exports = Player;