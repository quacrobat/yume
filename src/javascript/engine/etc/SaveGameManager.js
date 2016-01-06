/**
 * @file Interface for entire savegame-handling. This prototype is used to
 * access and save game data via HTML5-Storage API.
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates the savegame manager.
 * 
 * @constructor
 */
function SaveGameManager() {

	Object.defineProperties( this, {
		_storage : {
			value : global.localStorage,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_saveGame : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		KEYS : {
			value : {
				stageId : "stageId",
				isFinish : "isFinish",
			},
			configurable : false,
			enumerable : true,
			writable : false
		}
	} );
}

/**
 * Saves the data to storage. The savegame object is transformed to
 * JSON and then encoded to BASE64.
 */
SaveGameManager.prototype.save = function() {
	
	// update timestamp
	this._saveGame.time = new Date().getTime();
	
	// transform object to JSON-string and encode to BASE64
	var saveGame = global.window.btoa( JSON.stringify( this._saveGame ) );

	// save data in storage
	this._storage.setItem( "savegame", saveGame );
};

/**
 * Loads the savegame from storage. At first, the string gets BASE64
 * decoded and then parsed from JSON to an object.
 */
SaveGameManager.prototype.load = function() {

	// read savegame from storage
	var saveGame = this._storage.getItem( "savegame" );

	if ( saveGame !== null )
	{
		// decode BASE64 and parse JSON string to object
		this._saveGame = JSON.parse( global.window.atob( saveGame ) );
	}
	else
	{
		// if no data were saved, we create some initial savegame data
		this._saveGame = {
			stageId : "001",
			isFinish : false
		};
		
		this.save();
	}
};

/**
 * Removes the savegame from storage.
 */
SaveGameManager.prototype.remove = function() {

	this._storage.removeItem( "savegame" );
};

/**
 * Gets a value from the savegame data.
 */
SaveGameManager.prototype.get = function( key ) {

	return this._saveGame[ key ];
};

/**
 * Sets a value to the savegame data.
 */
SaveGameManager.prototype.set = function( key, value ) {

	this._saveGame[ key ] = value;
};

module.exports = new SaveGameManager();