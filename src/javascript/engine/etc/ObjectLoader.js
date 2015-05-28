/**
 * @file Prototype for loading 3D objects in object-format 
 * from the server. The objects are provided with Blender.
 * 
 * @author Human Interactive
 */
"use strict";

var PubSub = require("pubsub-js");
var THREE = require("three");
var utils = require("./Utils");

/**
 * Creates a ObjectLoader.
 * 
 * @constructor
 * @augments THREE.ObjectLoader
 * 
 * @param {boolean} manager - The Loading Manager.
 */
function ObjectLoader(manager) {

	THREE.ObjectLoader.call(this, manager);
	
	this.crossOrigin = "anonymous";
}

ObjectLoader.prototype = Object.create(THREE.ObjectLoader.prototype);
ObjectLoader.prototype.constructor = ObjectLoader;

/**
 * Loads a 3D object. Overwrites the standard method of three.js.
 * 
 * @param {string} url - The URL of the 3d object.
 * @param {function} onLoad - This callback function is executed, when the model is loaded and parsed.
 * @param {function} onProgress - This callback function is executed, when parts of the object are loaded.
 * @param {function} onError - This callback function is executed, when there is an error situation.
 */
ObjectLoader.prototype.load = function (url, onLoad, onProgress, onError) {
	
	url = utils.getCDNHost() + url;
	this.texturePath = utils.getCDNHost() + this.texturePath;

	if ( this.texturePath === "" ) {
		this.texturePath = url.substring( 0, url.lastIndexOf( "/" ) + 1 );
	}

	var scope = this;

	var loader = new THREE.XHRLoader(scope.manager);
	loader.setCrossOrigin(this.crossOrigin);
	loader.load(url, function (text) {

		// parse result
		scope.parse(JSON.parse(text), onLoad);
		
		// publish message
		PubSub.publish("loading.complete.object", {url: url});

	}, onProgress, onError);
	
	// publish message to inform about status
	PubSub.publish("loading.start.object", {url: url});
};

module.exports = ObjectLoader;