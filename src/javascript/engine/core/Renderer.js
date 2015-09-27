/**
 * @file This prototype contains the entire logic for rendering-based
 * functionality. The renderer can add and remove post-processing effects at any
 * time.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );
var PubSub = require( "pubsub-js" );

var TOPIC = require( "./Topic" );

var EffectComposer = require( "../postprocessing/EffectComposer" );
var RenderPass = require( "../postprocessing/RenderPass" );
var ShaderPass = require( "../postprocessing/ShaderPass" );

var GrayscaleShader = require( "../shader/GrayscaleShader" );
var VignetteShader = require( "../shader/VignetteShader" );
var GaussianBlurShader = require( "../shader/GaussianBlurShader" );

var logger = require( "../etc/Logger" );

var self;

/**
 * Creates a renderer.
 * 
 * @constructor
 * 
 */
function Renderer() {

	Object.defineProperties( this, {
		_renderer : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_composer : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_effectCount : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		enablePostProcessing : {
			value : true,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );

	self = this;
}

/**
 * Initializes the renderer.
 */
Renderer.prototype.init = function() {

	// create WebGL renderer
	this._renderer = new THREE.WebGLRenderer( {
		antialias : true,
		alpha : true
	} );

	// this._renderer.setPixelRatio(global.window.devicePixelRatio);
	this._renderer.setSize( global.window.innerWidth, global.window.innerHeight );
	this._renderer.setClearColor( 0x000000 );
	this._renderer.gammaInput = true;
	this._renderer.gammaOutput = true;
	this._renderer.shadowMapEnabled = true;

	// append renderer to DOM
	global.document.querySelector( "#canvas-container" ).appendChild( this._renderer.domElement );

	// create effect composer for post-processing
	this._composer = new EffectComposer( this._renderer );

	// set subscriptions
	PubSub.subscribe( TOPIC.APPLICATION.RESIZE, this._onResize );
};

/**
 * Renders the frame.
 * 
 * @param {Scene} scene - The scene object.
 * @param {Camera} camera - The camera object.
 * @param {THREE.WebGLRenderTarget} renderTarget - An optional render target.
 * @param {boolean} forceClear - Should the renderer clear the scene before
 * rendering?
 */
Renderer.prototype.render = function( scene, camera, renderTarget, forceClear ) {

	if ( this._effectCount > 0 && this.enablePostProcessing === true )
	{
		this._composer.render();
	}
	else
	{
		this._renderer.render( scene, camera, renderTarget, forceClear );
	}
};

/**
 * Prepares the renderer for post-processing. This method creates internally a
 * custom framebuffer (render target).
 * 
 * @param {World} world - The world object.
 * @param {Camera} camera - The camera object.
 */
Renderer.prototype.preparePostProcessing = function( world, camera ) {

	this._composer.addPass( new RenderPass( world.scene, camera ) );

	logger.log( "INFO: Renderer: Init post-processing for stage." );
};

/**
 * Adds a grayscale effect via post-processing.
 * 
 * @param {object} options - The options for the effect.
 * 
 * @returns {ShaderPass} The new effect.
 */
Renderer.prototype.addGrayscaleEffect = function( options ) {

	options = options || {};

	var effect = new ShaderPass( GrayscaleShader );
	effect.renderToScreen = options.renderToScreen;
	this._composer.addPass( effect );
	this._effectCount++;

	logger.log( "INFO: Renderer: Added grayscale effect." );

	return effect;
};

/**
 * Adds a vignette effect via post-processing.
 * 
 * @param {object} options - The options for the effect.
 * 
 * @returns {ShaderPass} The new effect.
 */
Renderer.prototype.addVignetteEffect = function( options ) {

	options = options || {};

	var effect = new ShaderPass( VignetteShader );
	effect.renderToScreen = options.renderToScreen;

	// set uniforms
	effect.uniforms.radius.value = options.radius || effect.uniforms.radius.value;
	effect.uniforms.strength.value = options.strength || effect.uniforms.strength.value;
	effect.uniforms.softness.value = options.softness || effect.uniforms.softness.value;

	this._composer.addPass( effect );
	this._effectCount++;

	logger.log( "INFO: Renderer: Added vignette effect." );

	return effect;
};

/**
 * Adds a horizontal gaussian blur effect via post-processing.
 * 
 * @param {object} options - The options for the effect.
 * 
 * @returns {ShaderPass} The new effect.
 */
Renderer.prototype.addHBlurEffect = function( options ) {

	options = options || {};

	var effect = new ShaderPass( GaussianBlurShader );
	effect.renderToScreen = options.renderToScreen;

	// set uniforms
	effect.uniforms.direction.value = new THREE.Vector2( 1, 0 ); // x-axis
	effect.uniforms.blur.value = ( options.blur || 1 ) / global.window.innerWidth;

	this._composer.addPass( effect );
	this._effectCount++;

	logger.log( "INFO: Renderer: Added horizonzal blur effect." );

	return effect;
};

/**
 * Adds a vertical gaussian blur effect via post-processing.
 * 
 * @param {object} options - The options for the effect.
 * 
 * @returns {ShaderPass} The new effect.
 */
Renderer.prototype.addVBlurEffect = function( options ) {

	options = options || {};

	var effect = new ShaderPass( GaussianBlurShader );
	effect.renderToScreen = options.renderToScreen;

	// set uniforms
	effect.uniforms.direction.value = new THREE.Vector2( 0, 1 ); // y-axis
	effect.uniforms.blur.value = ( options.blur || 1 ) / global.window.innerHeight;

	this._composer.addPass( effect );
	this._effectCount++;

	logger.log( "INFO: Renderer: Added vertical blur effect." );

	return effect;
};

/**
 * Removes a post-processing effect from the renderer.
 * 
 * @param {ShaderPass} effect - The effect to remove.
 */
Renderer.prototype.removeEffect = function( effect ) {

	this._composer.removePass( effect );
	this._effectCount--;
};

/**
 * Clears the renderer.
 */
Renderer.prototype.clear = function() {

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
Renderer.prototype.getMaxAnisotropy = function() {

	return this._renderer.getMaxAnisotropy();
};

/**
 * Returns the clear color of the renderer.
 * 
 * @returns {THREE.Color} The clear color.
 */
Renderer.prototype.getClearColor = function() {

	return this._renderer.getClearColor();
};

/**
 * Sets the clear color and alpha of the renderer.
 * 
 * @param {THREE.Color} color - The clear color.
 * @param {number} alpha - The clear alpha.
 */
Renderer.prototype.setClearColor = function( color, alpha ) {

	this._renderer.setClearColor( color, alpha );
};

/**
 * Returns the clear alpha value of the renderer.
 * 
 * @returns {number} The clear alpha.
 */
Renderer.prototype.getClearAlpha = function() {

	return this._renderer.getClearAlpha();
};

/**
 * Resizes the render-dimensions.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
Renderer.prototype._onResize = function( message, data ) {

	// resize renderer and effect composer
	self._renderer.setSize( global.window.innerWidth, global.window.innerHeight );
	self._composer.setSize( global.window.innerWidth, global.window.innerHeight );
};

module.exports = new Renderer();