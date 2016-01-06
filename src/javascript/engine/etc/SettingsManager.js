/**
 * @file Interface for entire settings-handling. This prototype is used to
 * access and save settings via HTML5-Storage API.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );

var system = require( "../core/System" );

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
		},
		KEYS : {
			value : {
				graphicSettings : "graphicSettings",
				mouseSensitivity : "mouseSensitivity",
				showFPS : "showFPS"
			},
			configurable : false,
			enumerable : true,
			writable : false
		}
	} );
}

/**
 * Saves the settings to storage. The settings object is transformed to JSON and
 * then encoded to BASE64.
 */
SettingsManager.prototype.save = function() {

	// transform object to JSON string and encode to BASE64
	var settings = global.window.btoa( JSON.stringify( this._settings ) );

	// save data in storage
	this._storage.setItem( "settings", settings );
};

/**
 * Loads the settings from storage. At first, the string gets BASE64 decoded and
 * then parsed from JSON to an object.
 */
SettingsManager.prototype.load = function() {

	// read settings from storage
	var settings = this._storage.getItem( "settings" );

	if ( settings !== null )
	{
		// decode BASE64 and parse JSON-string to object
		this._settings = JSON.parse( global.window.atob( settings ) );
	}
	else
	{
		// if no data were saved, we create some initial settings data
		this._settings = {
			graphicSettings : SettingsManager.GRAPHICS.HIGH,
			mouseSensitivity : SettingsManager.MOUSE.MIDDLE,
			showFPS : true
		};
		
		this.save();
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
 * Gets a value from the savegame data.
 */
SettingsManager.prototype.get = function( key ) {

	return this._settings[ key ];
};

/**
 * Sets a value to the savegame data.
 */
SettingsManager.prototype.set = function( key, value ) {

	this._settings[ key ] = value;
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
		light.shadow.mapSize.x = 1024;
		light.shadow.mapSize.y = 1024;
	}
	else if ( this._settings.graphicSettings === SettingsManager.GRAPHICS.MIDDLE )
	{
		// shadows on middle-settings
		light.castShadow = true;
		light.shadow.mapSize.x = 512;
		light.shadow.mapSize.y = 512;
	}
	else
	{
		// no shadows on low-settings
		light.castShadow = false;
	}
	
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