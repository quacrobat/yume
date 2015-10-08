/**
 * @file This defines a telegram. A telegram is a data structure that records
 * information required to dispatch game messages. These messages are used by
 * game entities to communicate with each other.
 * 
 * @author Human Interactive
 */
"use strict";

/**
 * Creates a telegram.
 * 
 * @constructor
 * 
 * @param {number} sender - The entity that sent this telegram
 * @param {number} receiver - The entity that is to receive this telegram
 * @param {string} message - The message itself.
 * @param {object} data - Additional information that may accompany the message.
 * @param {number} delay - Messages can be dispatched immediately or delayed for a specified amount of time.
 */
function Telegram( sender, receiver, message, data, delay ) {

	Object.defineProperties( this, {
		sender : {
			value : sender,
			configurable : false,
			enumerable : true,
			writable : false
		},
		receiver : {
			value : receiver,
			configurable : false,
			enumerable : true,
			writable : false
		},
		message : {
			value : message,
			configurable : false,
			enumerable : true,
			writable : false
		},
		data : {
			value : data,
			configurable : false,
			enumerable : true,
			writable : false
		},
		delay : {
			value : delay,
			configurable : false,
			enumerable : true,
			writable : false
		}
	} );
}

module.exports = Telegram;