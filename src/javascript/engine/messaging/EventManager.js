/**
 * @file This prototype provides topic-based publish/subscribe messaging and
 * enables communication between game entities.
 * 
 * see: https://github.com/mroderick/PubSubJS
 * see: Programming Game AI by Example by Mat Buckland: Messaging in State-Driven Agent Design
 * 
 * @author Human Interactive
 */

"use strict";

var Telegram = require( "./Telegram" );
var logger = require( "../etc/Logger" );
var GameEntity = require( "../game/entity/GameEntity" );

/**
 * Creates the event manager.
 * 
 * @constructor
 */
function EventManager() {

	Object.defineProperties( this, {

		isImmediateExceptions : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		}

	} );
}

/**
 * Publishes the the message, passing the data to it's subscribers.
 * 
 * @param {string} message - The message to publish.
 * @param {object} data - The data to pass to subscribers.
 * 
 * @returns {boolean} Is the message published successfully?
 */
EventManager.prototype.publish = function( message, data ) {

	return publish( message, data, false, this.isImmediateExceptions );
};

/**
 * Publishes the the message synchronously, passing the data to it's subscribers
 * 
 * @param {string} message - The message to publish.
 * @param {object} data - The data to pass to subscribers.
 * 
 * @returns {boolean} Is the message published successfully?
 */
EventManager.prototype.publishSync = function( message, data ) {

	return publish( message, data, true, this.isImmediateExceptions );
};

/**
 * Subscribes the passed function to the passed message. Every returned token is
 * unique and should be stored if you need to unsubscribe.
 * 
 * @param {string} message - The message to subscribe to.
 * @param {function} callback - The function to call when a new message is published.
 * 
 * @returns {string} Token for unsubscribing.
 */
EventManager.prototype.subscribe = ( function() {

	var token;

	return function( message, callback ) {

		// ensure, the callback parameter is a function
		if ( typeof callback !== "function" )
		{
			throw "ERROR: EventManager: No callback function for subscription assigned.";
		}

		// register message if necessary
		if ( messages.hasOwnProperty( message ) === false )
		{
			messages[ message ] = {};
		}

		// forcing token as string, to allow for future expansions without
		// breaking
		// usage and allow for easy use as key names for the "messages" object
		token = "uid_" + String( ++lastUid );
		messages[ message ][ token ] = callback;

		return token;

	};

}() );

/**
 * Clears all subscriptions
 */
EventManager.prototype.clearAllSubscriptions = function() {

	messages = {};
};

/**
 * Clears subscriptions by the topic.
 * 
 * @param {string} topic - The corresponding topic of the subscriptions to clear.
 */
EventManager.prototype.clearSubscriptions = ( function() {

	var m;

	return function( topic ) {

		for ( m in messages ) // jshint ignore:line
		{
			if ( messages.hasOwnProperty( m ) === true && m.indexOf( topic ) === 0 )
			{
				delete messages[ m ];
			}
		}
	};

}() );

/**
 * Removes subscriptions.
 * 
 * When passed a token, removes a specific subscription. When passed a function,
 * removes all subscriptions for that function. When passed a topic, removes all
 * subscriptions for that topic (hierarchy).
 * 
 * @param {any} value - A token, function or topic to unsubscribe.
 * 
 * @returns {any} The return value depends on the type of parameter "value".
 */
EventManager.prototype.unsubscribe = ( function() {

	var isTopic, isToken, isFunction;

	var result = false, message, m, t;

	return function( value ) {

		isTopic = ( typeof value === "string" ) && ( messages.hasOwnProperty( value ) === true );
		isToken = ( isTopic === false ) && ( typeof value === "string" );
		isFunction = typeof value === "function";

		// this handles the case if "value" is a topic
		if ( isTopic === true )
		{
			delete messages[ value ];
			return;
		}

		// iterate over all messages/topics
		for ( m in messages ) // jshint ignore:line
		{
			if ( messages.hasOwnProperty( m ) === true )
			{
				// buffer message
				message = messages[ m ];

				// this handles the case if "value" is a token
				if ( isToken === true && message[ value ] )
				{
					// delete the token of the corresponding topic
					delete message[ value ];

					// return the token to the caller
					result = value;

					// because tokens are unique, we can just stop here
					break;
				}

				// this handles the case if "value" is a function
				if ( isFunction === true )
				{
					// iterate over all subscriptions of a topic
					for ( t in message ) // jshint ignore:line
					{
						// check the value (callback) of the token
						if ( message.hasOwnProperty( t ) === true && message[ t ] === value )
						{
							// delete the token
							delete message[ t ];

							result = true;
						}
					}// next token
				}
			}
		}// next topic

		return result;
	};
	
}() );

