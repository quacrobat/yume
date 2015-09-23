/**
 * @file Interface for entire settings-handling. This prototype is used to
 * access and save settings via HTML5-Storage API.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );
var utils = require( "./Utils" );
/**
 * Creates the settings manager and loads the current settings.
 * 
 * @constructor
 */
function SettingsManager() {

	Object.defineProperties( this, {
		_storage : {
			value : global.localStorage,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_settings : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	this._settings = this.load();

	// cross-domain settings
	THREE.ImageUtils.crossOrigin = "anonymous";
}

/**
 * Saves the settings to storage. The settings object is transformed to JSON and
 * then encoded to BASE64.
 * 
 * @param {string} graphicSettings - The common graphic settings.
 * @param {number} mouseSensitivity - The mouse sensitivity.
 */
SettingsManager.prototype.save = function( graphicSettings, mouseSensitivity ) {

	var settings = {
		graphicSettings : graphicSettings,
		mouseSensitivity : mouseSensitivity
	};

	// transform object to JSON-string and encode to BASE64
	settings = global.window.btoa( JSON.stringify( settings ) );

	// save
	this._storage.setItem( "settings", settings );
};

/**
 * Loads the settings from storage. At first, the string gets BASE64 decoded and
 * then parsed from JSON to an object.
 * 
 * @returns {object} The settings.
 */
SettingsManager.prototype.load = function() {

	var settings = this._storage.getItem( "settings" );

	if ( settings !== null )
	{

		// decode BASE64 and parse JSON-string to object
		settings = JSON.parse( global.window.atob( settings ) );
	}
	else
	{
		// default settings
		settings = {
			graphicSettings : SettingsManager.GRAPHICS.HIGH,
			mouseSensitivity : SettingsManager.MOUSE.MIDDLE
		};
	}

	return settings;
};

/**
 * Removes the settings from storage.
 */
SettingsManager.prototype.remove = function() {

	this._storage.removeItem( "settings" );
};

/**
 * Adjusts some properties of the given materials. The result depends on the
 * current graphic settings.
 * 
 * @param {object} materials - An arrays of THREE.Material objects.
 * @param {THREE.WebGLRenderer} renderer - The renderer of the application.
 */
SettingsManager.prototype.adjustMaterials = function( materials, renderer ) {

	for ( var i = 0; i < materials.length; i++ )
	{
		if ( this._settings.graphicSettings === SettingsManager.GRAPHICS.HIGH )
		{
			// anisotropy filter on high-settings
			if ( materials[ i ].map !== undefined && materials[ i ].map !== null )
			{
				materials[ i ].map.anisotropy = renderer.getMaxAnisotropy();
			}
			if ( materials[ i ].normalMap !== undefined && materials[ i ].normalMap !== null )
			{
				materials[ i ].normalMap.anisotropy = renderer.getMaxAnisotropy();
			}
		}
		else if ( this._settings.graphicSettings === SettingsManager.GRAPHICS.LOW )
		{
			// no anisotropy filter and normal maps on low-settings
			if ( materials[ i ].normalMap !== undefined && materials[ i ].normalMap !== null )
			{
				materials[ i ].normalMap = null;
			}
		}
	}
};

/**
 * Adjusts some properties of the given light. The result depends on the current
 * graphic settings.
 * 
 * @param {THREE.Light} light - The light to adjusted.
 */
SettingsManager.prototype.adjustLight = function( light ) {

	if ( this._settings.graphicSettings === SettingsManager.GRAPHICS.HIGH )
	{
		// smoother shadows on high-settings
		light.castShadow = true;
		light.shadowMapWidth = 1024;
		light.shadowMapHeight = 1024;
	}
	else if ( this._settings.graphicSettings === SettingsManager.GRAPHICS.MIDDLE )
	{
		// shadows on middle-settings
		light.castShadow = true;
		light.shadowMapWidth = 512;
		light.shadowMapHeight = 512;
	}
	else
	{
		// no shadows on low-settings
		light.castShadow = false;
	}

	if ( utils.isDevelopmentModeActive() === true )
	{
		if ( light instanceof THREE.SpotLight || light instanceof THREE.DirectionalLight )
		{
			light.castShadow = true;
			light.shadowCameraVisible = true;
		}
	}
};

/**
 * Gets the mouse sensitivity.
 * 
 * @param {number} light - The mouse sensitivity.
 */
SettingsManager.prototype.getMouseSensitivity = function() {

	return this._settings.mouseSensitivity;
};

SettingsManager.GRAPHICS = {
	LOW : 0,
	MIDDLE : 1,
	HIGH : 2
};

SettingsManager.MOUSE = {
	LOW : 2,
	MIDDLE : 5,
	HIGH : 8
};

module.exports = new SettingsManager();