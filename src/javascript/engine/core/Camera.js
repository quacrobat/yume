/**
 * @file This prototype contains the entire logic 
 * for camera-based functionality.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require("three");

/**
 * Creates a perspective camera.
 * 
 * @constructor
 * @augments THREE.PerspectiveCamera
 * 
 */
function Camera(){

	 THREE.PerspectiveCamera.call(this, 45, global.window.innerWidth / global.window.innerHeight, 0.1, 1000);
}

Camera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
Camera.prototype.constructor = Camera;

module.exports = new Camera();