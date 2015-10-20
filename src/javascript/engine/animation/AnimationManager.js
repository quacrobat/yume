/**
 * @file Interface for entire animation-handling. This prototype is used in
 * stages to access animation-based logic and to create animation-entities.
 * 
 * @author Human Interactive
 */
"use strict";

var BasicAnimation = require( "../animation/Animation" );
var SpriteAnimation = require( "../animation/SpriteAnimation" );

/**
 * Creates the animation manager.
 * 
 * @constructor
 */
function AnimationManager() {

	Object.defineProperties( this, {
		_animations : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		_sprites : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );
}

/**
 * Creates an animation, which animates one property of an object.
 * 
 * @param {object} options - The options for the animation.
 * 
 * @returns {Animation} The new animation.
 */
AnimationManager.prototype.createBasicAnimation = function( options ) {

	var animation = new BasicAnimation( options );
	this.addAnimation( animation );
	return animation;
};

/**
 * Creates an animation, which animates one property of an object in an endless
 * loop.
 * 
 * @param {object} options - The options for the animation.
 * 
 * @returns {Animation} The new animation.
 */
AnimationManager.prototype.createHoverAnimation = function( options ) {

	var animation = new BasicAnimation( options );
	animation.setHover( true );
	this.addAnimation( animation );

	return animation;
};

/**
 * Creates a sprite animation.
 * 
 * @param {number} rows - Number of images in y-direction.
 * @param {number} columns - Number of images in x-direction.
 * @param {number} numberOfImages - Total number of images in the sprite.
 * @param {THREE.Texture} texture - Contains the sprite image. The dimension of
 * the texture should be a power of two, but it's not necessary.
 * @param {number} imagesPerSecond - How many images should be displayed per
 * second.
 * 
 * @returns {SpriteAnimation} The new sprite animation.
 */
AnimationManager.prototype.createSpriteAnimation = function( rows, columns, numberOfImages, texture, imagesPerSecond ) {

	var sprite = new SpriteAnimation( rows, columns, numberOfImages, texture, imagesPerSecond );
	this.addSpriteAnimation( sprite );

	return sprite;
};

/**
 * Update method for animations. Called in render-loop.
 * 
 * @param {number} delta - The time delta value.
 */
AnimationManager.prototype.update = function( delta ) {

	this._updateAnimations();

	this._updateSprites( delta );
};

/**
 * Updates the standard animations.
 */
AnimationManager.prototype._updateAnimations = function() {

	var animation, index, time;

	// use the same time value for all animations
	time = global.performance.now();

	// iterate over all animations
	for ( index = 0; index < this._animations.length; index++ )
	{
		// buffer current animation
		animation = this._animations[ index ];

		// only update the animation if it actually runs
		if ( animation.isPlaying === true )
		{
			// update the animation and check status
			if ( animation.update( time ) === true )
			{
				// remove automatically the animation after ending
				this.removeAnimation( animation );
			}
		}
	}
};

/**
 * Updates the sprite objects.
 * 
 * @param {number} delta - The time delta value.
 */
AnimationManager.prototype._updateSprites = function( delta ) {

	for ( var index = 0; index < this._sprites.length; index++ )
	{
		this._sprites[ index ].update( delta );
	}

};

/**
 * Adds a single animation object to the internal array.
 * 
 * @param {Animation} animation - The animation object to be added.
 */
AnimationManager.prototype.addAnimation = function( animation ) {

	this._animations.push( animation );
};

/**
 * Adds a single sprite object to the internal array.
 * 
 * @param {SpriteAnimation} sprite - The sprite object to be added.
 */
AnimationManager.prototype.addSpriteAnimation = function( sprite ) {

	this._sprites.push( sprite );
};

/**
 * Removes a single animation object from the internal array.
 * 
 * @param {Animation} animation - The animation object to be removed.
 */
AnimationManager.prototype.removeAnimation = function( animation ) {

	var index = this._animations.indexOf( animation );
	this._animations.splice( index, 1 );
};

/**
 * Removes a single sprite object from the internal array.
 * 
 * @param {SpriteAnimation} sprite - The sprite object to be removed.
 */
AnimationManager.prototype.removeAnimation = function( sprite ) {

	var index = this._sprites.indexOf( sprite );
	this._sprites.splice( index, 1 );
};

/**
 * Removes all animations from the internal array.
 */
AnimationManager.prototype.removeAnimations = function() {

	this._animations.length = 0;
};

/**
 * Removes all sprites from the internal array.
 */
AnimationManager.prototype.removeSprites = function() {

	this._sprites.length = 0;
};

module.exports = new AnimationManager();