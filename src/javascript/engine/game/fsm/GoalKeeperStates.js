"use strict";

var THREE = require( "three" );

var MESSAGE = require( "../../messaging/Message" );
var eventManager = require( "../../messaging/EventManager" );
var logger = require( "../../core/Logger" );
var PlayerBase = require( "../entity/PlayerBase" );
var State = require( "./State" );

/*
 * State GlobalState ---------------------------------------------------
 */

function GlobalState() {

}

GlobalState.prototype = Object.create( State.prototype );
GlobalState.prototype.constructor = GlobalState;

GlobalState.prototype.onMessage = function( keeper, telegram ) {

	// check message type
	switch ( telegram.message )
	{
		case MESSAGE.GO_HOME:

			keeper.setDefaultHomeRegion();

			keeper.stateMachine.changeState( States.ReturnHome );

			return true;

		case MESSAGE.RECEIVE_BALL:

			keeper.stateMachine.changeState( States.InterceptBall );

			return true;
	}
	
	return false;
};

/*
 * State TendGoal --------------------------------------------------- 
 * This is the main state for the goalkeeper. When in this state he will move left to
 * right across the goalmouth using the "interpose" steering behavior to put
 * himself between the ball and the back of the net. If the ball comes within
 * the "goalkeeper range" he moves out of the goalmouth to attempt to intercept
 * it. (see next state)
 */

function TendGoal() {

}

TendGoal.prototype = Object.create( State.prototype );
TendGoal.prototype.constructor = TendGoal;

TendGoal.prototype.enter = function( keeper ) {

	// turn interpose on
	keeper.steering.interposeOn( PlayerBase.CONFIG.KEEPER_TENDING_DISTANCE );

	// interpose will position the agent between the ball position and a target
	// position situated along the goalmouth. This call sets the target.
	keeper.steering.target.copy( keeper.getRearInterposeTarget() );
	
	logger.log("Enter State \"TendGoal\" with keeper: ", keeper.id );
};

TendGoal.prototype.execute = function( keeper ) {

	// the rear interpose target will change as the ball's position changes
	// so it must be updated each update-step
	keeper.steering.target.copy( keeper.getRearInterposeTarget() );

	// if the ball comes in range the keeper traps it and then changes state
	// to put the ball back in play
	if ( keeper.isBallWithinKeeperRange() )
	{
		keeper.ball.trap();

		keeper.pitch.isGoalKeeperInBallPossession = true;

		keeper.stateMachine.changeState( States.PutBallBackInPlay );

		return;
	}

	// if the keeper has ventured too far away from the goalline and there
	// is no threat from the opponents he should move back towards it
	if ( keeper.isTooFarFromGoalMouth() && keeper.team.isInControl() )
	{
		keeper.stateMachine.changeState( States.ReturnHome );
		
		return;
	}
	
	// if ball is within a predefined distance, the keeper moves out from
	// position to try to intercept it.
	if ( keeper.isBallWithinRangeForIntercept() && !keeper.team.isInControl() )
	{
		keeper.stateMachine.changeState( States.InterceptBall );
	}
};

TendGoal.prototype.exit = function( keeper ) {

	// turn interpose off
	keeper.steering.interposeOff();
	
	logger.log("Exit State \"TendGoal\" with keeper: ", keeper.id );
};

/*
 * State ReturnHome ---------------------------------------------------
 * 
 * In this state the goalkeeper simply returns back to the center of
 * the goal region before changing state back to TendGoal.
 */

function ReturnHome() {

}

ReturnHome.prototype = Object.create( State.prototype );
ReturnHome.prototype.constructor = ReturnHome;

ReturnHome.prototype.enter = function( keeper ) {

	keeper.steering.arriveOn();
	
	logger.log("Enter State \"ReturnHome\" with keeper: ", keeper.id );
};

ReturnHome.prototype.execute = function( keeper ) {

	keeper.steering.target.copy( keeper.getHomeRegion().center );

	// if close enough to home or the opponents get control over the ball,
	// change state to tend goal
	if ( keeper.isInHomeRegion() || !keeper.team.isInControl() )
	{
		keeper.stateMachine.changeState( States.TendGoal );
	}
};

