/**
 * @file Prototype for first person controls. The logic uses HTML5 Pointer Lock
 * API to capture mouse-movements. The camera is stored within two 3D-objects
 * (yaw and pitch) to effectively handle orientation stuff and head motions.
 * 
 * @author Human Interactive
 */

"use strict";

var PubSub = require( "pubsub-js" );
var THREE = require( "three" );

var TOPIC = require( "../core/Topic" );

var camera = require( "../core/Camera" );
var world = require( "../core/World" );
var audioManager = require( "../audio/AudioManager" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );
var settingsManager = require( "../etc/SettingsManager" );
var Easing = require( "../animation/Easing" );

var self;

/**
 * Creates the first person controls.
 * 
 * @constructor
 */
function FirstPersonControls() {

	// parents of camera object
	Object.defineProperties( this, {
		_yawObject : {
			value : new THREE.Object3D(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		_pitchObject : {
			value : new THREE.Object3D(),
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );

	// movement properties
	Object.defineProperties( this, {
		_moveForward : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_moveBackward : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_moveLeft : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_moveRight : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_move : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_strafe : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_moveSpeed : {
			value : FirstPersonControls.DEFAULT.SPEED.MOVE,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_strafeSpeed : {
			value : FirstPersonControls.DEFAULT.SPEED.STRAFE,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_height : {
			value : FirstPersonControls.DEFAULT.HEIGHT,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// used for animations
	Object.defineProperties( this, {
		_animationCrouchTime : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_animationHeight : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_animationRunTime : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_animationMove : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_animationStrafe : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_animationDeflection : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_animationFrequency : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// used for head motion calculation
	Object.defineProperties( this, {
		_deflection : {
			value : FirstPersonControls.DEFAULT.CAMERA.DEFLECTION,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_frequency : {
			value : FirstPersonControls.DEFAULT.CAMERA.FREQUENCY,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_phase : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_lastFrequency : {
			value : FirstPersonControls.DEFAULT.CAMERA.FREQUENCY,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_motionFactor : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_motionCurveUp : {
			value : true,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_motionLastValue : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
	} );

	// flags
	Object.defineProperties( this, {
		_isCrouch : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isRun : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isControlsActive : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isUiElementActive : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		isActionInProgress : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
	} );

	// raycaster
	Object.defineProperties( this, {
		_rayCaster : {
			value : new THREE.Raycaster(),
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );

	// build relationship
	this._pitchObject.add( camera ); // camera -> pitch
	this._yawObject.add( this._pitchObject ); // pitch -> yaw

	// add to world
	world.addObject3D( this._yawObject );

	// type definition
	this._yawObject.type = "Controls";

	self = this;
}

/**
 * Sets the position of the controls.
 * 
 * @param {THREE.Vector3} position - The position to set.
 */
FirstPersonControls.prototype.setPosition = function( position ) {

	this._yawObject.position.x = position.x;
	this._yawObject.position.y = position.y + this._height;
	this._yawObject.position.z = position.z;

	this._yawObject.updateMatrixWorld();
};

/**
 * Gets the position of the controls.
 * 
 * @returns {THREE.Vector3} The position vector.
 */
FirstPersonControls.prototype.getPosition = function() {

	return new THREE.Vector3().copy( this._yawObject.position );
};

/**
 * Sets the rotation of the controls.
 * 
 * @param {THREE.Euler} rotation - The rotation to set.
 */
FirstPersonControls.prototype.setRotation = function( rotation ) {

	this._pitchObject.rotation.x = rotation.x;
	this._yawObject.rotation.y = rotation.y;

	this._yawObject.updateMatrixWorld();
};

/**
 * Gets the rotation of the controls.
 * 
 * @returns {THREE.Euler} The rotation in euler.
 */
FirstPersonControls.prototype.getRotation = function() {

	return new THREE.Euler( this._pitchObject.rotation.x, this._yawObject.rotation.y, 0 );
};

/**
 * Gets the direction of the controls.
 * 
 * @returns {THREE.Vector3} The direction vector.
 */
FirstPersonControls.prototype.getDirection = ( function() {

	var result = new THREE.Vector3();
	var direction = new THREE.Vector3( 0, 0, -1 );
	var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

	return function() {

		// calculate direction
		rotation.set( this._pitchObject.rotation.x, this._yawObject.rotation.y, 0 );
		result.copy( direction ).applyEuler( rotation );
		return result;
	};

}() );

/**
 * Initializes the controls
 */
FirstPersonControls.prototype.init = function() {

	// subscriptions
	PubSub.subscribe( TOPIC.CONTROLS.ACTIVE, this._onActive );

	// events
	global.document.addEventListener( "lockPointer", this._onLockPointer );
	global.document.addEventListener( "releasePointer", this._onReleasePointer );

	global.document.addEventListener( "mousemove", this._onMouseMove );
	global.document.addEventListener( "keydown", this._onKeyDown );
	global.document.addEventListener( "keyup", this._onKeyUp );

	global.document.addEventListener( "pointerlockchange", this._onPointerlockchange );
	global.document.addEventListener( "mozpointerlockchange", this._onPointerlockchange );
	global.document.addEventListener( "webkitpointerlockchange", this._onPointerlockchange );

	global.document.addEventListener( "pointerlockerror", this._onPointerlockerror );
	global.document.addEventListener( "mozpointerlockerror", this._onPointerlockerror );
	global.document.addEventListener( "webkitpointerlockerror", this._onPointerlockerror );

	// load and assign audio buffers for steps
	audioManager.createAudioBufferList( [ "step1", "step2" ], function( bufferList ) {

		// create new audios
		var audioStep1 = audioManager.createDynamicSound( "controls.step1", bufferList[ 0 ], false, true );
		var audioStep2 = audioManager.createDynamicSound( "controls.step2", bufferList[ 1 ], false, 1, true );

		// add variations
		audioStep1.addPitchVariation( function() {

			return 0.9 + Math.random() * 0.4;
		} );
		audioStep2.addPitchVariation( function() {

			return 0.9 + Math.random() * 0.4;
		} );

		// assign audios to camera
		camera.add( audioStep1 );
		camera.add( audioStep2 );

	} ).load();
};

/**
 * Central update method called within the render-loop.
 * 
 * @param {number} delta - Elapsed time between two frames.
 */
FirstPersonControls.prototype.update = function( delta ) {

	if ( this._isControlsActive === true && this.isActionInProgress === false )
	{
		this._translate( delta );
		
		this._animateCrouch();

		this._animateRun();

		this._publishPlayerStatus();
	}
	else
	{
		// reset camera position
		this._translateCameraToOrigin();
	}
};

/**
 * This method does the actual translation of the controls.
 * 
 * @param {number} delta - Elapsed time between two frames.
 */
FirstPersonControls.prototype._translate = ( function() {

	var velocity = new THREE.Vector3();
	var normalizedMovement = new THREE.Vector3();
	var lastPosition = new THREE.Vector3();

	return function( delta ) {

		// store last position
		lastPosition.copy( this._yawObject.position );

		// convert booleans to one number per axis (1, 0, -1)
		this._move = Number( this._moveBackward ) - Number( this._moveForward );
		this._strafe = Number( this._moveRight ) - Number( this._moveLeft );

		// calculate velocity
		velocity.z = this._calculateMoveVelocity( delta );
		velocity.x = this._calculateStrafeVelocity( delta );

		// initialize movement vectors
		normalizedMovement.z = this._move;
		normalizedMovement.x = this._strafe;

		// this prevents, that the player moves to fast when
		// e.g. forward and right are pressed simultaneously
		normalizedMovement.normalize().multiply( velocity );

		// actual translation of the controls position
		this._yawObject.translateX( normalizedMovement.x );
		this._yawObject.translateY( normalizedMovement.y );
		this._yawObject.translateZ( normalizedMovement.z );

		if ( this._isCollisionHandlingRequired() === true )
		{
			// restore last position
			this._yawObject.position.copy( lastPosition );

			// reset camera position
			this._translateCameraToOrigin();
		}
		else
		{
			// calculate camera motions
			this._calculateCameraMotion( normalizedMovement, delta );
		}
	};

}() );

/**
 * This method calculates the motions of the camera.
 * 
 * @param {THREE.Vector3} normalizedMovement - This vector contains the
 * translation of the current frame
 * @param {number} delta - Elapsed time between two frames.
 */
FirstPersonControls.prototype._calculateCameraMotion = ( function() {

	var motion = 0;
	var audioStep1 = null;
	var audioStep2 = null;

	return function( normalizedMovement, delta ) {

		if ( audioStep1 === null )
		{
			audioStep1 = audioManager.getDynamicAudio( "controls.step1" );
		}
		if ( audioStep2 === null )
		{
			audioStep2 = audioManager.getDynamicAudio( "controls.step2" );
		}

		if ( this._move !== 0 || this._strafe !== 0 )
		{
			// get motion factor from normalized movement
			this._motionFactor += delta * normalizedMovement.length();

			// calculate frequency for sine curve
			this._calculateFrequency();

			// calculate actual motion
			motion = Math.sin( this._motionFactor * this._frequency + this._phase );

			// play audio steps
			if ( motion < this._motionLastValue && this._motionCurveUp === true )
			{
				this._motionCurveUp = false;
				audioStep1.play();
			}
			else if ( motion > this._motionLastValue && this._motionCurveUp === false )
			{
				this._motionCurveUp = true;
				audioStep2.play();
			}

			// set values to camera
			camera.position.y = Math.abs( motion ) * this._deflection;
			camera.position.x = motion * this._deflection;

			// store current motion for next calculation
			this._motionLastValue = motion;

		}
		else
		{
			// if player is not moving, translate camera back to origin
			this._translateCameraToOrigin();
		}
	};

}() );

/**
 * Calculates a new sine frequency for camera motion. It ensures, that the new
 * sine cuvre is in-sync to the old one.
 */
FirstPersonControls.prototype._calculateFrequency = ( function() {

	var current, next = 0;
	var TWO_PI = 2 * Math.PI;

	return function() {

		if ( this._frequency !== this._lastFrequency )
		{
			current = ( this._motionFactor * this._lastFrequency + this._phase ) % TWO_PI;
			next = ( this._motionFactor * this._frequency ) % TWO_PI;

			this._phase = current - next;
			this._lastFrequency = this._frequency;
		}
	};
}() );

/**
 * This method resets the camera to its origin. The reset is done with a simple
 * linear transition.
 */
FirstPersonControls.prototype._translateCameraToOrigin = function() {

	// only translate if necessary
	if ( camera.position.x !== 0 || camera.position.y !== 0 )
	{
		// reset y value
		camera.position.y -= FirstPersonControls.DEFAULT.CAMERA.RESETFACTOR;
		camera.position.y = Math.max( camera.position.y, 0 );

		// reset x value
		if ( camera.position.x < 0 )
		{
			camera.position.x += FirstPersonControls.DEFAULT.CAMERA.RESETFACTOR;
			camera.position.x = Math.min( camera.position.x, 0 );
		}
		else if ( camera.position.x > 0 )
		{
			camera.position.x -= FirstPersonControls.DEFAULT.CAMERA.RESETFACTOR;
			camera.position.x = Math.max( camera.position.x, 0 );
		}

		// initialize motion values
		this._motionFactor = 0;
		this._motionCurveUp = true;
		this._motionLastValue = 0;
		this._phase = 0;
	}
};

/**
 * This method calculates the movement velocity in z-direction.
 * 
 * @param {number} delta - Elapsed time between two frames.
 * 
 * @returns {number} The velocity in z-direction.
 */
FirstPersonControls.prototype._calculateMoveVelocity = ( function() {

	var acceleration = 0;

	return function( delta ) {

		if ( this._move !== 0 )
		{
			acceleration += this._move * delta * FirstPersonControls.DEFAULT.SPEED.ACCELERATION.FACTOR;

			if ( Math.abs( acceleration ) > FirstPersonControls.DEFAULT.SPEED.ACCELERATION.MAX )
			{
				acceleration = FirstPersonControls.DEFAULT.SPEED.ACCELERATION.MAX * this._move;
			}

		}
		else
		{
			acceleration = 0;
		}

		return Math.abs( Math.tan( acceleration ) * this._moveSpeed );
	};

}() );

/**
 * This method calculates the movement velocity in x-direction.
 * 
 * @param {number} delta - Elapsed time between two frames.
 * 
 * @returns {number} The velocity in x-direction.
 */
FirstPersonControls.prototype._calculateStrafeVelocity = ( function() {

	var acceleration = 0;

	return function( delta ) {

		if ( this._strafe !== 0 )
		{
			acceleration += this._strafe * delta * FirstPersonControls.DEFAULT.SPEED.ACCELERATION.FACTOR;

			if ( Math.abs( acceleration ) > FirstPersonControls.DEFAULT.SPEED.ACCELERATION.MAX )
			{
				acceleration = FirstPersonControls.DEFAULT.SPEED.ACCELERATION.MAX * this._strafe;
			}
		}
		else
		{
			acceleration = 0;
		}

		return Math.abs( Math.tan( acceleration ) * this._strafeSpeed );
	};

}() );

/**
 * This method calculates the height of the controls.
 * 
 * @param {number} distance - The distance between yawObject and ground.
 */
FirstPersonControls.prototype._calculateHeight = function( distance ) {

	this._yawObject.position.y += ( this._height - distance );
};

/**
 * Does the actual collision detection and returns a boolean value, that
 * indicates the collision status.
 * 
 * @returns {boolean} - Is there a collision after the latest movement?
 */
FirstPersonControls.prototype._isCollisionHandlingRequired = ( function() {

	var intersects = [];
	var direction = new THREE.Vector3( 0, -1, 0 );
	var numberOfObstacle;
	var obstacle;
	var index;

	var boundingBox = new THREE.Box3(); // mathematical representation of the
	// player body
	var center = new THREE.Vector3(); // center of body
	var size = new THREE.Vector3(); // body size

	return function() {

		if ( world.grounds.length !== 0 )
		{
			this._rayCaster.set( this._yawObject.position, direction );
			this._rayCaster.far = FirstPersonControls.DEFAULT.HEIGHT + 1;

			// first, check grounds
			intersects = this._rayCaster.intersectObjects( world.grounds );

			// if there is an intersection, the player's position is inside the
			// level boundaries
			// now check intersections between the player and obstacle objects
			if ( intersects.length > 0 )
			{
				// before doing the intersection test with action objects
				// update the player's bounding volume (AABB)

				// adjust height
				this._calculateHeight( intersects[ 0 ].distance );

				// calculate center of the player
				center.copy( this._yawObject.position );
				center.y -= this._height * 0.5;

				// calculate size of the player
				size.set( 4, this._height, 4 );

				// create bounding box
				boundingBox.setFromCenterAndSize( center, size );

				// get number of obstacles in the world
				numberOfObstacle = world.getNumberOfObstacles();

				// check obstacles
				for ( index = 0; index < numberOfObstacle; index++ )
				{
					// retrieve obstacle
					obstacle = world.getObstacle( index );

					// regard only visible objects
					if ( obstacle.mesh.visible === true )
					{
						// do collision detection
						if ( obstacle.isIntersection( boundingBox ) === true )
						{
							// true, because there is a collision with an
							// obstacle
							return true;
						}

					}

				}

				// false, because there is no collision
				return false;
			}
			else
			{
				// true, because the player is not over a ground
				return true;
			}

		}

	};

}() );

/**
 * Handles the "crouch" command. Crouching decreases the height and movement
 * speed of the player. These values are changed via animations.
 */
FirstPersonControls.prototype._toogleCrouch = function() {

	// toogle boolean value
	this._isCrouch = !this._isCrouch;

	// running in crouch-mode not possible
	this._isRun = false;

	// save current timestamp and values for animation
	this._animationCrouchTime = global.performance.now();
	this._animationHeight = this._height;
	this._animationMove = this._moveSpeed;
	this._animationStrafe = this._strafeSpeed;
	this._animationDeflection = this._deflection;
	this._animationFrequency = this._frequency;
};

/**
 * Handles the "run" command. Running increases the movement speed and the
 * camera shaking of the player. These values are changed via animations.
 * 
 * @param {boolean} isActive - Should the player run.
 */
FirstPersonControls.prototype._setRun = function( isRun ) {

	this._isRun = isRun;

	// crouching in run-mode not possible
	this._isCrouch = false;

	// save current timestamp and values for animation
	this._animationRunTime = global.performance.now();
	this._animationHeight = this._height;
	this._animationMove = this._moveSpeed;
	this._animationStrafe = this._strafeSpeed;
	this._animationDeflection = this._deflection;
	this._animationFrequency = this._frequency;
};

/**
 * Animates the transition between crouch and default position.
 */
FirstPersonControls.prototype._animateCrouch = ( function() {

	var elapsed, factor, targetHeight, targetMove, targetStrafe, targetDeflection, targetFrequency, valueHeight, valueSpeed = 0;

	return function() {

		// animate only if necessary
		if ( this._isCrouch === true && this._height > FirstPersonControls.CROUCH.HEIGHT || this._isCrouch === false && this._isRun === false && this._height < FirstPersonControls.DEFAULT.HEIGHT )
		{
			// calculate elapsed time
			elapsed = ( global.performance.now() - this._animationCrouchTime ) * FirstPersonControls.CROUCH.ANIMATION.DURATION;

			// calculate factor for easing formula
			factor = elapsed > 1 ? 1 : elapsed;

			// calculate easing value
			valueSpeed = Easing.Quartic.In( factor );
			valueHeight = Easing.Quartic.Out( factor );

			// determine target values
			targetHeight = this._isCrouch === true ? FirstPersonControls.CROUCH.HEIGHT : FirstPersonControls.DEFAULT.HEIGHT;
			targetMove = this._isCrouch === true ? FirstPersonControls.CROUCH.SPEED.MOVE : FirstPersonControls.DEFAULT.SPEED.MOVE;
			targetStrafe = this._isCrouch === true ? FirstPersonControls.CROUCH.SPEED.STRAFE : FirstPersonControls.DEFAULT.SPEED.STRAFE;
			targetDeflection = this._isRun === true ? FirstPersonControls.CROUCH.CAMERA.DEFLECTION : FirstPersonControls.DEFAULT.CAMERA.DEFLECTION;
			targetFrequency = this._isRun === true ? FirstPersonControls.CROUCH.CAMERA.FREQUENCY : FirstPersonControls.DEFAULT.CAMERA.FREQUENCY;

			// do transition
			this._height = this._animationHeight + ( targetHeight - this._animationHeight ) * valueHeight;
			this._moveSpeed = this._animationMove + ( targetMove - this._animationMove ) * valueSpeed;
			this._strafeSpeed = this._animationStrafe + ( targetStrafe - this._animationStrafe ) * valueSpeed;
			this._deflection = this._animationDeflection + ( targetDeflection - this._animationDeflection ) * valueSpeed;
			this._frequency = this._animationFrequency + ( targetFrequency - this._animationFrequency ) * valueSpeed;
		}
	};

}() );

/**
 * Animates the transition between run and default movement.
 */
FirstPersonControls.prototype._animateRun = ( function() {

	var elapsed, factor, targetHeight, targetMove, targetStrafe, targetDeflection, targetFrequency, valueHeight, valueSpeed = 0;

	return function() {

		// animate only if necessary
		if ( this._isRun === true && this._moveSpeed < FirstPersonControls.RUN.SPEED.MOVE || this._isRun === false && this._isCrouch === false && this._moveSpeed > FirstPersonControls.DEFAULT.SPEED.MOVE )
		{
			// calculate elapsed time
			elapsed = ( global.performance.now() - this._animationRunTime ) * FirstPersonControls.RUN.ANIMATION.DURATION;

			// calculate factor for easing formula
			factor = elapsed > 1 ? 1 : elapsed;

			// calculate easing value
			valueSpeed = Easing.Quartic.In( factor );
			valueHeight = Easing.Quartic.Out( factor );

			// determine target values
			targetHeight = this._isRun === true ? FirstPersonControls.RUN.HEIGHT : FirstPersonControls.DEFAULT.HEIGHT;
			targetMove = this._isRun === true ? FirstPersonControls.RUN.SPEED.MOVE : FirstPersonControls.DEFAULT.SPEED.MOVE;
			targetStrafe = this._isRun === true ? FirstPersonControls.RUN.SPEED.STRAFE : FirstPersonControls.DEFAULT.SPEED.STRAFE;
			targetDeflection = this._isRun === true ? FirstPersonControls.RUN.CAMERA.DEFLECTION : FirstPersonControls.DEFAULT.CAMERA.DEFLECTION;
			targetFrequency = this._isRun === true ? FirstPersonControls.RUN.CAMERA.FREQUENCY : FirstPersonControls.DEFAULT.CAMERA.FREQUENCY;

			// do transition
			this._height = this._animationHeight + ( targetHeight - this._animationHeight ) * valueHeight;
			this._moveSpeed = this._animationMove + ( targetMove - this._animationMove ) * valueSpeed;
			this._strafeSpeed = this._animationStrafe + ( targetStrafe - this._animationStrafe ) * valueSpeed;
			this._deflection = this._animationDeflection + ( targetDeflection - this._animationDeflection ) * valueSpeed;
			this._frequency = this._animationFrequency + ( targetFrequency - this._animationFrequency ) * valueSpeed;
		}
	};

}() );

/**
 * Publish the world information of the player for multiplayer.
 */
FirstPersonControls.prototype._publishPlayerStatus = ( function() {

	var position = new THREE.Vector3();
	var quaternion = new THREE.Quaternion();
	var scale = new THREE.Vector3();

	return function() {

		// The pitch-object contains the entire position and rotation
		// values of the player
		this._pitchObject.matrixWorld.decompose( position, quaternion, scale );

		PubSub.publish( TOPIC.MULTIPLAYER.PLAYER, {
			position : position,
			quaternion : quaternion
		} );
	};

}() );

/**
 * Resets the movement. This avoids problems with moving players, even when they
 * hit no keys. This could happen, when you switch to main menu with pressed
 * wasd keys. The actual problem is, that the "keyup" event is not fired under
 * these circumstances.
 */
FirstPersonControls.prototype._reset = function() {

	this._moveForward = false;
	this._moveBackward = false;
	this._moveLeft = false;
	this._moveRight = false;
};

/**
 * Sets the control status.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
FirstPersonControls.prototype._onActive = function( message, data ) {

	self._isControlsActive = data.isActive;

	self._reset();
};

/**
 * Locks the pointer for detecting mouse movements.
 */
FirstPersonControls.prototype._onLockPointer = function() {

	self._isUiElementActive = false;

	var element = global.document.querySelector( "canvas" );

	// Ask the browser to lock the pointer
	element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
	element.requestPointerLock();
};

/**
 * Releases the locked pointer. This method is always called by UI-Elements to
 * release the pointer. It is not called, when the Player goes via Esc to the
 * Main Menu.
 */
FirstPersonControls.prototype._onReleasePointer = function() {

	self._isUiElementActive = true;

	// Ask the browser to release the pointer
	global.document.exitPointerLock = global.document.exitPointerLock || global.document.mozExitPointerLock || global.document.webkitExitPointerLock;
	global.document.exitPointerLock();
};

/**
 * Detects the change of the pointer lock status. It is used to control the
 * Menu.
 */
FirstPersonControls.prototype._onPointerlockchange = function() {

	var requestedElement = global.document.querySelector( "canvas" );

	if ( global.document.pointerLockElement === requestedElement || global.document.mozPointerLockElement === requestedElement || global.document.webkitPointerLockElement === requestedElement )
	{
		self._isControlsActive = true;

		if ( self._isUiElementActive === false )
		{
			userInterfaceManager.hideMenu();
		}

	}
	else
	{
		self._isControlsActive = false;

		if ( self._isUiElementActive === false )
		{
			userInterfaceManager.showMenu();
		}
	}

	self._reset();
};

/**
 * Any error situation should be marked with an exception.
 */
FirstPersonControls.prototype._onPointerlockerror = function( event ) {

	throw "ERROR: FirstPersonControls: Pointer Lock Error.";
};

/**
 * Detects any mouse movements, when pointer lock is active. Then it calculates
 * the rotation of yaw and pitch object.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onMouseMove = ( function() {

	var movementX, movementY = 0;
	var HALF_PI = Math.PI * 0.5;

	return function( event ) {

		if ( self._isControlsActive === true && self.isActionInProgress === false )
		{
			// capture mouse movement
			movementX = event.movementX || event.mozMovementX || 0;
			movementY = event.movementY || event.mozMovementY || 0;

			// manipulate rotation of yaw and pitch object
			self._yawObject.rotation.y -= movementX * ( settingsManager.getMouseSensitivity() * 0.0001 );
			self._pitchObject.rotation.x -= movementY * ( settingsManager.getMouseSensitivity() * 0.0001 );

			// prevent "loop" of x-axis
			self._pitchObject.rotation.x = Math.max( -HALF_PI, Math.min( HALF_PI, self._pitchObject.rotation.x ) );
		}
	};

}() );

/**
 * Executes, when a key is pressed down.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onKeyDown = function( event ) {

	if ( self._isControlsActive === true )
	{
		switch ( event.keyCode )
		{
			case 87:
				// w
				self._moveForward = true;
				break;

			case 65:
				// a
				self._moveLeft = true;
				break;

			case 83:
				// s
				self._moveBackward = true;
				break;

			case 68:
				// d
				self._moveRight = true;
				break;

			case 67:
				// c
				self._toogleCrouch();
				break;

			case 16:
				// shift
				self._setRun( true );
				break;

			case 69:
				// e
				PubSub.publish( TOPIC.ACTION.INTERACTION, {
					position : self.getPosition(),
					direction : self.getDirection()
				} );
				break;

			case 70:
				// f
				userInterfaceManager.tooglePerformanceMonitor();
				break;

			case 32:
				// space
				userInterfaceManager.handleUiInteraction( event );
				break;
		}
	}
};

/**
 * Executes, when a key is released.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onKeyUp = function( event ) {

	if ( self._isControlsActive === true )
	{
		switch ( event.keyCode )
		{
			case 87:
				// w
				self._moveForward = false;
				break;

			case 65:
				// a
				self._moveLeft = false;
				break;

			case 83:
				// a
				self._moveBackward = false;
				break;

			case 68:
				// d
				self._moveRight = false;
				break;

			case 16:
				// shift
				if ( self._isCrouch === false )
				{
					self._setRun( false );
				}
		}
	}
};

FirstPersonControls.DEFAULT = {
	HEIGHT : 13,
	SPEED : {
		MOVE : 0.4,
		STRAFE : 0.3,
		ACCELERATION : {
			FACTOR : 1,
			MAX : Math.PI / 4
		}
	},
	CAMERA : {
		DEFLECTION : 0.3,
		FREQUENCY : 15,
		RESETFACTOR : 0.02
	}
};

FirstPersonControls.CROUCH = {
	HEIGHT : 6,
	SPEED : {
		MOVE : 0.2,
		STRAFE : 0.15,
		ACCELERATION : {
			FACTOR : 1,
			MAX : Math.PI / 4
		}
	},
	CAMERA : {
		DEFLECTION : 0.3,
		FREQUENCY : 15,
		RESETFACTOR : 0.02
	},
	ANIMATION : {
		DURATION : 0.001
	},
};

FirstPersonControls.RUN = {
	HEIGHT : 13,
	SPEED : {
		MOVE : 0.9,
		STRAFE : 0.6,
		ACCELERATION : {
			FACTOR : 1,
			MAX : Math.PI / 4
		}
	},
	CAMERA : {
		DEFLECTION : 0.7,
		FREQUENCY : 8,
		RESETFACTOR : 0.02
	},
	ANIMATION : {
		DURATION : 0.002
	}
};

module.exports = new FirstPersonControls();