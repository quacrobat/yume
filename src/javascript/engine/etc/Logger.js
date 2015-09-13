/**
 * @file This prototype provides logging functionality. It's
 * a wrapper for the browser console API.
 * 
 * @author Human Interactive
 */
"use strict";

var utils = require("./Utils");

/**
 * Creates a logger instance.
 * 
 * @constructor
 */
function Logger(){
	
	Object.defineProperties(this, {
		_isDevModeActive: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
}

/**
 * Initializes the logger.
 */
Logger.prototype.init = function(){
	
	this._isDevModeActive = utils.isDevelopmentModeActive();
};

/**
 * Logs standard/info messages.
 */
Logger.prototype.log = function(){
	
	// log messages only in dev mode
	if( this._isDevModeActive === true ){
		
		console.log.apply( console, arguments );
	}
};

/**
 * Logs warnings.
 */
Logger.prototype.warn = function(){
	
	console.warn.apply( console, arguments );
};

/**
 * Logs errors.
 */
Logger.prototype.error = function(){
	
	console.error.apply( console, arguments );
};

/**
 * Handles assertions.
 */
Logger.prototype.assert = function(){
	
	console.assert.apply( console, arguments );
};

/**
 * Logs information about the memory and render status to console.
 * 
 * @param {Renderer} renderer - The renderer object.
 */
Logger.prototype.logSystemInfo = function( renderer ) {

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

module.exports = new Logger();