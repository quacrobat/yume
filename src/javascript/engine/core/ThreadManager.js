/**
 * @file This prototype contains the entire logic 
 * for thread-based functionality.
 * 
 * @author Human Interactive
 */
"use strict";

var Thread = require("./Thread");
/**
 * Creates the network manager.
 * 
 * @constructor
 * 
 */
function ThreadManager(){
	
	Object.defineProperties(this, {
		_threads: {
			value: [],
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
}

/**
 * Adds an event listener to the message-event.
 * 
 * @param {string} id - The id of the thread.
 * @param {string} scriptURL - The URL of the serialized script.
 * 
 * @returns {Thread} The new thread.
 */
ThreadManager.prototype.createThread = function(id, script){
	
	// get URL of script
	var scriptURL = this._getScriptURL(script);
	
	// create thread and add to internal array
	var thread = new Thread(id, scriptURL);
	this._threads.push(thread);
	
	return thread;
};

/**
 * Gets a thread of the internal array.
 * 
 * @param {string} id - The id of the thread.
 * 
 * @returns {Thread} The thread.
 */
ThreadManager.prototype.get = function(id) {

	var thread = null;
	
	for( var index = 0; index < this._threads.length; index++){
		if(this._threads[index].id === id){
			thread =  this._threads[index];
			break;
		}
	}
	
	if(thread === null){
		throw "ERROR: Thread with ID " + id + " not existing.";
	}else{
		return thread;
	}
};

/**
 * Terminates the thread.
 * 
 * @param {Thread} thread - The thread to terminate.
 * 
 */
ThreadManager.prototype.terminateThread = function(thread){
	
	// remove form internal array
	var index = this._threads.indexOf(thread);
	this._threads.splice(index, 1);
	
	// release object URL
	global.URL.revokeObjectURL(thread.scriptURL);
	
	// terminate thread
	thread.thread.terminate();
};

/**
 * Terminates all threads.
 */
ThreadManager.prototype.terminateAllThreads = function(){
	
	for(var index; index < this._threads.length; index++){
		
		// release object URL
		global.URL.revokeObjectURL(this._threads[index].scriptURL);
		
		// terminate thread
		this._threads[index].terminate();
	}
	
	// clear internal array
	this._threads.length = 0;
};

/**
 * This method prepares the script, so it can run as a
 * separate thread. It creates a BLOB and provides a
 * object URL to generated content.
 * 
 * @param {string} script - The script for the thread.
 * 
 * @returns {string} The URL of the serialized script.
 */
ThreadManager.prototype._getScriptURL = function(script){
	
	var blob = new global.Blob(["(", script.toString(), ")()"], {type: "application/javascript"});
	var url = global.URL.createObjectURL(blob);
	return url;
};

module.exports = new ThreadManager();