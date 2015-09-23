/**
 * @file This prototype manages effects for post-processing.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates the effect composer.
 * 
 * @constructor
 * 
 * @param {THREE.WebGLRenderer} renderer - The WebGL renderer.
 * @param {THREE.WebGLRenderTarget} renderTarget - The render target.
 */
function EffectComposer( renderer, renderTarget ) {

	Object.defineProperties( this, {
		_passes : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		_renderer : {
			value : renderer,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_renderTarget : {
			value : renderTarget,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_readBuffer : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_writeBuffer : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// if no render target is assigned, let's create a new one
	if ( this._renderTarget === undefined )
	{
		var width = this._renderer.context.drawingBufferWidth;
		var height = this._renderer.context.drawingBufferHeight;
		var parameters = {
			minFilter : THREE.LinearFilter,
			magFilter : THREE.LinearFilter,
			format : THREE.RGBFormat,
			stencilBuffer : false
		};

		this._renderTarget = new THREE.WebGLRenderTarget( width, height, parameters );
	}

	// create read/write buffers based the render target
	this._readBuffer = this._renderTarget;
	this._writeBuffer = this._renderTarget.clone();
}

/**
 * Adds a pass to the internal array.
 * 
 * @param {object} pass - Render or shader pass.
 */
EffectComposer.prototype.addPass = function( pass ) {

	this._passes.push( pass );
};

/**
 * Removes a pass from the internal array.
 * 
 * @param {object} pass - Render or shader pass.
 */
EffectComposer.prototype.removePass = function( pass ) {

	var index = this._passes.indexOf( pass );
	this._passes.splice( index, 1 );
};

/**
 * Removes all Shader Passes from the internal array.
 */
EffectComposer.prototype.removePasses = function() {

	this._passes.length = 0;
};

/**
 * Renders the scene with all effects.
 */
EffectComposer.prototype.render = ( function() {

	var pass, index;

	return function() {

		// process all assigned passes and call their render method
		for ( index = 0; index < this._passes.length; index++ )
		{
			pass = this._passes[ index ];

			if ( pass.enabled === true )
			{
				pass.render( this._renderer, this._writeBuffer, this._readBuffer );

				if ( pass.needsSwap === true )
				{
					this._swapBuffers();
				}
			}
		}
	};

}() );

/**
 * Sets the size of the render target.
 * 
 * @param {number} width - The width of render target.
 * @param {number} height - The height of render target.
 */
EffectComposer.prototype.setSize = function( width, height ) {

	var renderTarget = this._renderTarget.clone();

	renderTarget.width = width * this._renderer.getPixelRatio();
	renderTarget.height = height * this._renderer.getPixelRatio();

	this._reset( renderTarget );
};

/**
 * Swaps the internal framebuffers.
 */
EffectComposer.prototype._swapBuffers = ( function() {

	var temp = null;

	return function() {

		temp = this._readBuffer;
		this._readBuffer = this._writeBuffer;
		this._writeBuffer = temp;
	};
}() );

/**
 * Resets the internal render targets/framebuffers.
 * 
 * @param {THREE.WebGLRenderTarget} renderTarget - The render target.
 */
EffectComposer.prototype._reset = function( renderTarget ) {

	if ( renderTarget === undefined )
	{
		renderTarget = this._renderTarget.clone();

		renderTarget.width = this._renderer.context.drawingBufferWidth;
		renderTarget.height = this._renderer.context.drawingBufferHeight;

	}

	this._renderTarget = renderTarget;

	this._readBuffer = this._renderTarget;
	this._writeBuffer = this._renderTarget.clone();

};

module.exports = EffectComposer;