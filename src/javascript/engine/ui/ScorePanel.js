/**
 * @file Prototype for ui-element soccer panel.
 * 
 * @author Human Interactive
 */

"use strict";

var UiElement = require( "./UiElement" );
var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var self;

/**
 * Creates the development panel.
 * 
 * @constructor
 */
function ScorePanel() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$scorePanel : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$blueGoals : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$redGoals : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
	
	self = this;
}

ScorePanel.prototype = Object.create( UiElement.prototype );
ScorePanel.prototype.constructor = ScorePanel;

/**
 * Initializes the control.
 */
ScorePanel.prototype.init = function() {

	this._$scorePanel = global.document.querySelector( "#score-panel" );
	this._$blueGoals = this._$scorePanel.querySelector( ".blue" );
	this._$redGoals = this._$scorePanel.querySelector( ".red" );
	
	eventManager.subscribe( TOPIC.GAME.SCORE, this._onGoal );
};

/**
 * Updates the score, if a team shots a goal.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
ScorePanel.prototype._onGoal = function( message, data ) {

	self._$blueGoals.textContent = data.goalsBlue;
	self._$redGoals.textContent = data.goalsRed;
};

module.exports = new ScorePanel();