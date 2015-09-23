/**
 * @file This prototype provides a render pass for post-processing.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates a render pass.
 * 
 * @constructor
 * 
 * @param {Scene} scene - The scene object.
 * @param {Camera} camera - The camera object.
 */
function RenderPass( scene, camera ) {

	Object.defineProperties( this, {
		_scene : {
			value : scene,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_camera : {
			value : camera,
			configurable : false,
			enumerable : false,
			writable : false
		},
		enabled : {
			value : true,
			configurable : false,
			enumerable : true,
			writable : true
		},
		needsSwap : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : false
		}
	} );
}

/**
 * Renders the scene to a custom framebuffer for further processing.
 * 
 * @param {THREE.WebGLRenderer} renderer - The WebGL renderer.
 * @param {THREE.WebGLRenderTarget} writeBuffer - The target framebuffer.
 * @param {THREE.WebGLRenderTarget} readBuffer - The source framebuffer.
 */
RenderPass.prototype.render = function( renderer, writeBuffer, readBuffer ) {

	renderer.render( this._scene, this._camera, readBuffer, true );
};

module.exports = RenderPass;