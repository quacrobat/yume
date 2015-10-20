"use strict";

var logger = require( "../../core/Logger" );
var State = require( "./State" );

/*
 * State Attacking ---------------------------------------------------
 * 
 * In this state the team tries to make a goal.
 */

function Attacking() {

}

Attacking.prototype = Object.create( State.prototype );
Attacking.prototype.constructor = Attacking;

Attacking.prototype.enter = function( team ) {

	// set up the player's home regions
	team.setupTeamPositions();

	// if a player is in either the Wait or ReturnToHomeRegion states, its
	// steering target must be updated to that of its new home region to
	// enable it to move into the correct position.
	team.updateTargetsOfWaitingPlayers();
	
	logger.log("Enter State \"Attacking\" with team: ", team.id );
};

Attacking.prototype.execute = function( team ) {

	// if this team is no longer in control change states
	if ( !team.isInControl() )
	{
		team.stateMachine.changeState( States.Defending );

		return;
	}
	
	// calculate the best position for any supporting attacker to move to
	team.calculateBestSupportingPosition();
};

Attacking.prototype.exit = function( team ) {

	// there is no supporting player for defense
	team.supportingPlayer = null;

	logger.log("Exit State \"Attacking\" with team: ", team.id );
};

/*
 * State Defending ---------------------------------------------------
 * 
 * In this state the team tries to defend its goal.
 */

function Defending() {

}

Defending.prototype = Object.create( State.prototype );
Defending.prototype.constructor = Defending;

Defending.prototype.enter = function( team ) {

	// set up the player's home regions
	team.setupTeamPositions();

	// if a player is in either the Wait or ReturnToHomeRegion states, its
	// steering target must be updated to that of its new home region to
	// enable it to move into the correct position.
	team.updateTargetsOfWaitingPlayers();
	
	logger.log("Enter State \"Defending\" with team: ", team.id );
};

Defending.prototype.execute = function( team ) {

	// if in control change states
	if ( team.isInControl() )
	{
		team.stateMachine.changeState( States.Attacking );
	}
};

Defending.prototype.exit = function( team ) {

	logger.log("Exit State \"Defending\" with team: ", team.id );
};

/*
 * State PrepareForKickOff ---------------------------------------------------
 * 
 * In this state the team prepares for kick of.
 */

function PrepareForKickOff() {

}

PrepareForKickOff.prototype = Object.create( State.prototype );
PrepareForKickOff.prototype.constructor = PrepareForKickOff;

PrepareForKickOff.prototype.enter = function( team ) {

	// reset key player references
	team.controllingPlayer = null;
	team.supportingPlayer = null;
	team.receivingPlayer = null;
	team.playerClosestToBall = null;
	
	// send "GO_HOME" message to all players
	team.returnAllFieldPlayersToHome( true );
	
	logger.log("Enter State \"PrepareForKickOff\" with team: ", team.id );
};

PrepareForKickOff.prototype.execute = function( team ) {

	if ( team.isAllPlayersAtHome() && team.opponents.isAllPlayersAtHome() )
	{
		team.stateMachine.changeState( States.Defending );
	}
};

PrepareForKickOff.prototype.exit = function( team ) {

	team.pitch.isGameOn = true;
	
	logger.log("Exit State \"PrepareForKickOff\" with team: ", team.id );
};


var States = {
	Attacking : new Attacking(),
	Defending : new Defending(),
	PrepareForKickOff : new PrepareForKickOff()
};

module.exports = States;