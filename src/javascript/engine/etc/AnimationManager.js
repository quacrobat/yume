/**
 * @file Interface for entire animation-handling. This prototype is used in scenes
 * to access animation-based logic and to create animation-entities. The prototype
 * uses the framework TWEEN.js to create animations.
 * 
 * @author Human Interactive
 */
"use strict";

var TWEEN = require('tween.js');

/**
 * Creates the animation manager.
 * 
 * @constructor
 */
function AnimationManager() {
	
	Object.defineProperties(this, {	
		_animations: {
			value: [],
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
}

/**
 * Creates a basic animation, which animates on property from a source to a target value.
 * 
 * @param {number} sourceValue - The source value of the animated property.
 * @param {number} targetValue - The target value of the animated property.
 * @param {number} duration - The duration of the animation.
 * @param {TWEEN.Easing} graph - The animation graph.
 * @param {function} update - The onUpdate callback function.
 * @param {function} complete - The onComplete callback function.
 * 
 * @returns {TWEEN.Tween} The new animation.
 */
AnimationManager.prototype.createBasicAnimation = function(sourceValue, targetValue, duration, graph, update, complete){
	
	var animation = new TWEEN.Tween( { x: sourceValue } ).to( { x: targetValue }, duration ).easing( graph ).onUpdate(update);
	
	if(typeof complete === "function"){
		animation.onComplete(complete);
	}
	
	this.addAnimation(animation);
	return animation;
};

/**
 * Creates a hover animation for a given property. This method is used by
 * so called "Memory" objects in the application. It consists of two single animations,
 * which are chained together.
 * 
 * @param {number} sourceValue - The source value of the animated property.
 * @param {number} targetStart - The target value of the animated property for the first animation.
 * @param {number} targetEnd - The target value of the animated property for the second animation.
 * @param {number} duration - The duration of the animation.
 * @param {TWEEN.Easing} graph - The animation graph.
 * @param {function} update - The onUpdate callback function.
 * 
 * @returns {TWEEN.Tween} The new animation.
 */
AnimationManager.prototype.createHoverAnimation = function(sourceValue, targetStart, targetEnd, duration, graph, update){
	
	var source = {x: sourceValue};
	
	var animation 		= new TWEEN.Tween( source ).to( { x: targetStart }, duration ).easing( graph ).onUpdate(update);
	var animationBack 	= new TWEEN.Tween( source ).to( { x: targetEnd }, duration ).easing( graph ).onUpdate(update);
	
	animation.chain(animationBack);
	animationBack.chain(animation);
	
	this.addAnimation(animation);
	return animation;
};

/**
 * Creates a simple tracking shot.
 * 
 * @param {THREE.Vector3} sourcePosition - The source position of the camera.
 * @param {THREE.Vector3} targetPosition - The target position of the camera.
 * @param {THREE.Euler} sourceRotation - The source rotation of the camera.
 * @param {THREE.Euler} targetRotation - The target rotation of the camera.
 * @param {number} duration - The duration of the animation.
 * @param {TWEEN.Easing} graph - The animation graph.
 * @param {function} update - The onUpdate callback function.
 * @param {function} complete - The onComplete callback function.
 * 
 * @returns {TWEEN.Tween} The new animation.
 */
AnimationManager.prototype.createTrackingShot = function(sourcePosition, targetPosition, sourceRotation, targetRotation,  duration, graph, update, complete){
	
	var source = {positionX : sourcePosition.x, positionY : sourcePosition.y, positionZ : sourcePosition.z, rotationX : sourceRotation.x, rotationY : sourceRotation.y, rotationZ : sourceRotation.z};
	var target = {positionX : targetPosition.x, positionY : targetPosition.y, positionZ : targetPosition.z, rotationX : targetRotation.x, rotationY : targetRotation.y, rotationZ : targetRotation.z};
	
	var animation = new TWEEN.Tween(source).to(target, duration ).easing( graph ).onUpdate(update);
	
	if(typeof complete === "function"){
		animation.onComplete(complete);
	}
	
	this.addAnimation(animation);
	return animation;
};

/**
 * Update method for animations. Called in render-loop.
 */
AnimationManager.prototype.update = function(){
	
	TWEEN.update();
};

/**
 * Adds a single animation object to the internal array.
 * 
 * @param {TWEEN.Tween} animation - The animation object to be added.
 */
AnimationManager.prototype.addAnimation = function(animation){
	
	this._animations.push(animation);
};

/**
 * Removes a single animation object from the internal array.
 * 
 * @param {TWEEN.Tween} animation - The animation object to be removed.
 */
AnimationManager.prototype.removeAnimation = function(animation){
	
	// make sure, that the animation is stopped
	animation.stop();
	var index = this._animations.indexOf(animation);
	this._animations.splice(index, 1);
};

/**
 * Removes all animations from the internal array.
 */
AnimationManager.prototype.removeAnimations = function(){
	
	// stop all animations
	TWEEN.removeAll();
	this._animations.length = 0;
};

module.exports = new AnimationManager();