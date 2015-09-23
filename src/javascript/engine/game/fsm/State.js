/**
 * @file Super prototype for states used by FSMs.
 * 
 * see "Programming Game AI by Example", Mat Buckland, Chapter 2
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates a new state.
 * 
 * @constructor
 * 
 */
function State() {

}

/**
 * This executes when the state is entered.
 * 
 * @param {GameEntity} entity - A reference to the entity.
 */
State.prototype.enter = function( entity ) {

};

/**
 * This is called by the FSM's update function each update step.
 * 
 * @param {GameEntity} entity - A reference to the entity.
 */
State.prototype.execute = function( entity ) {

};

/**
 * This executes when the state is exited.
 * 
 * @param {GameEntity} entity - A reference to the entity.
 */
State.prototype.exit = function( entity ) {

};

/**
 * This executes if the agent receives a message from the messaging system.
 * 
 * @param {GameEntity} entity - A reference to the entity.
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 * 
 * @returns {boolean} Is the message handled successfully by a state?
 */
State.prototype.onMessage = function( entity, message, data ) {

	return false;
};

module.exports = State;