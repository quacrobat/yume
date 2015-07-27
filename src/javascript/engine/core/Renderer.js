/**
 * @file This prototype contains the entire logic 
 * for rendering-based functionality. The renderer can
 * add and remove post-processing effects at any time.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");
var PubSub = require("pubsub-js");

var camera = require("./Camera");
var scene = require("./Scene");

var EffectComposer = require("../postprocessing/EffectComposer");
var RenderPass = require("../postprocessing/RenderPass");
var ShaderPass = require("../postprocessing/ShaderPass");

var GrayscaleShader = require("../shader/GrayscaleShader");
var VignetteShader = require("../shader/VignetteShader");
var GaussianBlurShader = require("../shader/GaussianBlurShader");

var utils = require("../etc/Utils");

var self;

/**
 * Creates a renderer.
 * 
 * @constructor
 * 
 */
function Renderer(){
	
	Object.defineProperties(this, {
		_renderer: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_composer: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_effectCount: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
		enablePostProcessing: {
			value: true,
			configurable: false,
			enumerable: true,
			writable: true
		}
	});
	
	self = this;
}

/**
 * Inits the renderer.
 */
Renderer.prototype.init = function(){
	
	// create WebGL renderer
	this._renderer = new THREE.WebGLRenderer({antialias : true, alpha : true});

//	this._renderer.setPixelRatio(global.window.devicePixelRatio);
	this._renderer.setSize(global.window.innerWidth, global.window.innerHeight);
	this._renderer.setClearColor(0x000000);
	this._renderer.gammaInput = true;
	this._renderer.gammaOutput = true;
	this._renderer.shadowMapEnabled = true;
	
	// append renderer to DOM
	global.document.querySelector("#canvas-container").appendChild(this._renderer.domElement);
	
	// create effect composer for post-processing
	this._composer = new EffectComposer(this._renderer);
	
	// set subscriptions
	PubSub.subscribe("ui.event.resize", this._onResize);
};

/**
 * Renders the frame.
 * 
 * @param {Scene} scene - The scene object.
 * @param {Camera} camera - The camera object.
 */
Renderer.prototype.render = function(scene, camera){
	
	if(this._effectCount > 0 && this.enablePostProcessing === true){
		this._composer.render();
	}else{
		this._renderer.render(scene, camera);
	}
};

/**
 * Prepares the renderer for post-processing. This method
 * creates internally a custom framebuffer (render target).
 */
Renderer.prototype.preparePostProcessing = function(){
	
	this._composer.addPass(new RenderPass(scene, camera));
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: Renderer: Init post-processing for stage.");
	}
};

/**
 * Adds a grayscale effect via post-processing.
 * 
 * @param {boolean} renderToScreen - Determines screen or off-screen rendering.
 * 
 * @returns {ShaderPass} The new effect.
 */
Renderer.prototype.addGrayscaleEffect = function(renderToScreen){
	
	var effect = new ShaderPass(GrayscaleShader);
	effect.renderToScreen = renderToScreen;
	this._composer.addPass(effect);
	this._effectCount++;
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: Renderer: Added grayscale effect.");
	}
	
	return effect;
};

/**
 * Adds a vignette effect via post-processing.
 * 
 * @param {boolean} renderToScreen - Determines screen or off-screen rendering.
 * 
 * @returns {ShaderPass} The new effect.
 */
Renderer.prototype.addVignetteEffect = function(renderToScreen){
	
	var effect = new ShaderPass(VignetteShader);
	effect.renderToScreen = renderToScreen;
	this._composer.addPass(effect);
	this._effectCount++;
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: Renderer: Added vignette effect.");
	}
	
	return effect;
};

/**
 * Adds a horizontal gaussian blur effect via post-processing.
 * 
 * @param {boolean} renderToScreen - Determines screen or off-screen rendering.
 * 
 * @returns {ShaderPass} The new effect.
 */
Renderer.prototype.addHBlurEffect = function(renderToScreen){
	
	var effect = new ShaderPass(GaussianBlurShader);
	effect.renderToScreen = renderToScreen;
	
	// set uniforms
	effect.uniforms.direction.value = new THREE.Vector2(1.0, 0.0); // x-axis
	effect.uniforms.blur.value = 1.0 / global.window.innerWidth;
	
	this._composer.addPass(effect);
	this._effectCount++;
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: Renderer: Added horizonzal blur effect.");
	}
	
	return effect;
};

/**
 * Adds a vertical gaussian blur effect via post-processing.
 * 
 * @param {boolean} renderToScreen - Determines screen or off-screen rendering.
 * 
 * @returns {ShaderPass} The new effect.
 */
Renderer.prototype.addVBlurEffect = function(renderToScreen){
	
	var effect = new ShaderPass(GaussianBlurShader);
	effect.renderToScreen = renderToScreen;
	
	// set uniforms
	effect.uniforms.direction.value = new THREE.Vector2(0.0, 1.0); // y-axis
	effect.uniforms.blur.value = 1.0 / global.window.innerHeight;
	
	this._composer.addPass(effect);
	this._effectCount++;
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: Renderer: Added vertical blur effect.");
	}
	
	return effect;
};


/**
 * Removes a post-processing effect from the renderer.
 *
 * @param {ShaderPass} effect - The effect to remove.
 */
Renderer.prototype.removeEffect = function(effect){
	
	this._composer.removePass(effect);
	this._effectCount--;
};

/**
 * Clears the renderer.
 */
Renderer.prototype.clear = function(){
	
	// stop post-processing
	this._composer.removePasses();
	this._effectCount = 0;
	
	// clear the internal renderer
	this._renderer.clear();
};

/**
 * Returns the maximum anisotropic filter value.
 * 
 * @returns {number} The maximum anisotropic filter value.
 */
Renderer.prototype.getMaxAnisotropy = function(){
	return this._renderer.getMaxAnisotropy();
};

/**
 * Resizes the camera and render-dimensions.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
Renderer.prototype._onResize = function(message, data){
	
	// resize renderer and effect composer
	self._renderer.setSize(global.window.innerWidth, global.window.innerHeight);
	self._composer.setSize(global.window.innerWidth, global.window.innerHeight);
	
	// update camera dimensions
	camera.aspect = global.window.innerWidth / global.window.innerHeight;
	camera.updateProjectionMatrix();
};

module.exports = new Renderer();