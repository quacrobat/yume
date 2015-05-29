/**
 * @file Prototype for loading 3D objects in JSON-format 
 * from the server. The objects are provided with Blender.
 * 
 * @author Human Interactive
 */
"use strict";

var PubSub = require("pubsub-js");
var THREE = require("three");
var utils = require("./Utils");
/**
 * Creates a JSONLoader.
 * 
 * @constructor
 * @augments THREE.JSONLoader
 * 
 */
function JSONLoader() {

	THREE.JSONLoader.call(this);
	
	this.crossOrigin = "anonymous";
	this.texturePath = "";
}

JSONLoader.prototype = Object.create(THREE.JSONLoader.prototype);
JSONLoader.prototype.constructor = JSONLoader;

/**
 * Loads a 3D object. Overwrites the standard method of three.js.
 * 
 * @param {string} url - The URL of the 3D object.
 * @param {function} onLoad - This callback function is executed, when the model is loaded and parsed.
 */
JSONLoader.prototype.load = function(url, onLoad) {
	
	var self = this;
	
	// build url
	url = utils.getCDNHost() + url;
	
	// build texturePath
	if(this.texturePath === "") {
		this.texturePath = url.substring( 0, url.lastIndexOf( "/" ) + 1 );
	}
	
	// add nocache, if necessary
	if(utils.isDevelopmentModeActive() === true){
		url = url + "?" + new Date().getTime();
	}

	// create XMLHttpRequest object
	var xhr = new global.XMLHttpRequest();

	xhr.onreadystatechange = function() {

		if (xhr.readyState === xhr.DONE) {

			if (xhr.status === 200) {

				if (xhr.responseText) {
					
					// parse result
					var result = self.parse(JSON.parse(xhr.responseText), self.texturePath);
					
					// execute callback
					onLoad(result.geometry, result.materials);
					
					// publish message
					PubSub.publish("loading.complete.object", {url: url});

				} else {
					throw "ERROR: '" + url + "' seems to be unreachable or the file is empty.";
				}
			} else {
				throw "ERROR: Could not load '" + url + "' (Status: " + xhr.status + ").";
			}

		}
	};

	// start request
	xhr.open('GET', url, true);
	xhr.withCredentials = true;
	xhr.send();
	
	// publish message to inform about status
	PubSub.publish("loading.start.object", {url: url});
};

module.exports = JSONLoader;