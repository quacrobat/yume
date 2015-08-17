/**
 * @file Interface for entire animation-handling. This prototype is used in stages
 * to access animation-based logic and to create animation-entities.
 * 
 * @author Human Interactive
 */
"use strict";

var BasicAnimation = require("../animation/Animation");

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
 * Creates an animation, which animates one property of an object.
 * 
 * @param {object} options - The options for the animation.
 * 
 * @returns {Animation} The new animation.
 */
AnimationManager.prototype.createBasicAnimation = function(options){
	
	var animation = new BasicAnimation(options);
	this.addAnimation(animation);
	return animation;
};

/**
 * Creates an animation, which animates one property of an object in an endless loop.
 * 
 * @param {object} options - The options for the animation.
 * 
 * @returns {Animation} The new animation.
 */
AnimationManager.prototype.createHoverAnimation = function(options){
	
	var animation = new BasicAnimation(options);
	animation.setHover(true);
	this.addAnimation(animation);
	
	return animation;
};

/**
 * Update method for animations. Called in render-loop.
 */
AnimationManager.prototype.update = (function(){
	
	var index, time = 0;
	var isFinished = false;
	var animation = null;
	
	return function() {
		
		// use the same time value for all animations
		time = global.performance.now();
		
		// iterate over all animations
		for( index = 0; index < this._animations.length; index++){
			
			// buffer current animation
			animation = this._animations[index];
			
			// only update the animation if it actually runs
			if( animation.isPlaying === true ){
				
				// update it and receive status
				isFinished = animation.update( time );
				
				// check status
				if( isFinished === true ){
					
					// remove automatically  the animation after ending
					this.removeAnimation( animation );
				}
			}		
		}
	};
	
}());

/**
 * Adds a single animation object to the internal array.
 * 
 * @param {Animation} animation - The animation object to be added.
 */
AnimationManager.prototype.addAnimation = function( animation ){
	
	this._animations.push(animation);
};

/**
 * Removes a single animation object from the internal array.
 * 
 * @param {Animation} animation - The animation object to be removed.
 */
AnimationManager.prototype.removeAnimation = function( animation ){
	
	var index = this._animations.indexOf(animation);
	this._animations.splice(index, 1);
};

/**
 * Removes all animations from the internal array.
 */
AnimationManager.prototype.removeAnimations = function(){
	
	// stop all animations
	this._animations.length = 0;
};

module.exports = new AnimationManager();