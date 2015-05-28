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
 * @param {boolean} isShowStatus - Should the status of the loading progress should be visible?
 */
function JSONLoader(isShowStatus) {

	THREE.JSONLoader.call(this, isShowStatus);
	
	this.crossOrigin = "anonymous";
}

JSONLoader.prototype = Object.create(THREE.JSONLoader.prototype);
JSONLoader.prototype.constructor = JSONLoader;

/**
 * Loads a 3D object. Overwrites the standard method of three.js.
 * 
 * @param {JSONLoader} context - A reference to the current loader.
 * @param {string} url - The URL of the 3d object.
 * @param {function} callback - This callback function is executed, when the model is loaded and parsed.
 * @param {string} texturePath - If the corresponding textures are in a different directory, this parameter can used to set it.
 * @param {function} callbackProgress - This callback function is executed during the loading process.
 */
JSONLoader.prototype.loadAjaxJSON = function(context, url, callback, texturePath, callbackProgress) {
	
	url = utils.getCDNHost() + url;
	texturePath = utils.getCDNHost() + texturePath;

	var xhr = new global.XMLHttpRequest();
	var length = 0;

	xhr.onreadystatechange = function() {

		if (xhr.readyState === xhr.DONE) {

			if (xhr.status === 200 || xhr.status === 0) {

				if (xhr.responseText) {

					var json = JSON.parse(xhr.responseText);

					if (json.metadata !== undefined && json.metadata.type === 'scene') {

						console.error('ERROR: JSONLoader: "' + url + '" seems to be a Scene. Use THREE.SceneLoader instead.');
						return;
					}
					// parse result
					var result = context.parse(json, texturePath);
					// execute callback
					callback(result.geometry, result.materials);
					// publish message
					PubSub.publish("loading.complete.object", {url: url});

				} else {
					console.error('ERROR: JSONLoader: "' + url + '" seems to be unreachable or the file is empty.');
				}

				// in context of more complex asset initialization
				// do not block on single failed file
				// maybe should go even one more level up
				context.onLoadComplete();

			} else {
				console.error('ERROR: JSONLoader: Couldn\'t load "' + url + '" (' + xhr.status + ')');
			}

		} else if (xhr.readyState === xhr.LOADING) {

			if (callbackProgress) {

				if (length === 0) {
					length = xhr.getResponseHeader('Content-Length');
				}
				callbackProgress({
					total : length,
					loaded : xhr.responseText.length
				});
			}
		} else if (xhr.readyState === xhr.HEADERS_RECEIVED) {

			if (callbackProgress !== undefined) {

				length = xhr.getResponseHeader('Content-Length');
			}
		}
	};

	xhr.open('GET', url, true);
	xhr.withCredentials = true;
	xhr.send(null);
	
	// publish message to inform about status
	PubSub.publish("loading.start.object", {url: url});
};

module.exports = JSONLoader;