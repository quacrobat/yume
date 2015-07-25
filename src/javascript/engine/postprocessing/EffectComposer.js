/**
 * @file This prototype manages effects for post-processing.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

/**
 * Creates the effect composer.
 * 
 * @constructor
 * 
 * @param {THREE.WebGLRenderer} renderer - The WebGL renderer.
 * @param {THREE.WebGLRenderTarget} renderTarget - The render target.
 */
function EffectComposer(renderer, renderTarget){
	
	// if no render target is assigned, let's create a new one
	if (renderTarget === undefined) {
	
		var width  = Math.floor(renderer.context.canvas.width  / renderer.getPixelRatio()) || 1;
		var height = Math.floor(renderer.context.canvas.height / renderer.getPixelRatio()) || 1;
		var parameters = {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false};
	
		renderTarget = new THREE.WebGLRenderTarget(width, height, parameters);
	
	}
	
	Object.defineProperties(this, {
		_passes: {
			value: [],
			configurable: false,
			enumerable: false,
			writable: false
		},
		_renderer: {
			value: renderer,
			configurable: false,
			enumerable: false,
			writable: false
		},
		_renderTarget: {
			value: renderTarget,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_writeBuffer: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_readBuffer: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
	
	this._writeBuffer = this._renderTarget;
	this._readBuffer = this._renderTarget.clone();
}

/**
 * Adds a pass to the internal array.
 * 
 * @param {object} pass - Render or shader pass.
 */
EffectComposer.prototype.addPass = function(pass){
	
	this._passes.push(pass);
};

/**
 * Removes a pass from the internal array.
 * 
 * @param {object} pass - Render or shader pass.
 */
EffectComposer.prototype.removePass = function(pass){
	
	var index = this._passes.indexOf(pass);
	this._passes.splice(index, 1);
};

/**
 * Removes all Shader Passes from the internal array.
 */
EffectComposer.prototype.removePasses = function(){
	
	this._passes.length = 0;
};

/**
 * Renders the scene with all effects.
 */
EffectComposer.prototype.render = (function(){
	
	var pass, index;
	
	return function(){
		
		// process all assigned passes and call their render method
		for (index = 0; index < this._passes.length; index++) {

			pass = this._passes[index];

			if (pass.enabled === true){	

				pass.render(this._renderer, this._writeBuffer, this._readBuffer);
		
				if (pass.needsSwap === true) {
					
					this._swapBuffers();
				}
			}
		}
	};

}());

/**
 * Sets the size of the render target.
 * 
 * @param {number} width - The width of render target.
 * @param {number} height - The height of render target.
 */
EffectComposer.prototype.setSize = function(width, height){
	
	var renderTarget = this._renderTarget.clone();

	renderTarget.width = width;
	renderTarget.height = height;

	this._reset(renderTarget);
};

/**
 * Swaps the internal framebuffers.
 */
EffectComposer.prototype._swapBuffers = (function(){
	
	var temp = null;
	
	return function(){
		temp = this._readBuffer;
		this._readBuffer = this._writeBuffer;
		this._writeBuffer = temp;
	};
}());

/**
 * Resets the internal render targets/framebuffers.
 * 
 * @param {THREE.WebGLRenderTarget} renderTarget - The render target.
 */
EffectComposer.prototype._reset = function(renderTarget){
	
	if (renderTarget === undefined) {

		renderTarget = this._renderTarget.clone();

		renderTarget.width  = Math.floor(this._renderer.context.canvas.width  / this._renderer.getPixelRatio());
		renderTarget.height = Math.floor(this._renderer.context.canvas.height / this._renderer.getPixelRatio());

	}

	this._renderTarget = renderTarget;

	this._writeBuffer = this._renderTarget;
	this._readBuffer = this._renderTarget.clone();
};

module.exports = EffectComposer;