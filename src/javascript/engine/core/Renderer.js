/**
 * @file This prototype contains the entire logic 
 * for rendering-based functionality.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");
var PubSub = require("pubsub-js");

var camera = require("./Camera");

var options = {
	antialias : true,
	alpha : true
};

var self;

/**
 * Creates a renderer.
 * 
 * @constructor
 * @augments THREE.WebGLRenderer
 * 
 */
function Renderer(options){

	THREE.WebGLRenderer.call(this, options);
	
	self = this;
}

Renderer.prototype = Object.create(THREE.WebGLRenderer.prototype);
Renderer.prototype.constructor = Renderer;

/**
 * Inits the renderer
 */
Renderer.prototype.init = function(){

	// this.setPixelRatio(window.devicePixelRatio);
	this.setSize(global.window.innerWidth, global.window.innerHeight);
	this.setClearColor(0x000000);
	this.gammaInput = true;
	this.gammaOutput = true;
	this.shadowMapEnabled = true;
	
	// append renderer to DOM
	global.document.querySelector("#canvas-container").appendChild(this.domElement);
	
	// set subscriptions
	PubSub.subscribe("ui.event.resize", this._onResize);
};

/**
 * Resizes the camera and render-dimensions.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
Renderer.prototype._onResize = function(message, data){
	self.setSize(global.window.innerWidth, global.window.innerHeight);
	camera.aspect = global.window.innerWidth / global.window.innerHeight;
	camera.updateProjectionMatrix();
};

module.exports = new Renderer(options);