ReturnHome.prototype.exit = function( keeper ) {

	keeper.steering.arriveOff();
	
	logger.log("Exit State \"ReturnHome\" with keeper: ", keeper.id );
};

/*
 * State InterceptBall ---------------------------------------------------
 * 
 * In this state the goalkeeper will attempt to intercept the ball using the
 * pursuit steering behavior, but he only does so so long as he remains
 * within his home region.
 */

function InterceptBall() {

}

InterceptBall.prototype = Object.create( State.prototype );
InterceptBall.prototype.constructor = InterceptBall;

InterceptBall.prototype.enter = function( keeper ) {

	keeper.steering.pursuitOn();
	
	logger.log("Enter State \"InterceptBall\" with keeper: ", keeper.id );
};

InterceptBall.prototype.execute = function( keeper ) {

	// if the goalkeeper moves too far away from the goal he should return to his
	// home region UNLESS he is the closest player to the ball, in which case,
	// he should keep trying to intercept it.
	if ( keeper.isTooFarFromGoalMouth() && !keeper.isClosestPlayerOnPitchToBall() )
	{
		keeper.stateMachine.changeState( States.ReturnHome );
		
		return;
	}

	// if the ball becomes in range of the goalkeeper's hands he traps the ball
	// and puts it back in play
	if ( keeper.isBallWithinKeeperRange() )
	{
		keeper.ball.trap();

		keeper.pitch.isGoalKeeperInBallPossession = true;

		keeper.stateMachine.changeState( States.PutBallBackInPlay );
	}
};

InterceptBall.prototype.exit = function( keeper ) {

	keeper.steering.pursuitOff();
	
	logger.log("Exit State \"InterceptBall\" with keeper: ", keeper.id );
};

/*
 * State PutBallBackInPlay ---------------------------------------------------
 * 
 * In this state the goalkeeper will put the ball back in play.
 */

function PutBallBackInPlay() {

}

PutBallBackInPlay.prototype = Object.create( State.prototype );
PutBallBackInPlay.prototype.constructor = PutBallBackInPlay;

PutBallBackInPlay.prototype.enter = function( keeper ) {

	// let the team know that the keeper is in control
	keeper.team.setControllingPlayer( keeper );
	
	// send all players home
	keeper.team.returnAllFieldPlayersToHome();
	keeper.team.opponents.returnAllFieldPlayersToHome();
	
	logger.log("Enter State \"PutBallBackInPlay\" with keeper: ", keeper.id );
};

PutBallBackInPlay.prototype.execute = function( keeper ) {

	var receiver = {
		object : null
	};

	var ballTarget = new THREE.Vector3();
	var kickDirection = new THREE.Vector3();

	// test if there are players further forward on the field we might be able
	// to pass to. If so, make a pass.
	if ( keeper.team.isPassPossible( keeper, receiver, ballTarget, PlayerBase.CONFIG.PLAYER_MAX_PASSING_FORCE, PlayerBase.CONFIG.KEEPER_MIN_PASS_DISTANCE ) )
	{
		kickDirection.subVectors( ballTarget, keeper.ball.object3D.position ).normalize();

		// make the pass
		keeper.ball.kick( kickDirection, PlayerBase.CONFIG.PLAYER_MAX_PASSING_FORCE );

		// goalkeeper no longer has ball
		keeper.pitch.isGoalKeeperInBallPossession = false;

		// let the receiving player know the ball's coming at him
		eventManager.sendMessageToEntitySync( keeper.id, receiver.object.id, MESSAGE.RECEIVE_BALL, {
			target : ballTarget.clone()
		} );

		// go back to tending the goal
		keeper.stateMachine.changeState( States.TendGoal );

		return;
	}

	keeper.velocity.set( 0, 0, 0 );
};

PutBallBackInPlay.prototype.exit = function( keeper ) {

	logger.log( "Exit State \"PutBallBackInPlay\" with keeper: ", keeper.id );
};

var States = {
	GlobalState : new GlobalState(),
	TendGoal : new TendGoal(),
	ReturnHome : new ReturnHome(),
	InterceptBall : new InterceptBall(),
	PutBallBackInPlay : new PutBallBackInPlay(),
};

module.exports = States;