/**
 * @file Prototype for defining an animation based on sprites.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates a sprite animation.
 * 
 * @constructor
 * 
 * @param {number} rows - Number of images in y-direction.
 * @param {number} columns - Number of images in x-direction.
 * @param {number} numberOfImages - Total number of images in the sprite.
 * @param {THREE.Texture} texture - Contains the sprite image. The dimension of
 * the texture should be a power of two, but it's not necessary.
 * @param {number} imagesPerSecond - How many images should be displayed per
 * second.
 */
function SpriteAnimation( rows, columns, numberOfImages, texture, imagesPerSecond ) {

	Object.defineProperties( this, {
		rows : {
			value : rows,
			configurable : false,
			enumerable : true,
			writable : false
		},
		columns : {
			value : columns,
			configurable : false,
			enumerable : true,
			writable : false
		},
		numberOfImages : {
			value : numberOfImages,
			configurable : false,
			enumerable : true,
			writable : false
		},
		texture : {
			value : texture,
			configurable : false,
			enumerable : true,
			writable : false
		},
		imagesPerSecond : {
			value : imagesPerSecond,
			configurable : false,
			enumerable : true,
			writable : true
		},
		_currentImage : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_elapsedTime : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// this will zoom into the texture, so you see exactly one image of the
	// sprite
	this.texture.repeat.set( 1 / this.columns, 1 / this.rows );
}

/**
 * Updates the sprite animation.
 * 
 * @param {number} delta - The update time.
 */
SpriteAnimation.prototype.update = function( delta ) {

	var currentColumn, currentRow;

	// calculate the elapsed time
	this._elapsedTime += delta * this.imagesPerSecond;

	// derive the index of the current image
	this._currentImage = Math.floor( this._elapsedTime );

	// if the index is greater than the total number of images,
	// reset the the counter to zero.
	if ( this._currentImage >= this.numberOfImages )
	{
		this._currentImage = 0;
		this._elapsedTime = 0;
	}

	// calculate the index of the current column
	currentColumn = this._currentImage % this.columns;

	// calculate texture offset in x-direction
	this.texture.offset.x = currentColumn / this.columns;

	// calculate the index of the current row
	currentRow = Math.floor( this._currentImage / this.columns );

	// calculate texture offset in y-direction.
	// because the first picture in sprites is usually in the upper left,
	// you need to start from 1 instead from zero.
	this.texture.offset.y = 1 - ( currentRow / this.rows + 1 / this.rows );

};

module.exports = SpriteAnimation;