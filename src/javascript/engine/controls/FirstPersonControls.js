/**
 * @file Prototype for first person controls. The logic uses HTML5 Pointer Lock
 * API to capture mouse-movements. The camera is stored within an additional 3D-object
 * (head) to effectively handle orientation stuff and camera motions.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var camera = require( "../core/Camera" );
var logger = require( "../core/Logger" );
var audioManager = require( "../audio/AudioManager" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );
var settingsManager = require( "../etc/SettingsManager" );
var Easing = require( "../animation/Easing" );
var utils = require( "../etc/Utils" );

var self;

/**
 * Creates the first person controls.
 * 
 * @constructor
 */
function FirstPersonControls( player ) {

	// a reference to the player object
	Object.defineProperties( this, {
		_player : {
			value : player,
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );

	// movement properties
	Object.defineProperties( this, {
		_isMoveForward : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isMoveBackward : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isMoveLeft : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_isMoveRight : {
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
		}
	} );

	// used for animations
	Object.defineProperties( this, {
		_animationStartTime : {
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
		// indicates, if the player is crouching
		_isCrouch : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// indicates, if the player is running
		_isRun : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// indicates, if the mouse pointer is captured
		isCaptured : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// indicates, if an ui element is active
		isUiElementActive : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// indicates, if the controls are locked
		isLocked : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
	} );
	
	this._init();
}

/**
 * Updates the controls.
 * 
 * @param {number} delta - Elapsed time between two frames.
 * @param {THREE.Vector3} displacement -The displacement vector.
 */
FirstPersonControls.prototype.update = function( delta, displacement ) {

	// calculate displacement caused by movement of the player
	this._calculateMovement( delta, displacement );
	
	// animation control movements
	this._animate();
};

/**
 * Sets the direction of the controls.
 * 
 * @param {THREE.Vector3} direction -  The direction to set.
 */
FirstPersonControls.prototype.setDirection = ( function() {

	var xAxis, yAxis, zAxis, rotationMatrix, euler;

	return function( direction ) {

		if ( xAxis === undefined )
		{
			xAxis = new THREE.Vector3(); // right
			yAxis = new THREE.Vector3(); // up
			zAxis = new THREE.Vector3(); // front

			rotationMatrix = new THREE.Matrix4();
			euler = new THREE.Euler( 0, 0, 0, "YXZ" );
		}

		// the front vector always points to the direction vector
		zAxis.copy( direction ).normalize();

		// avoid zero-length axis
		if ( zAxis.lengthSq() === 0 )
		{
			zAxis.z = 1;
		}

		// compute right vector
		xAxis.crossVectors( this._player.object3D.up, zAxis );

		// avoid zero-length axis
		if ( xAxis.lengthSq() === 0 )
		{
			zAxis.x += 0.0001;
			xAxis.crossVectors( this._player.object3D.up, zAxis ).normalize();
		}

		// compute up vector
		yAxis.crossVectors( zAxis, xAxis );

		// setup a rotation matrix of the basis
		rotationMatrix.makeBasis( xAxis, yAxis, zAxis );

		// create euler angles from rotation
		euler.setFromRotationMatrix( rotationMatrix );

		// apply rotation to control objects
		this._player.rotation.y = euler.y;
		this._player.head.rotation.x = euler.x;
	};

}() );

/**
 * Returns the direction of the controls.
 * 
 * @param {THREE.Vector3} optionalTarget - The optional target vector.
 * 
 * @returns {THREE.Vector3} The direction vector.
 */
FirstPersonControls.prototype.getDirection = ( function() {

	var rotation;

	return function( optionalTarget ) {
		
		var result = optionalTarget || new THREE.Vector3();

		if ( rotation === undefined )
		{
			rotation = new THREE.Euler( 0, 0, 0, "YXZ" );
		}
		
		// calculate direction
		rotation.set( this._player.head.rotation.x, this._player.rotation.y, 0 );
		result.set( 0, 0, 1 ).applyEuler( rotation );
		return result;
	};

}() );

/**
 * This method calculates the motions of the camera.
 * 
 * @param {number} delta - Elapsed time between two frames.
 * @param {THREE.Vector3} displacement - This vector contains the player's
 * displacement of the current frame.
 */
FirstPersonControls.prototype.calculateCameraMotion = ( function() {

	var audioStep1, audioStep2;

	return function( delta, displacement ) {

		var motion;

		// load audios if necessary
		if ( audioStep1 === undefined || audioStep2 === undefined )
		{
			audioStep1 = audioManager.getDynamicAudio( "controls.step1" );
			audioStep2 = audioManager.getDynamicAudio( "controls.step2" );
		}

		if ( this._move !== 0 || this._strafe !== 0 )
		{
			// get motion factor from displacement
			this._motionFactor += delta * displacement.length();

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
			// if player is not moving, reset camera
			this.resetCamera();
		}

	};

}() );

/**
 * This method resets the camera to its native position. The reset is done with
 * a simple linear transition.
 */
FirstPersonControls.prototype.resetCamera = function() {

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
 * Initializes the controls
 */
FirstPersonControls.prototype._init = function() {
	
	self = this;
	
	// set default height of the head
	this._setHeight( FirstPersonControls.DEFAULT.HEIGHT );
	
	// build relationship
	this._player.head.add( camera ); // camera -> head
	
	// the camera should look to positive z-axis by default
	camera.rotation.set( 0, Math.PI, 0 );

	// subscriptions
	eventManager.subscribe( TOPIC.CONTROLS.CAPTURE, this._onCapture );
	eventManager.subscribe( TOPIC.CONTROLS.LOCK, this._onLock );

	// events
	global.document.addEventListener( "lockPointer", this._onCapturePointer );
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
		var audioStep2 = audioManager.createDynamicSound( "controls.step2", bufferList[ 1 ], false, true );

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
 * This method does the actual translation of the controls.
 * 
 * @param {number} delta - Elapsed time between two frames.
 * @param {THREE.Vector3} displacement -The displacement vector.
 */
FirstPersonControls.prototype._calculateMovement = ( function() {

	var velocity;

	return function( delta, displacement ) {

		if ( velocity === undefined )
		{
			velocity = new THREE.Vector3();
		}

		// ensure displacement is set to zero
		displacement.set( 0, 0, 0 );

		// convert booleans to one number to determine the movement direction
		this._move = Number( this._isMoveForward ) - Number( this._isMoveBackward );
		this._strafe = Number( this._isMoveLeft ) - Number( this._isMoveRight );

		// calculate velocity
		velocity.z = this._calculateMoveVelocity( delta );
		velocity.x = this._calculateStrafeVelocity( delta );

		// assign move and strafe values to displacement vector
		displacement.z = this._move;
		displacement.x = this._strafe;

		// normalization prevents that the player moves to fast when
		// e.g. forward and right are pressed simultaneously
		displacement.normalize().multiply( velocity );

		return displacement;
	};

}() );

/**
 * Calculates a new sine frequency for camera motion. It ensures, that the new
 * sine cuvre is in-sync to the old one.
 */
FirstPersonControls.prototype._calculateFrequency = function() {

	var current, next;

	if ( this._frequency !== this._lastFrequency )
	{
		current = ( this._motionFactor * this._lastFrequency + this._phase ) % utils.TWO_PI;
		next = ( this._motionFactor * this._frequency ) % utils.TWO_PI;

		this._phase = current - next;
		this._lastFrequency = this._frequency;
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
 * Sets the height of the controls.
 * 
 * @param {number} height -  The height to set.
 */
FirstPersonControls.prototype._setHeight = function( height ) {

	this._player.head.position.y = height;
};

/**
 * Gets the height of the controls.
 * 
 * @returns {number} The control's height.
 */
FirstPersonControls.prototype._getHeight = function() {

	return this._player.head.position.y;
};

/**
 * Handles the "crouch" command. Crouching decreases the height and movement
 * speed of the player. These values are changed via animations.
 */
FirstPersonControls.prototype._handleCrouch = function() {

	// toogle boolean value
	this._isCrouch = !this._isCrouch;

	// running in crouch-mode not possible
	this._isRun = false;

	// save current timestamp and values for animation
	this._animationStartTime = global.performance.now();
	this._animationHeight = this._getHeight();
	this._animationMove = this._moveSpeed;
	this._animationStrafe = this._strafeSpeed;
	this._animationDeflection = this._deflection;
	this._animationFrequency = this._frequency;
};

/**
 * Handles the "run" command. Running increases the movement speed and the
 * camera shaking of the player. These values are changed via animations.
 * 
 * @param {boolean} isRun - Should the player run?
 */
FirstPersonControls.prototype._handleRun = function( isRun ) {

	this._isRun = isRun;

	// crouching in run-mode not possible
	this._isCrouch = false;

	// save current timestamp and values for animation
	this._animationStartTime = global.performance.now();
	this._animationHeight = this._getHeight();
	this._animationMove = this._moveSpeed;
	this._animationStrafe = this._strafeSpeed;
	this._animationDeflection = this._deflection;
	this._animationFrequency = this._frequency;
};

/**
 * Executes all animation methods of the controls.
 */
FirstPersonControls.prototype._animate = function(){
	
	this._animateCrouch();
	
	this._animateRun();
};

/**
 * Animates the transition between crouch and default position.
 */
FirstPersonControls.prototype._animateCrouch = function() {

	var elapsed, factor, targetHeight, targetMove, targetStrafe, targetDeflection, targetFrequency, valueHeight, valueSpeed;

	// animate only if necessary
	if ( ( this._isCrouch === true && this._getHeight() > FirstPersonControls.CROUCH.HEIGHT ) || 
		 ( this._isCrouch === false && this._isRun === false && this._getHeight() < FirstPersonControls.DEFAULT.HEIGHT ) )
	{
		// calculate elapsed time
		elapsed = ( global.performance.now() - this._animationStartTime ) * FirstPersonControls.CROUCH.ANIMATION.DURATION;

		// calculate factor for easing formula
		factor = elapsed > 1 ? 1 : elapsed;

		// calculate easing value
		valueSpeed = Easing.Cubic.In( factor );
		valueHeight = Easing.Cubic.Out( factor );

		// determine target values
		targetHeight = this._isCrouch === true ? FirstPersonControls.CROUCH.HEIGHT : FirstPersonControls.DEFAULT.HEIGHT;
		targetMove = this._isCrouch === true ? FirstPersonControls.CROUCH.SPEED.MOVE : FirstPersonControls.DEFAULT.SPEED.MOVE;
		targetStrafe = this._isCrouch === true ? FirstPersonControls.CROUCH.SPEED.STRAFE : FirstPersonControls.DEFAULT.SPEED.STRAFE;
		targetDeflection = this._isCrouch === true ? FirstPersonControls.CROUCH.CAMERA.DEFLECTION : FirstPersonControls.DEFAULT.CAMERA.DEFLECTION;
		targetFrequency = this._isCrouch === true ? FirstPersonControls.CROUCH.CAMERA.FREQUENCY : FirstPersonControls.DEFAULT.CAMERA.FREQUENCY;

		// do transition
		this._setHeight( this._animationHeight + ( targetHeight - this._animationHeight ) * valueHeight );
		this._moveSpeed = this._animationMove + ( targetMove - this._animationMove ) * valueSpeed;
		this._strafeSpeed = this._animationStrafe + ( targetStrafe - this._animationStrafe ) * valueSpeed;
		this._deflection = this._animationDeflection + ( targetDeflection - this._animationDeflection ) * valueSpeed;
		this._frequency = this._animationFrequency + ( targetFrequency - this._animationFrequency ) * valueSpeed;
	}

};

/**
 * Animates the transition between run and default movement.
 */
FirstPersonControls.prototype._animateRun = function() {

	var elapsed, factor, targetHeight, targetMove, targetStrafe, targetDeflection, targetFrequency, valueHeight, valueSpeed;

	// animate only if necessary
	if ( ( this._isRun === true && this._moveSpeed < FirstPersonControls.RUN.SPEED.MOVE ) || 
	     ( this._isRun === false && this._isCrouch === false && this._moveSpeed > FirstPersonControls.DEFAULT.SPEED.MOVE ) )
	{
		// calculate elapsed time
		elapsed = ( global.performance.now() - this._animationStartTime ) * FirstPersonControls.RUN.ANIMATION.DURATION;

		// calculate factor for easing formula
		factor = elapsed > 1 ? 1 : elapsed;

		// calculate easing value
		valueSpeed = Easing.Cubic.In( factor );
		valueHeight = Easing.Cubic.Out( factor );

		// determine target values
		targetHeight = this._isRun === true ? FirstPersonControls.RUN.HEIGHT : FirstPersonControls.DEFAULT.HEIGHT;
		targetMove = this._isRun === true ? FirstPersonControls.RUN.SPEED.MOVE : FirstPersonControls.DEFAULT.SPEED.MOVE;
		targetStrafe = this._isRun === true ? FirstPersonControls.RUN.SPEED.STRAFE : FirstPersonControls.DEFAULT.SPEED.STRAFE;
		targetDeflection = this._isRun === true ? FirstPersonControls.RUN.CAMERA.DEFLECTION : FirstPersonControls.DEFAULT.CAMERA.DEFLECTION;
		targetFrequency = this._isRun === true ? FirstPersonControls.RUN.CAMERA.FREQUENCY : FirstPersonControls.DEFAULT.CAMERA.FREQUENCY;

		// do transition
		this._setHeight(  this._animationHeight + ( targetHeight - this._animationHeight ) * valueHeight );
		this._moveSpeed = this._animationMove + ( targetMove - this._animationMove ) * valueSpeed;
		this._strafeSpeed = this._animationStrafe + ( targetStrafe - this._animationStrafe ) * valueSpeed;
		this._deflection = this._animationDeflection + ( targetDeflection - this._animationDeflection ) * valueSpeed;
		this._frequency = this._animationFrequency + ( targetFrequency - this._animationFrequency ) * valueSpeed;

	}
};

/**
 * Resets the movement. This avoids problems with moving players, even when they
 * hit no keys. This could happen, when you switch to main menu with pressed
 * wasd keys. The actual problem is, that the "keyup" event is not fired under
 * these circumstances.
 */
FirstPersonControls.prototype._reset = function() {

	this._isMoveForward = false;
	this._isMoveBackward = false;
	this._isMoveLeft = false;
	this._isMoveRight = false;
	this._isRun = false;
};

/**
 * Handles the activation message for the controls. Sets the flag that
 * indicates if the HTML5 pointer lock is active and the mouse pointer
 * is captured.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
FirstPersonControls.prototype._onCapture = function( message, data ) {

	self.isCaptured = data.isCaptured;

	self._reset();
};

/**
 * Handles the lock message of the controls. Sets the flag that 
 * indicates if the pointer lock is active, but the controls are
 * blocked for the player.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
FirstPersonControls.prototype._onLock = function( message, data ) {

	self.isLocked = data.isLocked;

	self._reset();
};

/**
 * Captures the pointer for detecting mouse movements.
 */
FirstPersonControls.prototype._onCapturePointer = function() {

	self.isUiElementActive = false;

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

	self.isUiElementActive = true;

	// Ask the browser to release the pointer
	global.document.exitPointerLock = global.document.exitPointerLock || global.document.mozExitPointerLock || global.document.webkitExitPointerLock;
	global.document.exitPointerLock();
};

/**
 * Detects the change of the pointer lock status. It is used to control the
 * menu.
 */
FirstPersonControls.prototype._onPointerlockchange = function() {

	var requestedElement = global.document.querySelector( "canvas" );

	if ( global.document.pointerLockElement === requestedElement || global.document.mozPointerLockElement === requestedElement || global.document.webkitPointerLockElement === requestedElement )
	{
		self.isCaptured = true;

		if ( self.isUiElementActive === false )
		{
			userInterfaceManager.hideMenu();
		}
		
		logger.log( "INFO: FirstPersonControls: Capture pointer and activate controls.");

	}
	else
	{
		self.isCaptured = false;

		if ( self.isUiElementActive === false )
		{
			userInterfaceManager.showMenu();
		}
		
		logger.log( "INFO: FirstPersonControls: Release pointer and deactivate controls.");
	}

	self._reset();
};

/**
 * Any error situation should be marked with an exception.
 */
FirstPersonControls.prototype._onPointerlockerror = function() {

	throw "ERROR: FirstPersonControls: Pointer Lock Error.";
};

/**
 * Detects any mouse movements, when pointer lock is active. Then it calculates
 * the rotation of player and head object.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onMouseMove = function( event ) {

	var movementX, movementY;

	if ( self.isCaptured === true && self.isLocked === false )
	{
		// capture mouse movement
		movementX = event.movementX || event.mozMovementX || 0;
		movementY = event.movementY || event.mozMovementY || 0;

		// manipulate rotation of player and head
		self._player.rotation.y -= movementX * ( settingsManager.getMouseSensitivity() * 0.0001 );
		self._player.head.rotation.x += movementY * ( settingsManager.getMouseSensitivity() * 0.0001 );

		// prevent "loop" of x-axis
		self._player.head.rotation.x = Math.max( - utils.HALF_PI, Math.min( utils.HALF_PI, self._player.head.rotation.x ) );
	}

};

/**
 * Executes, when a key is pressed down.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onKeyDown = ( function() {

	var position, direction;

	return function( event ) {

		if ( position === undefined )
		{
			position = new THREE.Vector3();
			direction = new THREE.Vector3();
		}

		if ( self.isCaptured === true && self.isLocked === false )
		{
			switch ( event.keyCode )
			{
				// w
				case 87:

					self._isMoveForward = true;

					break;

				// a
				case 65:

					self._isMoveLeft = true;

					break;

				// s
				case 83:

					self._isMoveBackward = true;

					break;

				// d
				case 68:

					self._isMoveRight = true;

					break;

				// c
				case 67:

					self._handleCrouch();

					break;

				// shift
				case 16:

					self._handleRun( true );

					break;

				// e
				case 69:
					
					// retrieve data
					self._player.head.getWorldPosition( position );
					self.getDirection( direction );

					// publish message with player data
					eventManager.publish( TOPIC.ACTION.INTERACTION, {
						position : position,
						direction : direction
					} );

					break;
			}
		}

	};

}() );

/**
 * Executes, when a key is released.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onKeyUp = function( event ) {

	if ( self.isCaptured === true && self.isLocked === false )
	{
		switch ( event.keyCode )
		{
			// w
			case 87:

				self._isMoveForward = false;

				break;

			// a
			case 65:

				self._isMoveLeft = false;

				break;

			// a
			case 83:

				self._isMoveBackward = false;

				break;

			// d
			case 68:

				self._isMoveRight = false;

				break;

			// shift
			case 16:

				if ( self._isCrouch === false )
				{
					self._handleRun( false );
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
		DEFLECTION : 0.4,
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
		DURATION : 0.0015
	}
};

module.exports = FirstPersonControls;