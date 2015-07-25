/**
 * @file This prototype provides a shader pass for post-processing.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

/**
 * Creates a shader pass.
 * 
 * @constructor
 * 
 * @param {object} shader - The shader source code.
 * @param {string} textureID - The name of the texture, which represents the readBuffer.
 */
function ShaderPass(shader, textureID){
	
	Object.defineProperties(this, {
		_textureID: {
			value: (textureID !== undefined) ? textureID : "tDiffuse",
			configurable: false,
			enumerable: false,
			writable: false
		},
		_scene: {
			value:  new THREE.Scene(),
			configurable: false,
			enumerable: false,
			writable: false
		},
		_camera: {
			value:  new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
			configurable: false,
			enumerable: false,
			writable: false
		},
		uniforms: {
			value:  THREE.UniformsUtils.clone(shader.uniforms),
			configurable: false,
			enumerable: true,
			writable: false
		},
		enabled: {
			value: true,
			configurable: false,
			enumerable: true,
			writable: true
		},
		needsSwap: {
			value:  true,
			configurable: false,
			enumerable: true,
			writable: false
		},
		renderToScreen: {
			value:  false,
			configurable: false,
			enumerable: true,
			writable: true
		}
	});

	var quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
	quad.material = new THREE.ShaderMaterial({

        defines: shader.defines || {},
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	});
	
	this._scene.add(quad);
}

/**
 * Renders a post processing effect.
 * 
 * @param {THREE.WebGLRenderer} renderer - The WebGL renderer.
 * @param {THREE.WebGLRenderTarget} writeBuffer - The target framebuffer.
 * @param {THREE.WebGLRenderTarget} readBuffer - The source framebuffer.
 */
ShaderPass.prototype.render = function(renderer, writeBuffer, readBuffer){
	
	if (this.uniforms[this._textureID] !== undefined) {

		this.uniforms[this._textureID].value = readBuffer;
	}
	
	// determine screen/ off-screen rendering
	if (this.renderToScreen === true) {

		renderer.render(this._scene, this._camera);
		
	} else {
		
		renderer.render(this._scene, this._camera, writeBuffer, false);
	}
};

module.exports = ShaderPass;