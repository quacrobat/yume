/**
 * @file Interface for entire text-handling. This prototype is used in stages to
 * access text-based logic and to load localized texts.
 * 
 * @author Human Interactive
 */
"use strict";

var utils = require( "./Utils" );

var EventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

/**
 * Creates the text manager.
 * 
 * @constructor
 */
function TextManager() {

	Object.defineProperties( this, {
		_texts : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
}

/**
 * Loads the localized text file for the given stage and buffers the result.
 * 
 * @param {string} stageId - The ID of the stage.
 * @param {function} callback - Executed, when the loading was successful.
 */
TextManager.prototype.load = function( stageId, callback ) {

	var self = this;

	// build url
	var url = utils.getCDNHost() + "assets/locales/" + utils.getLocale() + "/stage_" + stageId + ".js";

	// add nocache, if necessary
	if ( utils.isDevelopmentModeActive() === true )
	{
		url = url + "?" + new Date().getTime();
	}

	// create XMLHttpRequest object
	var xhr = new global.XMLHttpRequest();

	xhr.onreadystatechange = function() {

		if ( xhr.readyState === xhr.DONE )
		{
			if ( xhr.status === 200 )
			{
				if ( xhr.responseText !== "" )
				{
					// assign texts
					self._texts = JSON.parse( xhr.responseText );

					// search for keys and replace with text
					self._searchAndRepalce();

					// publish message to inform about status
					EventManager.publish( TOPIC.STAGE.LOADING.COMPLETE.TEXT, {
						url : url
					} );

					if ( typeof callback === "function" )
					{
						callback();
					}

				}
				else
				{
					throw "ERROR: TextManager: Unable to parse texts for stageId '" + stageId + "'. Textfile could be empty.";
				}
			}
			else
			{
				throw "ERROR: TextManager: Could not load '" + url + "' (Status: " + xhr.status + ").";
			}
		}
	};

	// start request
	xhr.open( 'GET', url, true );
	xhr.withCredentials = true;
	xhr.send();

	// publish message to inform about status
	EventManager.publish( TOPIC.STAGE.LOADING.START.TEXT, {
		url : url
	} );
};

/**
 * Gets the localized text by the given key.
 * 
 * @param {string} key - The key of the text.
 * 
 * @returns {string} The localized text.
 */
TextManager.prototype.get = function( key ) {

	var value;

	if ( this._texts !== null && this._texts[ key ] !== undefined )
	{
		value = this._texts[ key ];
	}
	else
	{
		value = key;
	}

	return value;
};

/**
 * Removes the buffered texts.
 */
TextManager.prototype.removeTexts = function() {

	this._texts = null;
};

/**
 * Gets all text nodes under a specific DOM-Element.
 * 
 * @param {object} element - The source DOM-Element for the search.
 * 
 * @returns {object} An array with text nodes.
 */
TextManager.prototype._getAllTextNodes = function( element ) {

	var textNodeList = [];
	var treeWalker = global.document.createTreeWalker( element, global.NodeFilter.SHOW_TEXT, null, false );
	while ( treeWalker.nextNode() )
	{
		textNodeList.push( treeWalker.currentNode );
	}
	return textNodeList;
};

/**
 * Searches for Text-IDs and replaces it with the actual text.
 */
TextManager.prototype._searchAndRepalce = function() {

	var key = null;
	var index = 0;
	var textNodes = this._getAllTextNodes( global.document.querySelector( "#ui-container" ) );

	for ( key in this._texts )
	{
		if ( this._texts.hasOwnProperty( key ) )
		{
			for ( index = 0; index < textNodes.length; index++ )
			{
				// because the property textContent is used, it's not possible
				// to replace an ID with text, which contains HTML-entities
				textNodes[ index ].textContent = textNodes[ index ].textContent.replace( key, this._texts[ key ] );
			}
		}
	}
};

module.exports = new TextManager();