/**
 * Sends a message to a game entity.
 * 
 * @param {number} sender - The ID of the sender of the message.
 * @param {number} receiver - The ID of the receiver of the message.
 * @param {string} message - The message to send.
 * @param {object} data - The data to pass to receiver.
 * @param {number} delay - The delay of the message.
 */
EventManager.prototype.sendMessageToEntity = function( sender, receiver, message, data, delay ) {

	sendMessageToEntity( sender, receiver, message, data, false, delay );
};

/**
 * Sends a message synchronously to a game entity.
 * 
 * @param {number} sender - The ID of the sender of the message.
 * @param {number} receiver - The ID of the receiver of the message.
 * @param {string} message - The message to send.
 * @param {object} data - The data to pass to receiver.
 */
EventManager.prototype.sendMessageToEntitySync = function( sender, receiver, message, data ) {

	sendMessageToEntity( sender, receiver, message, data, true, 0 );
};

/**
 * Registers a game entity for messaging.
 * 
 * @param {GameEntity} entity - The game entity to register.
 */
EventManager.prototype.registerEntity = function( entity ) {

	if ( entity instanceof GameEntity )
	{
		// register game entity if necessary
		if ( entities.hasOwnProperty( entity.id ) === false )
		{
			entities[ entity.id ] = entity;
		}
	}
	else
	{
		throw "ERROR: EventManager: Entity no instance of \"GameEntity\".";
	}

};

/**
 * Removes a game entity.
 * 
 * @param {GameEntity} entity - The game entity to remove.
 */
EventManager.prototype.removeEntity = function( entity ) {

	if ( entity instanceof GameEntity )
	{
		// remove game entity if necessary
		if ( entities.hasOwnProperty( entity.id ) === true )
		{
			delete entities[ entity.id ];
		}
	}
	else
	{
		throw "ERROR: EventManager: Entity no instance of \"GameEntity\".";
	}
};

/**
 * Clears the entity list for messaging.
 */
EventManager.prototype.clearEntites = function( entity ) {

	entities = {};
};

// private functions and attributes
var messages = {};
var entities = {};
var lastUid = -1;

/**
 * Checks if the given object has keys.
 * 
 * @param {object} function - The function to test.
 * 
 * @returns {boolean} Does the object has keys?
 */
function hasKeys( object ) {

	for ( var key in object )
	{
		if ( object.hasOwnProperty( key ) === true )
		{
			return true;
		}
	}
	
	return false;
}

/**
 * This returns a functions that just throws the given exception. Used for
 * delayed exception handling.
 * 
 * @param {object} exception - The exception to throw.
 */
function throwException( exception ) {

	return function reThrowException() {

		throw exception;
	};
}

/**
 * This function calls the subscriber function with delayed exceptions. This
 * ensures, that the logic delivers messages to all subscribers, even when some
 * fail.
 * 
 * @param {function} subscriber - The callback function of the subscriber.
 * @param {string} message - The message to publish.
 * @param {object} data - The data to pass to subscribers.
 */
function callSubscriberWithDelayedExceptions( subscriber, message, data ) {

	try
	{
		// we call the function within try/catch
		subscriber( message, data );
	}
	catch ( exception )
	{
		// catch the exception an throw it via an asynchronous wrapper function
		setTimeout( throwException( exception ), 0 );
	}
}

/**
 * This function calls the subscriber function with immediate exceptions. If an
 * exception is thrown, the delivery of message will automatically stop.
 * 
 * @param {function} subscriber - The callback function of the subscriber.
 * @param {string} message - The message to publish.
 * @param {object} data - The data to pass to subscribers.
 */
function callSubscriberWithImmediateExceptions( subscriber, message, data ) {

	// we call the function without try/catch
	subscriber( message, data );
}

/**
 * This function delivers the message to the subscribers.
 * 
 * @param {string} originalMessage - The original message of publish e.g.
 * "a.b.c".
 * @param {string} matchedMessage - The current message to publish e.g. "a.b".
 * @param {object} data - The data to pass to subscribers.
 * @param {object} isImmediateExceptions - Force immediate exceptions?
 */
function deliverMessage( originalMessage, matchedMessage, data, immediateExceptions ) {

	// get the subscribers of the topic.
	// thats a object with the structure token -> callback.
	var subscribers = messages[ matchedMessage ];

	// determine the type of function call
	var callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions : callSubscriberWithDelayedExceptions;

	// ensure the matchedMessage is an existing topic
	if ( messages.hasOwnProperty( matchedMessage ) === false )
	{
		return;
	}
	
	// call for each subscriber the callback function
	for ( var s in subscribers )
	{
		if ( subscribers.hasOwnProperty( s ) === true )
		{
			callSubscriber( subscribers[ s ], originalMessage, data );
		}
	}
}

