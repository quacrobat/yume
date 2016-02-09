/**
 * @file Interface for entire audio handling. This prototype is used in stages
 * to access audio-based logic and to create audio entities.
 * 
 * @author Human Interactive
 */

"use strict";

var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );
var AudioListener = require( "./AudioListener" );
var DynamicAudio = require( "./DynamicAudio" );
var AudioBufferList = require( "./AudioBufferList" );
var camera = require( "../core/Camera" );
var logger = require( "../core/Logger" );

/**
 * Creates the audio manager.
 * 
 * @constructor
 * 
 */
function AudioManager() {

	Object.defineProperties( this, {
		_listener : {
			value : new AudioListener(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		_backgroundMusicGain : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_backgroundMusic : {
			value : new global.Audio(),
			configurable : false,
			enumerable : false,
			writable : true
		},
		_dynamicAudios : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );

	// gain node for background music, used for fadeIn/ fadeOut
	this._backgroundMusicGain = this._listener.context.createGain();
	this._backgroundMusicGain.connect( this._listener.gain );

	// connect background music to web audio pipeline
	var source = this._listener.context.createMediaElementSource( this._backgroundMusic );
	source.connect( this._backgroundMusicGain );

	// set error handling for background music
	this._backgroundMusic.onerror = this._onErrorBackgroundMusic;

	// add listener to camera
	camera.add( this._listener );
}

/**
 * Creates a dynamic audio object and stores it to the respective internal
 * array. This audio object is only valid in the respective stage.
 * 
 * @param {string} id - The ID of the dynamic audio.
 * @param {object} buffer - The buffered audio file.
 * @param {boolean} loop - Should the audio played in a loop?
 * 
 * @returns {DynamicAudio} The new dynamic audio.
 */
AudioManager.prototype.createAudioStage = function( id, buffer, loop ) {

	var audio = new DynamicAudio( id, this._listener, buffer, loop, DynamicAudio.SCOPE.STAGE );
	this._dynamicAudios.push( audio );
	return audio;
};

/**
 * Creates a dynamic audio object and stores it to the respective internal
 * array. This audio object is valid in the entire game.
 * 
 * @param {string} id - The ID of the dynamic audio.
 * @param {object} buffer - The buffered audio file.
 * @param {boolean} loop - Should the audio played in a loop?
 * 
 * @returns {DynamicAudio} The new dynamic audio.
 */
AudioManager.prototype.createAudioWorld = function( id, buffer, loop ) {

	var audio = new DynamicAudio( id, this._listener, buffer, loop, DynamicAudio.SCOPE.WORLD );
	this._dynamicAudios.push( audio );
	return audio;
};

/**
 * Creates an audio buffer list.
 * 
 * @param {object} audioList - An array with name of audio files.
 * @param {function} callback - This callback is executed when all audio files
 * are loaded.
 * 
 * @returns {AudioBufferList} The new audio buffer list.
 */
AudioManager.prototype.createAudioBufferList = function( audioList, callback ) {

	return new AudioBufferList( this._listener.context, audioList, callback );
};

/**
 * Removes all dynamic audio objects with scope "stage" from the internal array.
 */
AudioManager.prototype.removeAudiosStage = function() {

	for ( var i = this._dynamicAudios.length - 1; i >= 0; i-- )
	{		
		if ( this._dynamicAudios[ i ].scope === DynamicAudio.SCOPE.STAGE )
		{
			this._dynamicAudios[ i ].stop();

			this._dynamicAudios.splice( i, 1 );
		}
	}
};

/**
 * Removes all dynamic audio objects with scope "world" from the internal array.
 */
AudioManager.prototype.removeAudiosWorld = function() {

	for ( var i = this._dynamicAudios.length - 1; i >= 0; i-- )
	{		
		if ( this._dynamicAudios[ i ].scope === DynamicAudio.SCOPE.WORLD )
		{
			this._dynamicAudios[ i ].stop();

			this._dynamicAudios.splice( i, 1 );
		}
	}
};

/**
 * Gets a dynamic audio of the internal array.
 * 
 * @param {string} id - The id of the dynamic audio.
 * 
 * @returns {DynamicAudio} The dynamic audio.
 */
AudioManager.prototype.getDynamicAudio = function( id ) {

	var dynamicAudio = null;

	for ( var i = 0; i < this._dynamicAudios.length; i++ )
	{
		if ( this._dynamicAudios[ i ].audioId === id )
		{
			dynamicAudio = this._dynamicAudios[ i ];
			break;
		}
	}

	if ( dynamicAudio === null )
	{
		throw "ERROR: AudioManager: Dynamic Audio with ID " + id + " not existing.";
	}
	else
	{
		return dynamicAudio;
	}
};

/**
 * Sets the background music.
 * 
 * @param {string} file - The actual audio file. Only MP3s are valid.
 * @param {number} volume - The volume of the audio.
 * @param {boolean} loop - Should the audio played in a loop?
 */
AudioManager.prototype.setBackgroundMusic = function( file, volume, loop ) {

	var url = "/assets/audio/static/" + file + ".mp3";

	this._backgroundMusic.src = url;
	this._backgroundMusic.volume = volume || 1;
	this._backgroundMusic.loop = loop || true;

	this._backgroundMusic.oncanplay = function( event ) {

		// publish message to inform about status
		eventManager.publish( TOPIC.STAGE.LOADING.COMPLETE.MUSIC, {
			url : url
		} );

		// execute this handler just one time
		event.target.oncanplay = null;
	};

	logger.log( "INFO: AudioManager: Set new background music. URL: %s", url );

	// publish message to inform about status
	eventManager.publish( TOPIC.STAGE.LOADING.START.MUSIC, {
		url : url
	} );
};

/**
 * Plays the background music.
 * 
 * @param {boolean} isFadeIn - Should the audio fade in?
 * @param {number} duration - The duration of the fade in.
 */
AudioManager.prototype.playBackgroundMusic = function( isFadeIn, duration ) {

	// start playing
	this._backgroundMusic.play();

	// adjust gain node of background music
	if ( isFadeIn === true )
	{
		// fade in
		this._backgroundMusicGain.gain.linearRampToValueAtTime( 0, this._backgroundMusic.currentTime );
		this._backgroundMusicGain.gain.linearRampToValueAtTime( 1, this._backgroundMusic.currentTime + duration || 2 );
	}
	else
	{
		this._backgroundMusicGain.gain.value = 1;
	}

	// logging
	logger.log( "INFO: AudioManager: Start playing background music." );
};

/**
 * Pauses the background music.
 * 
 * @param {boolean} isFadeOut - Should the audio fade out?
 * @param {number} duration - The duration of the fade out.
 * @param {function} onPausedCallback - Executed, when the audio is paused.
 */
AudioManager.prototype.pauseBackgroundMusic = function( isFadeOut, duration, onPausedCallback ) {

	// save context
	var self = this;

	if ( isFadeOut === true )
	{
		// fade out
		this._backgroundMusicGain.gain.linearRampToValueAtTime( 1, this._backgroundMusic.currentTime );
		this._backgroundMusicGain.gain.linearRampToValueAtTime( 0, this._backgroundMusic.currentTime + duration || 2 );

		// pause music with delay, at the end of the animation
		setTimeout( function() {

			self._backgroundMusic.pause();

			// execute callback
			if ( typeof onPausedCallback === "function" )
			{
				onPausedCallback.call( self );
			}

		}, ( duration || 2 ) * 1000 );
	}
	else
	{

		// immediately pause music
		this._backgroundMusic.pause();
		this._backgroundMusicGain.gain.value = 0;

		// execute callback
		if ( typeof onPausedCallback === "function" )
		{
			onPausedCallback.call( this );
		}
	}

	// logging
	logger.log( "INFO: AudioManager: Pause playing background music." );
};

/**
 * Stops the background music.
 * 
 * @param {boolean} isFadeOut - Should the audio fade out?
 * @param {number} duration - The duration of the fade out.
 * @param {function} onStoppedCallback - Executed, when the audio is stopped.
 */
AudioManager.prototype.stopBackgroundMusic = function( isFadeOut, duration, onStoppedCallback ) {

	this.pauseBackgroundMusic( isFadeOut, duration, function() {

		// reset currentTime
		this._backgroundMusic.currentTime = 0.0;

		// execute callback
		if ( typeof onStoppedCallback === "function" )
		{
			onStoppedCallback.call( this );
		}
	} );

	// logging
	logger.log( "INFO: AudioManager: Stop playing background music." );
};

/**
 * Is the background music played?
 * 
 * @returns {boolean}
 */
AudioManager.prototype.isBackgroundMusicPlayed = function() {

	return this._backgroundMusic.paused;
};

/**
 * Is the background music played in a loop?
 * 
 * @return {boolean} - The loop-flag.
 */
AudioManager.prototype.isBackgroundMusicLoop = function() {

	return this._backgroundMusic.loop;
};

/**
 * Sets the loop property of the background music.
 * 
 * @param {boolean} loop - The loop-flag to set.
 */
AudioManager.prototype.setBackgroundMusicLoop = function( loop ) {

	this._backgroundMusic.loop = loop;
};

/**
 * Gets the volume property of the background music.
 * 
 * @return {number} volume - The volume.
 */
AudioManager.prototype.getBackgroundMusicVolume = function() {

	return this._backgroundMusic.volume;
};

/**
 * Sets the volume property of the background music.
 * 
 * @param {number} volume - The volume to set.
 */
AudioManager.prototype.setBackgroundMusicVolume = function( volume ) {

	this._backgroundMusic.volume = volume;
};

/**
 * This method handles error-situations when playing the background music. It
 * triggers a special topic, which can processed of e.g. the
 * UserInterfaceManager.
 */
AudioManager.prototype._onErrorBackgroundMusic = function() {

	logger.error( "ERROR: AudioManager: Media resource could not be processed." );
	eventManager.publish( TOPIC.APPLICATION.ERROR.MUSIC, "Media resource could not be processed" );
};

module.exports = new AudioManager();