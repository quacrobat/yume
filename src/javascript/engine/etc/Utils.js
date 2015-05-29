/**
 * @file All helper and util functions are
 * organized in this module.
 * 
 * @author Human Interactive
 */

"use strict";

var renderer = require("../core/Renderer");

/**
 * Creates a Utils instance.
 * 
 * @constructor
 */
function Utils(){
	
	Object.defineProperties(this, {
		_runtimeInformation: {
			value: {},
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
}

/**
 * Sets runtime-information 
 * 
 * @param {object} params - Startup parameters of the engine.
 */
Utils.prototype.setRuntimeInformation = function(params){
	
	this._runtimeInformation.appName = params.name;
	this._runtimeInformation.version = params.version;
	
	if(params.mode === "development" ){
		this._runtimeInformation.mode = Utils.MODES.DEVELOPMENT;
		this._runtimeInformation.CDN = Utils.CDN.LOCAL;
	}else{
		this._runtimeInformation.mode = Utils.MODES.PRODUCTION;
		this._runtimeInformation.CDN = Utils.CDN.CLOUD;
	}
	
	if(params.locale === "de"){
		this._runtimeInformation.locale = Utils.LOCALES.DE;
	}else{
		this._runtimeInformation.locale = Utils.LOCALES.EN;
	}
	
	if(params.isMultiplayerActive === true){
		this._runtimeInformation.isMultiplayerActive = true;
	}else{
		this._runtimeInformation.isMultiplayerActive = false;
	}
};

/**
 * Gets the CDN-Host.
 * 
 * @returns {string} The CDN-Host.
 */
Utils.prototype.getCDNHost = function(){
	
	return this._runtimeInformation.CDN;
};

/**
 * Gets the Locale (i18n).
 * 
 * @returns {string} The local.
 */
Utils.prototype.getLocale= function(){
	
	return this._runtimeInformation.locale;
};

/**
 * Get name and bersion of the Application.
 * 
 * @returns {string} The name and bersion of Application.
 */
Utils.prototype.getAppInformation = function(){
	
	return this._runtimeInformation.appName + ", Version: " + this._runtimeInformation.version;
};

/**
 * Is the multiplayer component active or not?
 * 
 * @returns {boolean} Is the multiplayer active?
 */
Utils.prototype.isMultiplayerActive = function(){
	
	return this._runtimeInformation.isMultiplayerActive;
};

/**
 * Prints information about the memory- and render-status to console.
 */
Utils.prototype.printWorldInformation = function() {

	console.group("INFO: Utils: World Information, %s", new Date().toTimeString());

		console.group("Memory");
			console.log("%i Geometries", renderer.info.memory.geometries);
			console.log("%i Programs", renderer.info.memory.programs);
			console.log("%i Textures", renderer.info.memory.textures);
		console.groupEnd();

		console.group("Render");
			console.log("%i Calls", renderer.info.render.calls);
			console.log("%i Faces", renderer.info.render.faces);
			console.log("%i Points", renderer.info.render.points);
			console.log("%i Vertices", renderer.info.render.vertices);
		console.groupEnd();

	console.groupEnd();
};

/**
 * Preloads images and executes a callback, when all work is done.
 * 
 * @param{object} images - An array with URLs of images.
 * @param{function} callback - This function is executed, when all images are loaded.
 */
Utils.prototype.preloadImages = function(images, callback) {

	var count = 0;

	var onLoad = function() {
		if (++count === images.length && typeof callback === "function") {
			callback();
		}
	};

	var onError = function(e) {
		throw "ERROR: Utils: Unable to preload image with URL: " + e.target.src;
	};

	for (var i = 0; i < images.length; i++) {

		var image = new global.Image();
		image.src = images[i];
		
		image.onload = onLoad;
		image.onerror = onError;
	}
};

/**
 * Checks, if the engine runs in development or production mode
 * 
 * @returns {boolean} Is development mode activ?
 */
Utils.prototype.isDevelopmentModeActive = function(){
	
	return this._runtimeInformation.mode === Utils.MODES.DEVELOPMENT;
};

/**
 * Checks, if the browser is a Firefox
 * 
 * @returns {boolean} Is the current user-agent a firefox?
 */
Utils.prototype.isFirefox = function(){
	
	return global.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

Utils.MODES = {
	DEVELOPMENT : 0,
	PRODUCTION : 1
};

Utils.LOCALES = {
	EN : "en",
	DE : "de"
};

Utils.CDN = {
	LOCAL : "",
	CLOUD : ""
};

module.exports = new Utils();