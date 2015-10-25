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
		// obstacles, walls etc.
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
		// the center of the player's body
		center : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the size of the player's body. this value changes if the player is
		// crouching
		size : {
			value : new THREE.Vector3(),
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

			// do ground and obstacle collision test. in this game scenario the
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
 * Gets the direction of the player.
 * 
 * @returns {THREE.Vector3} The direction of the player.
 */
Player.prototype.getDirection = function() {

	return this.controls.getDirection();
};

/**
 * Gets the position of the head in world coordinates.
 * 
 * @returns {THREE.Vector3} The position of the head.
 */
Player.prototype.getHeadPosition = function() {

	return this.head.getWorldPosition();
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
Player.prototype._updateBoundingVolume = function() {

	// calculate the center of the players body
	this.center.copy( this.position );
	this.center.y += this.head.position.y * 0.5;

	// calculate size of the player's body
	this.size.set( 4, this.head.position.y, 4 );

	// create bounding box
	this.boundingVolume.setFromCenterAndSize( this.center, this.size );
};

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
 * This method checks, if there are collision between the any obstacles in the
 * world and the player's bounding volume.
 * 
 * @returns {boolean} Is there a collision between an obstacle and the player.
 */
Player.prototype._isCollisionDetected = function() {

	var index, obstacle;

	// this holds the current number if obstacles in the world
	var numberOfObstacle = this.world.getNumberOfObstacles();

	// now do the collision test with all obstacles
	for ( index = 0; index < numberOfObstacle; index++ )
	{
		// retrieve obstacle
		obstacle = this.world.getObstacle( index );

		// do collision detection but only with visible obstacles
		if ( obstacle.mesh.visible === true && obstacle.isIntersection( this.boundingVolume ) === true )
		{
			// exit method, because there is an intersection
			return true;
		}

	} // next obstacle 

	// no intersection
	return false;
};

module.exports = Player;