/**
 * This function creates a delivery function for the publish of a message.
 * 
 * @param {string} message - The message to publish.
 * @param {object} data - The data to pass to subscribers.
 * @param {object} isImmediateExceptions - Force immediate exceptions?
 * 
 * @returns {function} The delivery function.
 */
function createDeliveryFunction( message, data, immediateExceptions ) {

	return function deliverNamespaced() {

		// ensure, we have a string object
		var topic = String( message );

		// index to the last appearance of a dot char
		// used for hierarchical addressing e.g. "a.b.c"
		var position = topic.lastIndexOf( '.' );

		// deliver the message as it is now
		deliverMessage( message, message, data, immediateExceptions );

		// trim the hierarchy and deliver message to each level
		while ( position !== -1 )
		{
			// update topic e.b. "a.b.c" => "a.b"
			topic = topic.substr( 0, position );

			// update the position index of the next "dot" char
			position = topic.lastIndexOf( '.' );

			// deliver message
			deliverMessage( message, topic, data, immediateExceptions );
		}
	};
}

/**
 * Checks, if a message has subscribers.
 * 
 * @param {string} message - The message to check.
 * 
 * @returns {boolean} Does the message has subscribers?
 */
function hasMessageSubscribers( message ) {

	// ensure, we have a string object
	var topic = String( message );

	// check, if the message exists AND if the message has subscriptions
	var isFound = Boolean( messages.hasOwnProperty( topic ) === true && hasKeys( messages[ topic ] ) === true );

	// index to the last appearance of a dot char. used for hierarchical
	// addressing e.g. "a.b.c"
	var position = topic.lastIndexOf( "." );

	// if no subscribers were found in the current level of the hierarchy AND the
	// message contains at least a "dot", check the next level e.g. "a.b"
	while ( isFound === false && position !== -1 )
	{
		// update topic e.b. "a.b.c" => "a.b"
		topic = topic.substr( 0, position );

		// update the position index of the next "dot" char
		position = topic.lastIndexOf( "." );

		// repeat check
		isFound = Boolean( messages.hasOwnProperty( topic ) === true && hasKeys( messages[ topic ] ) === true );
	}

	return isFound;
}

/**
 * Does the publish of a message.
 * 
 * @param {string} message - The message to publish.
 * @param {object} data - The data to pass to subscribers.
 * @param {boolean} isSync - Should the message be published synchronously?
 * @param {object} isImmediateExceptions - Force immediate exceptions?
 * 
 * @returns {boolean} Is the message published successfully?
 */
function publish( message, data, isSync, isImmediateExceptions ) {

	// first, check if the topic has subscribers
	if ( hasMessageSubscribers( message ) === false )
	{
		return false;
	}

	// wrap the data into a function
	var deliver = createDeliveryFunction( message, data, isImmediateExceptions );

	// if we have a sync publish, call it immediately
	if ( isSync === true )
	{
		deliver();
	}
	// if not, call it asynchronously
	else
	{
		setTimeout( deliver, 0 );
	}

	return true;
}

/**
 * Sends a message to an entity.
 * 
 * @param {number} sender - The ID of the sender of the message.
 * @param {number} receiver - The ID of the receiver of the message.
 * @param {string} message - The message to send.
 * @param {object} data - The data to pass to receiver.
 * @param {boolean} isSync - Should the message be send synchronously?
 * @param {number} delay - The delay of the message.
 */
function sendMessageToEntity( sender, receiver, message, data, isSync, delay ) {

	var telegram;

	// first, check if the sender AND receiver are registered
	if ( entities.hasOwnProperty( sender ) === false || entities.hasOwnProperty( receiver ) === false )
	{
		logger.warn( "WARN: EventManager: Message not sent. Entities not correctly registered." );
		
		return;
	}

	// create telegram
	telegram = new Telegram( sender, receiver, message, data, delay );

	// check the type of message delivery
	if ( isSync === true )
	{
		// call the "handleMessage" method of the game entity
		if ( entities[ receiver ].handleMessage( telegram ) === false )
		{
			logger.warn( "WARN: EventManager: Message not handled by receiver with ID: %i.", receiver );
		}
	}
	else
	{
		setTimeout( function() {

			// call the "handleMessage" method of the game entity with a delay
			if ( entities[ receiver ].handleMessage( telegram ) === false )
			{
				logger.warn( "WARN: EventManager: Message not handled by receiver with ID: %i.", receiver );
			}

		}, delay );
	}
}

module.exports = new EventManager();