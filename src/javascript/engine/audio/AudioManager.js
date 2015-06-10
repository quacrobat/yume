/**
 * @file Interface for entire audio handling. This prototype is used in scenes
 * to access audio-based logic and to create audio entities.
 * 
 * @author Human Interactive
 */
"use strict";

var PubSub = require("pubsub-js");

var AudioListener = require("./AudioListener");
var DynamicAudio = require("./DynamicAudio");
var AudioBufferList = require("./AudioBufferList");
var utils = require("../etc/Utils");
var camera = require("../core/Camera");
/**
 * Creates the audio manager.
 * 
 * @constructor
 * 
 */
function AudioManager() {
	
	Object.defineProperties(this, {	
		_listener: {
			value: new AudioListener(),
			configurable: false,
			enumerable: false,
			writable : false
		},
		_backgroundMusic: {
			value: new global.Audio(),
			configurable: false,
			enumerable: false,
			writable : true
		},
		_dynamicAudios: {
			value: [],
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
	
	// connect background music to web audio pipeline
	var source = this._listener.context.createMediaElementSource(this._backgroundMusic);
	source.connect(this._listener.gain);
	
	// set error handling for background music
	this._backgroundMusic.onerror = this._onErrorBackgroundMusic;
	
	// add listener to camera
	camera.add(this._listener);
}

/**
 * Creates a dynamic audio object and stores it to the respective internal array.
 * 
 * @param {string} id - The ID of the dynamic audio.
 * @param {object} buffer - The buffered audio file.
 * @param {boolean} isLoop - Should the audio played in a loop?
 * @param {boolean} isStageIndependent - Should the audio independent of the stage?
 * 
 * @returns {DynamicAudio} The new dynamic audio.
 */
AudioManager.prototype.createDynamicSound = function(id, buffer, isLoop, isStageIndependent) {

	var audio = new DynamicAudio(id, this._listener, buffer, isLoop, isStageIndependent);
	this._dynamicAudios.push(audio);
	return audio;
};

/**
 * Creates an audio buffer list.
 * 
 * @param {object} audioList - An array with name of audio files.
 * @param {function} callback - This callback is executed when all audio files are loaded.
 * 
 * @returns {AudioBufferList} The new audio buffer list.
 */
AudioManager.prototype.createAudioBufferList = function(audioList, callback) {

	return new AudioBufferList(this._listener.context, audioList, callback);
};

/**
 * Removes dynamic audio objects from the internal array.
 * 
 * @param {boolean} isClear - Should all dynamic audios deleted or only stage dependent audios?
 */
AudioManager.prototype.removeDynamicAudios = function(isClear){
	
	if(isClear === true){
		this._dynamicAudios.length = 0;
	}else{
		for (var i = this._dynamicAudios.length -1; i >= 0; i--) {
			if(this._dynamicAudios[i].isStageIndependent === false){
				this._dynamicAudios.splice(i,1);
			}
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
AudioManager.prototype.getDynamicAudio = function(id) {

	var dynamicAudio = null;
	
	for( var i = 0; i < this._dynamicAudios.length; i++){
		if(this._dynamicAudios[i].audioId === id){
			dynamicAudio =  this._dynamicAudios[i];
			break;
		}
	}
	
	if(dynamicAudio === null){
		throw "ERROR: AudioManager: Dynamic Audio with ID " + id + " not existing.";
	}else{
		return dynamicAudio;
	}
};

/**
 * Sets the background music.
 * 
 * @param {string} file - The actual audio file. Only MP3s are valid.
 * @param {number} volume - The volume of the audio.
 * @param {boolean} isLoop - Should the audio played in a loop?
 * @param {boolean} isMuted - Should the audio muted?
 */
AudioManager.prototype.setBackgroundMusic = function(file, volume, isLoop, isMuted) {
	
	var url = "assets/audio/static/" + file + ".mp3";

	this._backgroundMusic.src = url;
	this._backgroundMusic.volume = volume || 1;
	this._backgroundMusic.loop = isLoop || true;
	this._backgroundMusic.muted = isMuted || false;
	
	this._backgroundMusic.oncanplay = function(event){

		// publish message to inform about status
		PubSub.publish("loading.complete.music", {url: url});
		
		// execute this handler just one time
		event.target.oncanplay = null;
	};
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: AudioManager: Set new background music. URL: %s", url);
	}
	
	// publish message to inform about status
	PubSub.publish("loading.start.music", {url: url});
};

/**
 * Plays the background music.
 * 
 */
AudioManager.prototype.playBackgroundMusic = function(isFadeIn, time) {
		
	this._backgroundMusic.play();
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: AudioManager: Start playing background music.");
	}
};

/**
 * Pauses the background music.
 * 
 */
AudioManager.prototype.pauseBackgroundMusic = function(isFadeOut, time) {

	this._backgroundMusic.pause();
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: AudioManager: Pause playing background music.");
	}
};

/**
 * Stops the background music.
 */
AudioManager.prototype.stopBackgroundMusic = function() {

	this._backgroundMusic.pause();
	this._backgroundMusic.currentTime = 0.0;
	
	if(utils.isDevelopmentModeActive() === true){
		console.log("INFO: AudioManager: Stop playing background music.");
	}
};


/**
 * Is the background music is played?
 * 
 * @returns {boolean}
 */
AudioManager.prototype.isBackgroundMusicPlayed = function() {

	return this._backgroundMusic.paused !== true;
};

/**
 * Sets the muted property of the background music.
 * 
 * @param {boolean} isMuted - The muted-flag to set.
 */
AudioManager.prototype.setBackgroundMusicMuted = function(isMuted) {

	this._backgroundMusic.muted = isMuted;
};

/**
 * Sets the loop property of the background music.
 * 
 * @param {boolean} isLoop - The loop-flag to set.
 */
AudioManager.prototype.setBackgroundMusicLoop = function(isLoop) {

	this._backgroundMusic.loop = isLoop;
};

/**
 * Sets the volume property of the background music.
 * 
 * @param {number} volume - The volume to set.
 */
AudioManager.prototype.setBackgroundMusicVolume = function(volume) {

	this._backgroundMusic.volume = volume;
};

/**
 * This method handles error-situations when playing the background music.
 * It triggers a custom event, which can processed of e.g. the UserInterfaceManager.
 */
AudioManager.prototype._onErrorBackgroundMusic = function(){

	console.error("ERROR: AudioManager: Media resource could not be processed.");
	PubSub.publish("audio.backgroundmusic.error", "Media resource could not be processed");
};

module.exports = new AudioManager();