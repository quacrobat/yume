/**
 * @file Creates and manages a WebSocket-Server for
 * handling multiplayer-features.
 * 
 * @author Human Interactive
 */

"use strict";

var debug = require("debug")("YUME");
var ws = require("ws");

var Message = require("../../engine/core/Message");

var self;

/**
 * Creates the multiplayer-server.
 * 
 * @constructor
 * 
 * @param {number} port - The port of the server.
 * @param {function} callback - Executes, when the server is ready.
 */
function MultiplayerServer(port, callback){

	Object.defineProperties(this, {
		port: {
			value: port,
			configurable: false,
			enumerable: true,
			writable: false
		},
		callback: {
			value: callback,
			configurable: false,
			enumerable: true,
			writable: false
		},
		_server: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_sessions: {
			value: {},
			configurable: false,
			enumerable: false,
			writable: false
		},
		_CLIENTS_PER_SESSION: {
			value: 4,
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
	
	self = this;
}

/**
 * Initializes the server.
 * 
 * @param {function} callback - Executes, when the server is ready.
 */
MultiplayerServer.prototype.init = function(callback){
	
	// create server instance
	this._server = new ws.Server({port: this.port});
	
	// set event listener to handle new connections
	this._server.on("connection", this._onConnection);
	
	// execute callback
	if(typeof this.callback === "function"){
		this.callback();
	}
};

/**
 * Event listener for the "connection" event of the WebSockets API.
 * When a user connects to the server, this method assigns the user
 * to a session and adds event listeners to the corresponding socket.
 * The socket object represents the connection to the client.
 * 
 * @param {object} socket - The socket object.
 */
MultiplayerServer.prototype._onConnection = function(socket){
	
	// namespace for custom data
	socket.userData = {};
	
	// assign client to a session and save session-ID
	self._assignSession(socket);
	
	// assign client to a unique id
	self._assignClientId(socket);
	
	// update online status
	self._updateOnlineStatus(true, socket);
	
	// set event listener to handle incoming messages
	// of the socket
	socket.on("message", function incoming(message) {
		
		// prepare message for sending
		message = self._prepareMessage(message, socket);
		
		// send messages to other clients
		self._broadcast(message, socket);
	});
	
	// set event listener to handle the closing of a connection
	socket.on("close", function(){
		
		// update online status
		self._updateOnlineStatus(false, socket);
		
		// clean session
		self._clean(socket);
		
		debug("INFO: MultiplayerServer: Client disconnected");
	});
	
	debug("INFO: MultiplayerServer: Client connected from IP:", socket.upgradeReq.connection.remoteAddress);
};

/**
 * This method assigns the socket-object to a session. A session is
 * something like a chat-room. Messages of a client will only delivered
 * to other clients in the same session. This method always tries to assign
 * users to existing sessions, before creating a new one.
 * 
 * @param {object} socket - The socket object.
 * 
 */
MultiplayerServer.prototype._assignSession = (function(){

	var session = null;
	var id = 0;
	var sessionCount = 0;
	
	return function(socket){

		// Iterate over all sessions
		for(id in this._sessions) { // jshint ignore:line
			
			if(this._sessions.hasOwnProperty(id)){
				
				// get session
				session = this._sessions[id];
				
				// check, if there are free slots...
				if(session.length < this._CLIENTS_PER_SESSION){
					
					// ...if so, push the socket to the session
					session.push(socket);
					
					// assign session-id to socket
					socket.userData.sessionId = id;
					
					debug("INFO: MultiplayerServer: Client assigned to existing session with ID: %s", id);
					
					return;
				}
			}
		}
		
		// if no session was assigned, a new one will be created
		id = sessionCount++;
		
		// create new session-array with the socket of the sender
		// and add to sessions-list.
		this._sessions[id] = [socket];
		
		// assign session-id to socket
		socket.userData.sessionId = id;
		
		debug("INFO: MultiplayerServer: Client assigned to new session with ID: %s", id);
	};
	
}());

/**
 * Assigns a unique id to the socket object.
 * 
 * @param {object} socket - The socket object.
 * 
 */
MultiplayerServer.prototype._assignClientId = (function(){
	
	var idCount = 0;
	
	return function(socket){
		socket.userData.clientId = idCount++;
	};
	
}());

/**
 * This method removes the socket of its session. Empty session will be deleted.
 * 
 * @param {object} socket - The socket object to remove.
 * 
 */
MultiplayerServer.prototype._clean = (function(){

	var session = null;
	
	return function(socket){
		
		// get session
		session = this._sessions[socket.userData.sessionId];
		
		// if the session has a length of 1, the current
		// socket is the last one in the session. To avoid empty
		// session, the logic deletes it with the socket.
		if(session.length === 1){
			
			delete this._sessions[socket.userData.sessionId];
			
			debug("INFO: MultiplayerServer: Socket removed and session deleted with ID: %s", socket.userData.sessionId);
			
		// if the session has a length greater than one, other sockets are in the same session.
		// The socket will just be removed from the session.
		}else if(session.length > 1){
			
			var index = session.indexOf(socket);
			
		 	session.splice(index, 1);
		 	
		 	debug("INFO: MultiplayerServer: Socket removed from session with ID: %s", socket.userData.sessionId);
		 	
		}else{
			// This case must never happen! If so, throw runtime error.
			throw "ERROR: MultiplayerServer: Invalid State Exception: Wrong number of session entries.";
		}
	};
	
}());

/**
 * Delivers a message to all clients in the same session.
 * 
 * @param {object} message - The message to deliver.
 * @param {object} sender - The socket object of the sender.
 * 
 */
MultiplayerServer.prototype._broadcast = (function(){
	
	var message = null;
	var session = null;
	var index = 0;
	
	return function(message, sender){
		
		// get session
		session = this._sessions[sender.userData.sessionId];
		
		for(index = 0; index < session.length; index++) {
			
			// don't send the message to the sender back
			if (session[index] !== sender) {
				
				session[index].send(message);
			}
		}
		
		debug("INFO: MultiplayerServer: Session-ID: %s; Broadcast Message: %s", sender.userData.sessionId, message);
	};
	
}());

/**
 * Updates the status of the current socket.
 * 
 * @param {boolean} isOnline - The online Status.
 * @param {object} sender - The socket object of the sender.
 * 
 */
MultiplayerServer.prototype._updateOnlineStatus = (function(){
	
	var message = null;
	var session = null;
	var index = 0;
	
	return function(isOnline, sender){
		
		// create message
		message = JSON.stringify( new Message(Message.TYPES.STATUS, {online: isOnline, clientId: sender.userData.clientId} ) );
		
		// send message to all clients in the same session
		self._broadcast(message, sender);
		
		// get session
		session = this._sessions[sender.userData.sessionId];
		
		// when sender is online, send online status of other players
		if(isOnline === true){
			
			for(index = 0; index < session.length; index++) {
				
				if (session[index] !== sender) {
					message = JSON.stringify( new Message(Message.TYPES.STATUS, {clientId: session[index].userData.clientId, online: isOnline} ) );
					sender.send(message);
					
					debug("INFO: MultiplayerServer: Session-ID: %s; Client Message: %s", sender.userData.sessionId, message);
				}
			}
		}
	};
	
}());

/**
 * Prepares the message for further sending.
 * 
 * @param {object} message - The message object.
 * @param {object} sender - The socket object of the sender.
 * 
 * @returns {object} The message.
 */
MultiplayerServer.prototype._prepareMessage = function(message, sender){
	
	// parse message
	message = JSON.parse(message);
	
	// add clientId
	message.content.clientId = sender.userData.clientId;
	
	// stringify object
	return JSON.stringify(message);
};

module.exports = MultiplayerServer;