/**
 * @file Prototype for network-messages.
 * 
 * @author Human Interactive
 */
"use strict";

/**
 * Creates a network message.
 * 
 * @constructor
 */
function Message(type, content){

	Object.defineProperties(this, {
		time: {
			value : Date.now(),
			configurable: false,
			enumerable: true,
			writable: false
		},
		type: {
			value : type,
			configurable: false,
			enumerable: true,
			writable: true
		},
		content: {
			value : content,
			configurable: false,
			enumerable: true,
			writable: true
		}
	});
}

Message.TYPES = {
	SYSTEM: 0,
	GAME: 1,
	STATUS: 2,
	CHAT: 3,
	INFO: 4,
	ERROR: 5
};

module.exports = Message;