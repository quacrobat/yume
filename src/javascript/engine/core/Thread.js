/**
 * @file This prototype represents a thread-object. It uses the HTML5-API Web
 * Workers to start scripts in separate threads.
 * 
 * @author Human Interactive
 */
"use strict";
/**
 * Creates a new Thread
 * 
 * @constructor
 * 
 * @param {string} id - The id of the thread.
 * @param {string} scriptURL - The URL of the serialized script.
 */
function Thread( id, scriptURL ) {

	Object.defineProperties( this, {
		id : {
			value : id,
			configurable : false,
			enumerable : true,
			writable : false
		},
		scriptURL : {
			value : scriptURL,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_worker : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );

	this._worker = new global.Worker( this.scriptURL );
}

/**
 * Posts a message to the internal web worker.
 * 
 * @param {object} message - The message.
 */
Thread.prototype.postMessage = function( message ) {

	this._worker.postMessage( message );
};

/**
 * Terminates the internal web worker.
 */
Thread.prototype.terminate = function() {

	this._worker.terminate();
};

/**
 * Adds an event listener to the message-event.
 * 
 * @param {function} listener - The event listener.
 */
Thread.prototype.onMessage = function( listener ) {

	this._worker.addEventListener( "message", listener, false );
};

/**
 * Adds an event listener to the error-event.
 * 
 * @param {function} listener - The event listener.
 */
Thread.prototype.onError = function( listener ) {

	this._worker.addEventListener( "error", listener, false );
};

module.exports = Thread;