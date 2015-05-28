/**
 * @file Prototype for loading and decoding audio-files. The resulting buffers
 * are the basis for dynamic audio objects.
 * 
 * @author Human Interactive
 */
"use strict";

var PubSub = require("pubsub-js");
var utils = require("../etc/Utils");

/**
 * Creates an audiobuffer-list.
 * 
 * @constructor
 * 
 * @param {object} context - The central Web Audio context.
 * @param {object} audioList - An array with name of audiofiles.
 * @param {function} onLoadCallback - This callback is executed when all audiofiles are loaded.
 */
function AudioBufferList(context, audioList, onLoadCallback) {

	Object.defineProperties(this, {
		context: {
			value: context,
			configurable: false,
			enumerable: true,
			writable: false
		},
		audioList: {
			value: audioList,
			configurable: false,
			enumerable: true,
			writable: false
		},
		bufferList: {
			value: [],
			configurable: false,
			enumerable: true,
			writable: true
		},
		_onload: {
			value: onLoadCallback,
			configurable: false,
			enumerable: false,
			writable: false
		},
		_loadCount: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
}

/**
 * This method iterates over the audio-array and loads each entry via a separate method.
 */
AudioBufferList.prototype.load = function(){
	
	for (var i = 0; i < this.audioList.length; i++){
		this.loadBuffer(this.audioList[i], i);
	}
};

/**
 * This method loads a single audio-file and decodes it to a buffer object.
 * When all audiofiles form the corresponding array are loaded, a custom
 * callback function will be executed.
 * 
 * @param {string} file - The name of the audio file.
 * @param {number} index - The array-index of the audio file.
 */
AudioBufferList.prototype.loadBuffer = function(file, index){
	
	var self = this;
	var url = utils.getCDNHost() + "assets/audio/dynamic/" + file + ".mp3";
	
	var request = new global.XMLHttpRequest(); 
	request.open("GET", url, true); 
	request.responseType = "arraybuffer";  	  	
	request.onload = function() { 
		
		// decode audio data
		self.context.decodeAudioData( request.response, function(buffer) { 
			if (!buffer) { 
				throw "ERROR: Unable to decode audio-file: " + url;  
			} 
			// add buffer to bufferlist
			self.bufferList[index] = buffer;
			
			// publish message to inform about status
			PubSub.publish("loading.complete.audio", {url: url});
			
			// increase internal counter and compare to length of
			// the audio list
			if (++self._loadCount === self.audioList.length){
				
				self._onload(self.bufferList);
			} 
		}, function(){
			throw "ERROR: Unable to decode audio-file " + url;  
		}); 
	};
	
	request.onerror = function() { 
		throw "ERROR: Unable to load audio-files.";  
	};
	
	// send request
	request.send();
	
	// publish message to inform about status
	PubSub.publish("loading.start.audio", {url: url});
};

module.exports = AudioBufferList;