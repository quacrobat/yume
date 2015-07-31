/**
 * @file This prototype contains the entire logic 
 * for camera-based functionality.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require("three");
var PubSub = require("pubsub-js");

var self;

/**
 * Creates a perspective camera.
 * 
 * @constructor
 * @augments THREE.PerspectiveCamera
 * 
 */
function Camera(){

	 THREE.PerspectiveCamera.call(this);
	 
	 self = this;
}

Camera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
Camera.prototype.constructor = Camera;

/**
 * Inits the camera.
 * 
 * @param {number} fov - The field of view.
 * @param {number} aspect - The aspect ratio.
 * @param {number} near - The near distance.
 * @param {number} far - The far distance.
 */
Camera.prototype.init = function(fov, aspect, near, far){
	
	this.fov = fov || 45;
	this.aspect = aspect || global.window.innerWidth / global.window.innerHeight;
	this.near = near || 0.1;
	this.far = far || 1000;
	
	this.updateProjectionMatrix();
	
	// set subscriptions
	PubSub.subscribe("ui.event.resize", this._onResize);
};


/**
 * Resizes the camera.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {string} data - The data of the topic message.
 */
Camera.prototype._onResize = function(message, data){
		
	// update camera dimensions
	self.aspect = global.window.innerWidth / global.window.innerHeight;
	self.updateProjectionMatrix();
};

module.exports = new Camera();