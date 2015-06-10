/**
 * @file This prototype contains the entire logic 
 * for scene-based functionality.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

/**
 * Creates a scene, which holds all 3D-objects 
 * of the application.
 * 
 * @constructor
 * @augments THREE.Scene
 * 
 */
function Scene(){

	THREE.Scene.call(this);
}

Scene.prototype = Object.create(THREE.Scene.prototype);
Scene.prototype.constructor = Scene;

/**
 * Clears the scene from all objects.
 * 
 */
Scene.prototype.clear = function(){
	for (var i = this.children.length - 1; i >= 0; i--) {
		if(this.children[i].type !== "Controls" && this.children[i].type !== "Player"){
			this.remove(this.children[i]);
		}
	}
};

module.exports = new Scene();