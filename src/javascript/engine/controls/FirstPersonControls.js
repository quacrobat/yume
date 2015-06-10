/**
 * @file Prototype for first person controls. The logic uses
 * HTML5 Pointer Lock API to capture mouse-movements. The camera is stored
 * within two 3D-objects (yaw and pitch) to effectively handle
 * orientation stuff and head motions.
 * 
 * @author Human Interactive
 */

"use strict";

var PubSub = require("pubsub-js");
var THREE = require("three");

var scene = require("../core/Scene");
var camera = require("../core/Camera");
var actionManager = require("../action/ActionManager");
var audioManager = require("../audio/AudioManager");
var userInterfaceManager = require("../ui/UserInterfaceManager");
var settingsManager = require("../etc/SettingsManager");
var utils = require("../etc/Utils");

var self;

/**
 * Creates the first person controls.
 * 
 * @constructor
 */
function FirstPersonControls(){
	
	// parents of camera object
	Object.defineProperties(this, {
		_yawObject: {
			value: new THREE.Object3D(),
			configurable: false,
			enumerable: false,
			writable: false
		},
		_pitchObject: {
			value: new THREE.Object3D(),
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
	
	// ground array
	Object.defineProperties(this, {
		_grounds: {
			value: [],
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
	
	// movement properties
	Object.defineProperties(this, {
		_moveForward: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_moveBackward: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_moveLeft: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_moveRight: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_move: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_strafe: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_moveSpeed: {
			value: FirstPersonControls.DEFAULT.SPEED.MOVE,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_strafeSpeed: {
			value: FirstPersonControls.DEFAULT.SPEED.STRAFE,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_height: {
			value: FirstPersonControls.DEFAULT.HEIGHT,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_animationStartTime: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_animationStartHeight: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
	
	// used for head motion calculation
	Object.defineProperties(this, {
		_motionFactor: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_motionCurveUp: {
			value: true,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_motionLastValue: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
	});
	
	// flags
	Object.defineProperties(this, {
		_isCrouch: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_isControlsActive: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_isUiElementActive: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
		isActionInProgress: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
	});
	
	// raycaster
	Object.defineProperties(this, {
		_rayCaster: {
			value: new THREE.Raycaster(),
			configurable: false,
			enumerable: false,
			writable: false
		}
	});

	// build relationship
	this._pitchObject.add(camera); // camera -> pitch
	this._yawObject.add(this._pitchObject); // pitch -> yaw
	
	// add to scene
	scene.add(this._yawObject);
	
	// type definition
	this._yawObject.type = "Controls";
	
	self = this;
}


/**
 * Sets the position of the controls.
 * 
 * @param {THREE.Vector3} position - The position to set.
 */
FirstPersonControls.prototype.setPosition = function(position) {
	
	this._yawObject.position.x = position.x;
	this._yawObject.position.y = position.y + this._height;
	this._yawObject.position.z = position.z;
};

/**
 * Gets the position of the controls.
 * 
 * @returns {THREE.Vector3} The position vector.
 */
FirstPersonControls.prototype.getPosition = function() {
	
	return new THREE.Vector3().copy(this._yawObject.position);
};

/**
 * Sets the rotation of the controls.
 * 
 * @param {THREE.Euler} rotation - The rotation to set.
 */
FirstPersonControls.prototype.setRotation = function(rotation) {
	
	this._pitchObject.rotation.x = rotation.x;
	this._yawObject.rotation.y = rotation.y;
};

/**
 * Gets the rotation of the controls.
 * 
 * @returns {THREE.Euler} The rotation in euler.
 */
FirstPersonControls.prototype.getRotation = function() {
	
	return new THREE.Euler(this._pitchObject.rotation.x, this._yawObject.rotation.y, 0);
};

/**
 * Adds a ground object to the internal grounds array.
 * 
 * @param {THREE.Mesh} object - The ground to add.
 */
FirstPersonControls.prototype.addGround = function(object) {
	
	this._grounds.push(object);
};

/**
 * Removes all ground objects from the internal array.
 */
FirstPersonControls.prototype.removeGrounds = function() {
	
	this._grounds.length = 0;
};

/**
 * Gets the direction of the camera.
 * 
 * @returns {THREE.Vector3} The direction vector.
 */
FirstPersonControls.prototype.getDirection = (function() {

	var result = new THREE.Vector3(0, 0, 0);
	var direction = new THREE.Vector3(0, 0, -1);
	var rotation = new THREE.Euler(0, 0, 0, "YXZ");
	
	return function(){
		
		// calculate direction
		rotation.set(this._pitchObject.rotation.x, this._yawObject.rotation.y, 0);
		result.copy(direction).applyEuler(rotation);
		return result;	
	};
}());

/**
 * Gets the height of the current ground.
 * 
 * @returns {number} The height.
 */
FirstPersonControls.prototype.getGroundHeight = function() {
	
	return this._yawObject.position.y - this._height;
};

/**
 * Initializes the controls
 */
FirstPersonControls.prototype.init = function() {
	
	if(utils.isFirefox() === true){
		// eventing
		global.document.addEventListener("lockPointer", this._onLockPointer);
		global.document.addEventListener("releasePointer", this._onReleasePointer);
	}else{
		// subscriptions
		PubSub.subscribe("controls.pointer.lock", this._onLockPointer);
		PubSub.subscribe("controls.pointer.release", this._onReleasePointer);
	}
	PubSub.subscribe("controls.active", this._onActive);
	
	global.document.addEventListener("mousemove", this._onMouseMove);
	global.document.addEventListener("keydown", this._onKeyDown);
	global.document.addEventListener("keyup", this._onKeyUp);

	global.document.addEventListener("pointerlockchange", this._onPointerlockchange);
	global.document.addEventListener("mozpointerlockchange", this._onPointerlockchange);
	global.document.addEventListener("webkitpointerlockchange", this._onPointerlockchange);
	
	global.document.addEventListener("pointerlockerror", this._onPointerlockerror);
	global.document.addEventListener("mozpointerlockerror", this._onPointerlockerror);
	global.document.addEventListener("webkitpointerlockerror", this._onPointerlockerror);
	
	// load and assign audio buffers for steps
	audioManager.createAudioBufferList(["step1", "step2"], function(bufferList){
		
		// create new audios
		var audioStep1 = audioManager.createDynamicSound("controls.step1", bufferList[0], false, true);
		var audioStep2 = audioManager.createDynamicSound("controls.step2", bufferList[1], false, 1, true);
		
		// add variations
		audioStep1.addPitchVariation(function(){
			return 0.9 + Math.random() * 0.4;
		});
		audioStep2.addPitchVariation(function(){
			return 0.9 + Math.random() * 0.4;
		});
		
		// assign audios to camera
		camera.add(audioStep1);
		camera.add(audioStep2);

	}).load();
};

/**
 * Central update method called within the render-loop.
 * 
 * @param {number} delta - Elapsed time between two frames.
 */
FirstPersonControls.prototype.update = function(delta){
	
	if (this._isControlsActive === true && this.isActionInProgress === false) {
		
		this._translate(delta);
		
		this._checkInteractiveObjects();
		
		this._checkAndProcessTrigger();
		
		this._animateCrouch(delta);
		
		this._publishPlayerStatus();
	}else{
		// reset camera position
		this._translateCameraToOrigin();
	}
};

/**
 * This method does the actual translation of the controls.
 * 
 * @param {number} delta - Elapsed time between two frames.
 */
FirstPersonControls.prototype._translate = (function() {
	
	var velocity = new THREE.Vector3();
	var normalizedMovement = new THREE.Vector3();
	var lastPosition = new THREE.Vector3();
	
	return function(delta){
		
		// store last position
		lastPosition.copy(this._yawObject.position);
		
		// convert booleans to one number per axis (1, 0, -1)
		this._move = Number(this._moveBackward) - Number(this._moveForward);
		this._strafe = Number(this._moveRight) - Number(this._moveLeft);
		
		velocity.z = this._calculateMoveVelocity(delta);
		velocity.x = this._calculateStrafeVelocity(delta);
		
		normalizedMovement.z = this._move;
		normalizedMovement.x = this._strafe;
		
		// this prevents, that the player moves to fast, when
		// e.g. forward and right are pressed simultaneously
		normalizedMovement.normalize().multiply(velocity);
		
		// actual translation of the controls position
		this._yawObject.translateX(normalizedMovement.x);
		this._yawObject.translateY(normalizedMovement.y);
		this._yawObject.translateZ(normalizedMovement.z);
		
		if(this._isCollisionHandlingRequired() === true){
			
			// restore last position
			this._yawObject.position.copy(lastPosition);
			
			// reset camera position
			this._translateCameraToOrigin();
		}else{
			// calculate camera motions
			this._calculateCameraMotion(normalizedMovement, delta);
		}
	};
}());

/**
 * This method calculates the motions of the camera.
 * 
 * @param {THREE.Vector3} normalizedMovement - This vector contains the translation of the current frame
 * @param {number} delta - Elapsed time between two frames.
 */
FirstPersonControls.prototype._calculateCameraMotion = (function() {
	
	var motion = 0;
	var audioStep1 = null;
	var audioStep2 = null;
	
	return function(normalizedMovement, delta){
		
		if(audioStep1 === null){
			audioStep1 = audioManager.getDynamicAudio("controls.step1");
		}
		if(audioStep2 === null){
			audioStep2 = audioManager.getDynamicAudio("controls.step2");
		}
		
		if(this._move !== 0 || this._strafe !== 0){
			
			// motion calculation
			this._motionFactor += delta * (Math.min(Math.abs(normalizedMovement.z) + Math.abs(normalizedMovement.x), this._moveSpeed));
			
			motion = Math.sin(this._motionFactor * FirstPersonControls.CAMERA.SHAKEFREQUENCY) * FirstPersonControls.CAMERA.DEFLECTION;

			camera.position.y = Math.abs(motion);
			camera.position.x = motion;
			
			// audio steps
			if(motion < this._motionLastValue && this._motionCurveUp === true){			
				this._motionCurveUp = false;
				audioStep1.play();
			}else if(motion > this._motionLastValue && this._motionCurveUp === false){		
				this._motionCurveUp = true;
				audioStep2.play();
			}		
			this._motionLastValue = motion;
			
		}else{
			// if player is not moving, translate camera back to origin
			this._translateCameraToOrigin();
		}
	};
	
}());

/**
 * This method resets the camera to its origin. The reset is done with a smooth and simple animation.
 */
FirstPersonControls.prototype._translateCameraToOrigin = function(){
	
	if(camera.position.y < 0){
		camera.position.y += FirstPersonControls.CAMERA.RESETFACTOR / 100;
		camera.position.y = Math.min(camera.position.y, 0);
	}else if(camera.position.y > 0){
		camera.position.y -= FirstPersonControls.CAMERA.RESETFACTOR/ 100;
		camera.position.y = Math.max(camera.position.y, 0);
	}
	
	if(camera.position.x < 0){
		camera.position.x += FirstPersonControls.CAMERA.RESETFACTOR / 100;
		camera.position.x = Math.min(camera.position.x, 0);
	}else if(camera.position.x > 0){
		camera.position.x -= FirstPersonControls.CAMERA.RESETFACTOR / 100;
		camera.position.x = Math.max(camera.position.x, 0);
	}
	
	this._motionFactor = 0;
	this._motionCurveUp = true;
	this._motionLastValue = 0;
};

/**
 * This method calculates the movement velocity in z-direction.
 * 
 * @param {number} delta - Elapsed time between two frames.
 * 
 * @returns {number} The velocity in z-direction.
 */
FirstPersonControls.prototype._calculateMoveVelocity = (function() {
	
	var acceleration = 0;
	
	return function (delta){
							
		if(this._move !== 0){
			acceleration += this._move * delta * FirstPersonControls.MOVE.ACCFACTOR;
			
			if(Math.abs(acceleration) > FirstPersonControls.MOVE.MAXACC){
				acceleration = FirstPersonControls.MOVE.MAXACC * this._move;
			}
			
		}else{
			acceleration = 0;
		}
		return Math.abs( Math.tan(acceleration) * this._moveSpeed);
	};
}());

/**
 * This method calculates the movement velocity in x-direction.
 * 
 * @param {number} delta - Elapsed time between two frames.
 * 
 * @returns {number} The velocity in x-direction.
 */
FirstPersonControls.prototype._calculateStrafeVelocity = (function() {
	
	var acceleration = 0;
	
	return function (delta){
		
		if(this._strafe !== 0){
			acceleration += this._strafe * delta * FirstPersonControls.STRAFE.ACCFACTOR;
			
			if(Math.abs(acceleration) > FirstPersonControls.STRAFE.MAXACC){
				acceleration = FirstPersonControls.STRAFE.MAXACC * this._strafe;
			}
		}else{
			acceleration = 0;
		}
		return Math.abs( Math.tan(acceleration) * this._strafeSpeed);
	};
}());

/**
 * This method calculates the height of the controls.
 * 
 * @param {number} distance - The distance between yawObject and ground.
 */
FirstPersonControls.prototype._calculateHeight = function(distance) {
	
	this._yawObject.position.y += ( this._height - distance );
};

/**
 * Gets the first intersection of the controls with an interactive object.
 * 
 * @returns {InteractiveObject|undefined} The interactive object, if there is an intersection.
 */
FirstPersonControls.prototype._getFirstInteractiveIntersection = (function() {
	
	var intersects = [];
	var index;
	
	return function(){
		
		this._rayCaster.set(this._yawObject.position, this.getDirection());
		this._rayCaster.far = 20;
		
		intersects = this._rayCaster.intersectObjects(actionManager.interactiveObjects);

		if (intersects.length > 0) {
			for(index = 0; index < intersects.length; index++){
				// return only an object, which is visible and has an active action
				if(intersects[index].object.object.visible === true && intersects[index].object.action.isActive === true){
					return intersects[index].object;
				}
			}
		} 
	};
}());

/**
 * This method controls the visibility of the interaction label.
 */
FirstPersonControls.prototype._checkInteractiveObjects = (function() {
	
	var object;
	
	return function(){
		
		object = this._getFirstInteractiveIntersection();
		
		if(object !== undefined){
			if(object.action !== undefined){
				userInterfaceManager.showInteractionLabel(object.action.label);			
			}else{
				userInterfaceManager.hideInteractionLabel();
			}
		}else{
			userInterfaceManager.hideInteractionLabel();
		}
	};
}());

/**
 * When the player wants to interact with an object, this method
 * determines the interactive object and runs the respective action.
 */
FirstPersonControls.prototype._interact = (function() {
	
	var object;
	
	return function(){
		
		object = this._getFirstInteractiveIntersection();
		
		if(object !== undefined){
			if(object.action !== undefined){
				object.action.run();
			}
		}
	};
	
}());

/**
 * This method checks the necessity of processing triggers and
 * running the respective action.
 */
FirstPersonControls.prototype._checkAndProcessTrigger = (function() {
	
	var intersects = [];
	var direction = new THREE.Vector3(0, -1, 0);
	var inRadius = false;
	
	return function(){
		
		this._rayCaster.set(this._yawObject.position, direction);
		this._rayCaster.far = this._height + 1;
		
		intersects = this._rayCaster.intersectObjects(actionManager.triggers);

		if (intersects.length > 0) {
			if(intersects[0].object.action !== undefined){
				if(inRadius === false && intersects[0].object.action.isActive === true){
					intersects[0].object.action.run();
					inRadius = true;
					if(utils.isDevelopmentModeActive() === true){
						console.log("INFO: FirstPersonControls: Trigger released and action \"%s\" executed.", intersects[0].object.action.label);
					}
				}				
			}else{
				throw "ERROR: FirstPersonControls: No action defined for trigger object.";
			}
		}else{
			inRadius = false;
		}
	};

}());

/**
 * Does the actual collision detection and returns a boolean value, that
 * indicates the collision status.
 * 
 * @returns {boolean} - Is there a collision after the latest movement?
 */
FirstPersonControls.prototype._isCollisionHandlingRequired = (function() {
	
	var objects = [];
	var intersects = [];
	var direction = new THREE.Vector3(0, -1, 0);
	var index;
	
	var boundingBox = new THREE.Box3();	// mathematical representation of the player body
	var center = new THREE.Vector3();	// center of body
	var size = new THREE.Vector3(); 	// body size
	
	return function(){
		
		if(this._grounds.length !== 0){
						
			this._rayCaster.set(this._yawObject.position, direction);
			this._rayCaster.far = FirstPersonControls.DEFAULT.HEIGHT + 1;
			
			// first, check grounds
			intersects = this._rayCaster.intersectObjects(this._grounds);
			
			if (intersects.length > 0){
				
				// adjust height
				this._calculateHeight(intersects[0].distance);
				
				// clear array
				objects = [];
				
				// concat arrays
				objects = actionManager.interactiveObjects.concat(actionManager.staticObjects);
				
				// compute center of player
				center.copy(this._yawObject.position);
				center.y -= (this._height / 2);
				
				// set size of BB
				size.set(4, this._height, 4);
				
				// compute BB, which represents the body of the player
				boundingBox.setFromCenterAndSize(center, size);
				
				for(index = 0; index < objects.length; index++){
					
					// regard only visible objects
					if(objects[index].object.visible === true){
						
						// detect collision via bounding-box-intersection
						if(objects[index].isIntersectionBox(boundingBox) === true){
							// Yes, we are inside an visible object and inside our level
							return true;
						}
					}
					
				}	
				// No, we are only in our level
				return false;
				
			}else{
				// Yes, because we are outside the level
				return true;
			}
		}
	};
}());

/**
 * Handles the "crouch" command. Causes implicitly an animation,
 * which changes the height of the player.
 */
FirstPersonControls.prototype._toogleCrouch = function(){
	
	if(this._isCrouch === true){
		// set "default mode", increase movement speed
		this._moveSpeed = FirstPersonControls.DEFAULT.SPEED.MOVE;
		this._strafeSpeed = FirstPersonControls.DEFAULT.SPEED.STRAFE;
		this._isCrouch = false;
		
	}else{
		// set "crouch mode", decrease movement speed
		this._moveSpeed = FirstPersonControls.CROUCH.SPEED.MOVE;
		this._strafeSpeed = FirstPersonControls.CROUCH.SPEED.STRAFE;
		this._isCrouch = true;
		
	}

	// save current timestamp and height for animation
	this._animationStartTime  = global.performance.now();
	this._animationStartHeight = this._height;
};

/**
 * Animates the change from default to crouch, or crouch to default position.
 */
FirstPersonControls.prototype._animateCrouch = (function(){
	
	var elapsed, factor, value = 0;
	
	return function(){
		
		// animate only, if necessary
		if(this._isCrouch === true  && this._height !== FirstPersonControls.CROUCH.HEIGHT ||
		   this._isCrouch === false && this._height !== FirstPersonControls.DEFAULT.HEIGHT){
		
			// calculate elapsed time
			elapsed = (global.performance.now() - this._animationStartTime) / FirstPersonControls.ANIMATION.CROUCH.DURATION;
			
			// calculate factor for easing formula
			factor = elapsed > 1 ? 1 : elapsed;
			
			// calculate easing value
			value = 1 - ( --factor * factor * factor * factor); // Easing QuarticOut
			
			if(this._isCrouch === true){
				
				if(this._height > FirstPersonControls.CROUCH.HEIGHT){
					
					this._height = this._animationStartHeight + ( FirstPersonControls.CROUCH.HEIGHT - this._animationStartHeight ) * value;
					
				}
				
			}else{
				
				if(this._height < FirstPersonControls.DEFAULT.HEIGHT){
					
					this._height = this._animationStartHeight + ( FirstPersonControls.DEFAULT.HEIGHT - this._animationStartHeight ) * value;
				}
			}
		}
	};
	
})();

/**
 * Publish the world information of the player for multiplayer.
 */
FirstPersonControls.prototype._publishPlayerStatus = (function(){
	
	var position = new THREE.Vector3();
	var quaternion = new THREE.Quaternion();
	var scale = new THREE.Vector3();
	
	return function(){
		
		// The pitch-object contains the entire position and  rotation
		// values of the player
		this._pitchObject.matrixWorld.decompose(position, quaternion, scale);
		
		PubSub.publish("message.game", {position: position, quaternion: quaternion});
	};

}());

/**
 * Resets the movement. This avoids problems with moving players,
 * even when they hit no keys. This could happen, when you switch
 * to main menu with pressed wasd keys. The actual problem is, that
 * the "keyup" event is not fired under these circumstances.
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
 * @param {string} data - The data of the topic message.
 */
FirstPersonControls.prototype._onActive = function(message, data) {
	
	self._isControlsActive = data.isActive;
	
	self._reset();
};


/**
 * Locks the pointer for detecting mouse movements.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
FirstPersonControls.prototype._onLockPointer = function(message, data) {
	
	self._isUiElementActive = false; 
		
	var element = global.document.querySelector("canvas");
	// Ask the browser to lock the pointer
	element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
	element.requestPointerLock();	
};

/**
 * Releases the locked pointer. This method is always called
 * by UI-Elements to release the pointer. It is not called, when
 * the Player goes via Esc to the Main Menu.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
FirstPersonControls.prototype._onReleasePointer = function(message, data) {
	
	self._isUiElementActive = true;
		
	// Ask the browser to release the pointer
	global.document.exitPointerLock = global.document.exitPointerLock || global.document.mozExitPointerLock || global.document.webkitExitPointerLock;
	global.document.exitPointerLock();	
};

/**
 * Detects the change of the pointer lock status. It is used to
 * control the Menu.
 */
FirstPersonControls.prototype._onPointerlockchange = function() {
	
	var requestedElement = global.document.querySelector("canvas");
	
	if (global.document.pointerLockElement === requestedElement || global.document.mozPointerLockElement === requestedElement || global.document.webkitPointerLockElement === requestedElement) {

		self._isControlsActive = true;
		if(self._isUiElementActive === false){
			userInterfaceManager.hideMenu();
		}

	} else {
		self._isControlsActive = false;
		if(self._isUiElementActive === false){
			userInterfaceManager.showMenu();
		}	
	}
	
	self._reset();
};

/**
 * Any error situation should be marked with an exception.
 */
FirstPersonControls.prototype._onPointerlockerror = function(event) {
	throw "ERROR: FirstPersonControls: Pointer Lock Error.";
};

/**
 * Detects any mouse movements, when pointer lock is active. Then it calculates the
 * rotation of yaw and pitch object.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onMouseMove = function(event) {

	if (self._isControlsActive === true && self.isActionInProgress === false){
		
		// capture mouse movement
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		// manipulate rotation of yaw and pitch object
		self._yawObject.rotation.y -= movementX * (settingsManager.getMouseSensitivity() / 10000);
		self._pitchObject.rotation.x -= movementY * (settingsManager.getMouseSensitivity() / 10000);

		// prevent "loop" of x-axis
		self._pitchObject.rotation.x = Math.max(-(Math.PI / 2), Math.min((Math.PI / 2), self._pitchObject.rotation.x));
	}
};

/**
 * Executes, when a key is pressed down.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onKeyDown = function(event) {
	
	if(self._isControlsActive === true){

		switch ( event.keyCode ) {
	
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
				
			case 69:
				// e
				self._interact();
				break;
				
			case 70:
				// f 
				userInterfaceManager.tooglePerformanceMonitor();
				break;
				
			case 80:
				// p
				if(utils.isDevelopmentModeActive() === true){
					utils.printWorldInformation();
				}
				break;
				
			case 32:
				// space
				userInterfaceManager.handleUiInteraction(event);		
				break;
		}
	}
};

/**
 * Executes, when a key is released.
 * 
 * @param {object} event - Default event object.
 */
FirstPersonControls.prototype._onKeyUp = function(event) {
	
	if(self._isControlsActive === true){
		switch( event.keyCode ) {
	
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
		}
	}
};

FirstPersonControls.CAMERA = {
	DEFLECTION: 0.2,
	SHAKEFREQUENCY: 15,
	RESETFACTOR: 2		
};

FirstPersonControls.DEFAULT = {
	HEIGHT: 13,
	SPEED: {
		MOVE: 0.4,
		STRAFE: 0.3
	}
};

FirstPersonControls.CROUCH = {
	HEIGHT: 6,
	SPEED: {
		MOVE: 0.2,
		STRAFE: 0.15
	}
};

FirstPersonControls.ANIMATION = {
		CROUCH: {
			DURATION: 1000
		}
};

FirstPersonControls.MOVE = {
	ACCFACTOR: 1,
	MAXACC: Math.PI/4
};

FirstPersonControls.STRAFE = {
	ACCFACTOR: 1,
	MAXACC: Math.PI/4
};

module.exports = new FirstPersonControls();