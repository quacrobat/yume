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
		_renderTarget1 : {
			value : renderTarget,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_renderTarget2 : {
			value : null,
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
	if ( this._renderTarget1 === undefined )
	{
		var width = this._renderer.context.drawingBufferWidth;
		var height = this._renderer.context.drawingBufferHeight;
		var parameters = {
			minFilter : THREE.LinearFilter,
			magFilter : THREE.LinearFilter,
			format : THREE.RGBFormat,
			stencilBuffer : false
		};

		this._renderTarget1 = new THREE.WebGLRenderTarget( width, height, parameters );
	}
	
	this._renderTarget2 = this._renderTarget1.clone();

	// create read/write buffers based on the render targets
	this._readBuffer = this._renderTarget1;
	this._writeBuffer = this._renderTarget2;
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
 * Inserts a pass to the internal array at a specific position.
 * 
 * @param {object} pass - Render or shader pass.
 * @param {number} index - The position to insert.
 */
EffectComposer.prototype.insertPass = function( pass, index ) {

	this.passes.splice( index, 0, pass );
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
 * Removes all passes from the internal array.
 */
EffectComposer.prototype.clear = function() {

	this._passes.length = 0;
};

/**
 * Does the actual post processing.
 */
EffectComposer.prototype.render = function() {

	var pass, index;

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

/**
 * Resets the internal render targets/framebuffers.
 * 
 * @param {THREE.WebGLRenderTarget} renderTarget - The render target.
 */
EffectComposer.prototype.reset = function( renderTarget ) {

	if ( renderTarget === undefined )
	{
		renderTarget = this._renderTarget1.clone();

		renderTarget.setSize( 
				this._renderer.context.drawingBufferWidth,
				this._renderer.context.drawingBufferHeight
		);
	}

	this._renderTarget1.dispose();
	this._renderTarget1 = renderTarget;
	this._renderTarget2.dispose();
	this._renderTarget2 = renderTarget.clone();

	this._readBuffer = this._renderTarget1;
	this._writeBuffer = this._renderTarget2;

};

/**
 * Sets the size of the render target.
 * 
 * @param {number} width - The width of render target.
 * @param {number} height - The height of render target.
 */
EffectComposer.prototype.setSize = function( width, height ) {
		
	this._renderTarget1.setSize( 
			width * this._renderer.getPixelRatio(),
			height * this._renderer.getPixelRatio()
	);
	
	this._renderTarget2.setSize( 
			width * this._renderer.getPixelRatio(),
			height * this._renderer.getPixelRatio()
	);
};

/**
 * Swaps the internal framebuffers.
 */
EffectComposer.prototype._swapBuffers = function() {

	var temp = this._readBuffer;
	this._readBuffer = this._writeBuffer;
	this._writeBuffer = temp;

};

module.exports = EffectComposer;