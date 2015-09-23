/**
 * @file This prototype is used to detect all necessary browser-features.
 * 
 * @author Human Interactive
 */
"use strict";

/**
 * Creates a new instance
 * 
 * @constructor
 * 
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
 * Perform all tests.
 * 
 * @returns {boolean} Indicates the support of all features.
 */
Environment.prototype.check = function() {

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
		this.unsupportedAPIs.push( "WebWorkers" );
	}
	else if ( this._testPointerLock() === false )
	{
		this.unsupportedAPIs.push( "Pointer Lock" );
	}
	else if ( this._testLocalStorage() === false )
	{
		this.unsupportedAPIs.push( "LocalStorage" );
	}
	else if ( this._testSessionStorage() === false )
	{
		this.unsupportedAPIs.push( "SessionStorage" );
	}
	else if ( this._testHTML5Audio() === false )
	{
		this.unsupportedAPIs.push( "HTML5 Audio Element" );
	}
	else if ( this._testWebAudio() === false )
	{
		this.unsupportedAPIs.push( "WebAudio" );
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
 * Tests the WebGL API.
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
 */
Environment.prototype._testWebSockets = function() {

	return !!global.window.WebSocket;
};

/**
 * Tests the WebWorkers API.
 */
Environment.prototype._testWebWorkers = function() {

	return !!global.window.Worker;
};

/**
 * Tests the PointerLock API.
 */
Environment.prototype._testPointerLock = function() {

	var canvas = global.document.createElement( "canvas" );
	return !!canvas.requestPointerLock || !!canvas.mozRequestPointerLock || !!canvas.webkitRequestPointerLock;
};

/**
 * Tests the LocalStorage API.
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
 * Tests the WebAudio-API.
 */
Environment.prototype._testWebAudio = function() {

	return !!( global.window.AudioContext || global.window.webkitAudioContext );
};

module.exports = new Environment();