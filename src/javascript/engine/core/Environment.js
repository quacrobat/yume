/**
 * @file This prototype is used to ensure that all necessary browser features
 * are available.
 * 
 * @author Human Interactive
 */
"use strict";

/**
 * Creates a new environment instance.
 * 
 * @constructor
 */
function Environment() {

	Object.defineProperties( this, {
		_test : {
			value : "test",
			configurable : false,
			enumerable : false,
			writable : false
		},
		unsupportedAPIs : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );
}

/**
 * This method performs tests to ensure the browser supports all APIs.
 * 
 * @returns {boolean} Does the browser support all APIs?
 */
Environment.prototype.isCompatible = function() {

	// clear message array
	this.unsupportedAPIs.length = 0;

	// perform tests
	if ( this._testWebGL() === false )
	{
		this.unsupportedAPIs.push( "WebGL" );
	}
	else if ( this._testWebSockets() === false )
	{
		this.unsupportedAPIs.push( "WebSockets" );
	}
	else if ( this._testWebWorkers === false )
	{
		this.unsupportedAPIs.push( "Web Workers" );
	}
	else if ( this._testPointerLock() === false )
	{
		this.unsupportedAPIs.push( "Pointer Lock" );
	}
	else if ( this._testLocalStorage() === false )
	{
		this.unsupportedAPIs.push( "Local Storage" );
	}
	else if ( this._testSessionStorage() === false )
	{
		this.unsupportedAPIs.push( "Session Storage" );
	}
	else if ( this._testHTML5Audio() === false )
	{
		this.unsupportedAPIs.push( "Audio Element" );
	}
	else if ( this._testWebAudio() === false )
	{
		this.unsupportedAPIs.push( "Web Audio" );
	}
	else if ( this._testWebPerformance() === false )
	{
		this.unsupportedAPIs.push( "Web Performance" );
	}

	// return result
	if ( this.unsupportedAPIs.length === 0 )
	{
		return true;
	}
	else
	{
		return false;
	}
};

/**
 * Checks, if the supports a touch-based user interface. Technically, the method
 * indicates if the browser supports the W3C Touch Events API. For various reasons,
 * the test works not always correct in all environments.
 * 
 * see: http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
 * 
 * @returns {boolean} Does the browser has a touch-sensitive surface?
 */
Environment.prototype.isTouchDevice = function() {

	return !!( "ontouchstart" in global.window  );
};

/**
 * Checks, if the browser is a Firefox.
 * 
 * @returns {boolean} Is the current user-agent a Firefox?
 */
Environment.prototype.isFirefox = function() {

	return global.navigator.userAgent.toLowerCase().indexOf( "firefox" ) > -1;
};

/**
 * Tests the WebGL API.
 * 
 * @returns {boolean} Does the browser support the API?
 */
Environment.prototype._testWebGL = function() {

	try
	{
		var canvas = global.document.createElement( "canvas" );
		return !!global.window.WebGLRenderingContext && ( canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" ) );
	}
	catch ( e )
	{
		return false;
	}
};

/**
 * Tests the WebSockets API.
 * 
 * @returns {boolean} Does the browser support the API?
 */
Environment.prototype._testWebSockets = function() {

	return !!global.window.WebSocket;
};

/**
 * Tests the WebWorkers API.
 * 
 * @returns {boolean} Does the browser support the API?
 */
Environment.prototype._testWebWorkers = function() {

	return !!global.window.Worker;
};

/**
 * Tests the PointerLock API.
 * 
 * @returns {boolean} Does the browser support the API?
 */
Environment.prototype._testPointerLock = function() {

	var canvas = global.document.createElement( "canvas" );
	return !!canvas.requestPointerLock || !!canvas.mozRequestPointerLock || !!canvas.webkitRequestPointerLock;
};

/**
 * Tests the LocalStorage API.
 * 
 * @returns {boolean} Does the browser support the API?
 */
Environment.prototype._testLocalStorage = function() {

	try
	{
		global.localStorage.setItem( this._test, this._test );
		global.localStorage.removeItem( this._test );
		return true;
	}
	catch ( e )
	{
		return false;
	}
};

/**
 * Tests the SessionStorage API.
 * 
 * @returns {boolean} Does the browser support the API?
 */
Environment.prototype._testSessionStorage = function() {

	try
	{
		global.sessionStorage.setItem( this._test, this._test );
		global.sessionStorage.removeItem( this._test );
		return true;
	}
	catch ( e )
	{
		return false;
	}
};

/**
 * Tests the HTML5 Audio Element and MP3-Support.
 * 
 * @returns {boolean} Does the browser support the API?
 */
Environment.prototype._testHTML5Audio = function() {

	var audio = global.document.createElement( "audio" );
	var isSupport = !!audio.canPlayType;

	if ( isSupport === true )
	{
		if ( audio.canPlayType( "audio/mpeg;" ).replace( /^no$/, "" ) !== "" )
		{
			isSupport = true;
		}
		else
		{
			isSupport = false;
		}
	}

	return isSupport;
};

/**
 * Tests the WebAudio API.
 */
Environment.prototype._testWebAudio = function() {

	return !!( global.window.AudioContext || global.window.webkitAudioContext );
};

/**
 * Tests the Web Performance API.
 * 
 * @returns {boolean} Does the browser support the API?
 */
Environment.prototype._testWebPerformance = function() {

	return !!global.window.performance;
};

module.exports = new Environment();