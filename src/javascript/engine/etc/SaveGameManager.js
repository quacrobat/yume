/**
 * @file Interface for entire savegame-handling. This prototype is using HTML
 * Storage API for saving data on the client-side.
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
		}
	} );
}

/**
 * Saves the progress to localStorage. The savegame object is transformed to
 * JSON and then encoded to BASE64.
 * 
 * @param {string} stageId - The ID of the scene.
 * @param {boolean} isFinish - Is the game finished?
 */
SaveGameManager.prototype.save = function( stageId, isFinish ) {

	var saveGame = {
		time : new Date().getTime(),
		stageId : stageId,
		isFinish : isFinish || false
	};

	// transform object to JSON-string and encode to BASE64
	saveGame = global.window.btoa( JSON.stringify( saveGame ) );

	// save
	this._storage.setItem( "savegame", saveGame );
};

/**
 * Loads the savegame from localStorage. At first, the string gets BASE64
 * decoded and then parsed from JSON to an object.
 * 
 * @returns {object} The savegame.
 */
SaveGameManager.prototype.load = function() {

	var saveGame = this._storage.getItem( "savegame" );

	if ( saveGame !== null )
	{
		// Decode BASE64 and parse JSON-string to object
		saveGame = JSON.parse( global.window.atob( saveGame ) );
	}

	return saveGame;
};

/**
 * Removes the savegame from localStorage.
 */
SaveGameManager.prototype.remove = function() {

	this._storage.removeItem( "savegame" );
};

module.exports = new SaveGameManager();