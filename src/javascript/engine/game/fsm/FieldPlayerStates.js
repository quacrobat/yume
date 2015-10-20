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

GlobalState.prototype.execute = function( player ) {

	// if a player is in possession and close to the ball reduce his max speed
	if ( player.isBallWithinReceivingRange() && player.isControllingPlayer() )
	{
		player.maxSpeed = PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITH_BALL;
	}
	else
	{
		player.maxSpeed = PlayerBase.CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL;
	}
};

GlobalState.prototype.onMessage = ( function() {

	var kickDirection = new THREE.Vector3();

	return function( player, telegram ) {

		// check message type
		switch ( telegram.message )
		{
			case MESSAGE.RECEIVE_BALL:

				// set the target
				player.steering.target.copy( telegram.data.target );

				// change state
				player.stateMachine.changeState( States.ReceiveBall );

				return true;

			case MESSAGE.SUPPORT_ATTACKER:

				// if already supporting just return
				if ( player.stateMachine.isInState( States.SupportAttacker ) )
				{
					return true;
				}

				// set the target to be the best supporting position
				player.steering.target.copy( player.team.getSupportSpot() );

				// change state
				player.stateMachine.changeState( States.SupportAttacker );

				return true;

			case MESSAGE.GO_HOME:

				player.setDefaultHomeRegion();

				// change state
				player.stateMachine.changeState( States.ReturnToHomeRegion );

				return true;

			case MESSAGE.PASS_TO_ME:

				var requester = telegram.data;

				// if there is already a receiving player or the ball is not
				// within kicking range, this player cannot pass the ball to
				// the player making the request
				if ( player.team.receivingPlayer !== null || !player.isBallWithinKickingRange() )
				{
					return true;
				}

				// calculate kick direction
				kickDirection.subVectors( requester.object3D.position, player.ball.object3D.position );

				// make the pass
				player.ball.kick( kickDirection, PlayerBase.CONFIG.PLAYER_MAX_PASSING_FORCE );

				// let the receiver know a pass is coming
				eventManager.sendMessageToEntitySync( player.id, requester.id, MESSAGE.RECEIVE_BALL, {
					target : requester.object3D.position.clone()
				} );

				// change state
				player.stateMachine.changeState( States.Wait );

				player.findSupport();

				return true;

		}// end switch

		return false;
	};

}() );

/*
 * State ChaseBall --------------------------------------------------- 
 * In this state the field player will try to seek to the ball position.
 */

function ChaseBall() {

}

ChaseBall.prototype = Object.create( State.prototype );
ChaseBall.prototype.constructor = ChaseBall;

ChaseBall.prototype.enter = function( player ) {

	player.steering.seekOn();
	
	logger.log("Enter State \"ChaseBall\" with field player: ", player.id );
};

ChaseBall.prototype.execute = function( player ) {

	// if the ball is within kicking range the player changes state to "KickBall"
	if ( player.isBallWithinKickingRange() )
	{
		player.stateMachine.changeState( States.KickBall );

		return;
	}

	// if the player is the closest player to the ball then he should keep
	// chasing it
	if ( player.isClosestTeamMemberToBall() )
	{
		player.steering.target.copy( player.ball.object3D.position );
		
		return;
	}
	
	// if the player is not closest to the ball anymore, he should return back
	// to his home region and wait for another opportunity
	player.stateMachine.changeState( States.ReturnToHomeRegion );
};

ChaseBall.prototype.exit = function( player ) {

	player.steering.seekOff();
	
	logger.log("Exit State \"ChaseBall\" with field player: ", player.id );
};

/*
 * State SupportAttacker --------------------------------------------------- 
 * In this state the field player will try to support to the attacker.
 */

function SupportAttacker() {

}

SupportAttacker.prototype = Object.create( State.prototype );
SupportAttacker.prototype.constructor = SupportAttacker;

SupportAttacker.prototype.enter = function( player ) {

	player.steering.arriveOn();
	
	player.steering.target.copy( player.team.getSupportSpot() );
	
	logger.log("Enter State \"SupportAttacker\" with field player: ", player.id );
};

SupportAttacker.prototype.execute = function( player ) {

	// if his team loses control go back home
	if ( !player.team.isInControl() )
	{
		player.stateMachine.changeState( States.ReturnToHomeRegion );

		return;
	}

	// if the best supporting spot changes, change the steering target
	if ( !player.team.getSupportSpot().equals( player.steering.target ) )
	{
		player.steering.target.copy( player.team.getSupportSpot() );

		player.steering.arriveOn();
	}

	// if this player has a shot at the goal AND the attacker can pass the ball
	// to him the attacker should pass the ball to this player
	if ( player.team.isShootPossible( player.object3D.position, PlayerBase.CONFIG.PLAYER_MAX_SHOOTING_FORCE, new THREE.Vector3() ) )
	{
		player.team.requestPass( player );
	}

	// if this player is located at the support spot and his team still have
	// possession, he should remain still and turn to face the ball
	if ( player.isAtTarget() )
	{
		player.steering.arriveOff();

		// the player should keep his eyes on the ball!
		player.trackBall();

		player.velocity.set( 0, 0, 0 );

		// if not threatened by another player request a pass
		if ( !player.isThreatened() )
		{
			player.team.requestPass( player );
		}
	}
};

SupportAttacker.prototype.exit = function( player ) {

	// set supporting player to null so that the team knows it has to determine a new one
	player.team.supportingPlayer = null;
	
	player.steering.arriveOff();
	
	logger.log("Exit State \"SupportAttacker\" with field player: ", player.id );
};

/*
 * State ReturnToHomeRegion --------------------------------------------------- 
 * In this state the field player will return to his home region.
 */
function ReturnToHomeRegion() {

}

ReturnToHomeRegion.prototype = Object.create( State.prototype );
ReturnToHomeRegion.prototype.constructor = ReturnToHomeRegion;

ReturnToHomeRegion.prototype.enter = function( player ) {

	player.steering.arriveOn();

	// ensure the player's steering target is within the home region
	if ( !player.getHomeRegion().isInside( player.steering.target, true ) )
	{
		player.steering.target.copy( player.getHomeRegion().center );
	}
	
	logger.log("Enter State \"ReturnToHomeRegion\" with field player: ", player.id );
};

ReturnToHomeRegion.prototype.execute = function( player ) {

	if ( player.pitch.isGameOn )
	{
		// if the ball is nearer this player than any other team member &&
		// there is not an assigned receiver && the goalkeeper does not has
		// the ball, go chase it
		if ( player.isClosestTeamMemberToBall() && player.team.receivingPlayer === null && !player.pitch.isGoalKeeperInBallPossession )
		{
			player.stateMachine.changeState( States.ChaseBall );
			
			return;
		}
	}
	
	// if game is on and the player is close enough to home, change state to
	// wait and set the player target to his current position (so that if he
	// gets jostled out of position he can move back to it)
	if ( player.pitch.isGameOn && player.isInHomeRegion() )
	{
		player.steering.target.copy( player.object3D.position );
		
		player.stateMachine.changeState( States.Wait );
	}
	
	// if game is not on the player must return much closer to the center of
	// his home region
	else if ( !player.pitch.isGameOn && player.isAtTarget() )
	{
		player.stateMachine.changeState( States.Wait );
	}
	
};

ReturnToHomeRegion.prototype.exit = function( player ) {

	player.steering.arriveOff();
	
	logger.log("Exit State \"ReturnToHomeRegion\" with field player: ", player.id );
};

/*
 * State Wait --------------------------------------------------- 
 * In this state the field player will wait in his home region.
 */
function Wait() {

}

Wait.prototype = Object.create( State.prototype );
Wait.prototype.constructor = Wait;

Wait.prototype.enter = function( player ) {

	// if the game is not on make sure the target is the center of the player's
	// home region. This is ensure all the players are in the correct positions
	// ready for kick off
	if ( !player.pitch.isGameOn )
	{
		player.steering.target.copy( player.getHomeRegion().center );
	}
	
	logger.log("Enter State \"Wait\" with field player: ", player.id );
};

Wait.prototype.execute = function( player ) {

	// if the player has been jostled out of position, get back in position
	if ( !player.isAtTarget() )
	{
		player.steering.arriveOn();
	}
	else
	{
		player.steering.arriveOff();

		player.velocity.set( 0, 0, 0 );

		// the player should keep his eyes on the ball!
		player.trackBall();
	}

	// if this player's team is controlling AND this player is not the
	// attacker AND is further up the field than the attacker he should
	// request a pass
	if ( player.team.isInControl() && !player.isControllingPlayer() && player.isAheadOfAttacker() )
	{
		player.team.requestPass( player );

		return;
	}

	if ( player.pitch.isGameOn )
	{
		// if the ball is nearer to this player than any other team member AND
		// there is not an assigned receiver AND neither goalkeeper has the
		// ball, go chase it
		if ( player.isClosestTeamMemberToBall() && player.team.receivingPlayer === null && !player.pitch.isGoalKeeperInBallPossession )
		{
			player.stateMachine.changeState( States.ChaseBall );
			
			return;
		}
	}
};

Wait.prototype.exit = function( player ) {

	logger.log( "Exit State \"Wait\" with field player: ", player.id );
};

/*
 * State KickBall --------------------------------------------------- 
 * In this state the player kicks the ball. The player can shot a the goal
 * or pass to a team member.
 */
function KickBall() {

}

KickBall.prototype = Object.create( State.prototype );
KickBall.prototype.constructor = KickBall;

KickBall.prototype.enter = function( player ) {

	// let the team know this player is controlling
	player.team.setControllingPlayer( player );

	// the player can only make a specific amount of kicks per second
	if ( !player.isReadyForNextKick() )
	{
		player.stateMachine.changeState( States.ChaseBall );
	}
	
	logger.log("Enter State \"KickBall\" with field player: ", player.id );
};

KickBall.prototype.execute = ( function() {

	// the direction player to ball
	var toBall = new THREE.Vector3();

	// if a shot is possible, this vector will hold the position along the
	// opponent's goal line the player should aim for
	var ballTarget = new THREE.Vector3();

	// this is the direction the ball will be kicked in to shot a goal
	var kickDirection = new THREE.Vector3();

	// if a receiver for the pass is found this will point to it
	var receiver = {
		object : null
	};

	return function( player ) {
		
		var dot, power;

		// calculate the dot product of the vector pointing to the ball and the
		// player's heading
		toBall.subVectors( player.ball.object3D.position, player.object3D.position ).normalize();
		dot = toBall.dot( player.getDirection() );

		// cannot kick the ball if the goalkeeper is in possession or if it is
		// behind the player or if there is already an assigned receiver. So
		// just continue chasing the ball
		if ( player.pitch.isGoalKeeperInBallPossession || ( dot < 0 ) || player.team.receivingPlayer !== null )
		{
			player.stateMachine.changeState( States.ChaseBall );

			return;
		}

		/* attempt a shot at the goal */

		// the dot product is used to adjust the shooting force. The more
		// directly the ball is ahead, the more forceful the kick
		power = PlayerBase.CONFIG.PLAYER_MAX_SHOOTING_FORCE * dot;

		// if it is determined that the player could score a goal from this
		// position OR if he should just kick the ball anyway, the player will
		// attempt to make the shot
		if ( ( player.team.isShootPossible( player.ball.object3D.position, power, ballTarget ) ) || ( Math.random() < PlayerBase.CONFIG.PLAYER_CHANCE_ATTEMPT_POT_SHOT ) )
		{
			// add some noise to the kick. We don't want players who are too
			// accurate!
			player.ball.addNoiseToKick( ballTarget );

			// this is the direction the ball will be kicked in
			kickDirection.subVectors( ballTarget, player.ball.object3D.position );

			// do the kick!
			player.ball.kick( kickDirection, power );

			// change state
			player.stateMachine.changeState( States.Wait );

			player.findSupport();

			return;
		}

		/* attempt a pass to a player */

		power = PlayerBase.CONFIG.PLAYER_MAX_PASSING_FORCE * dot;

		// test if there are any potential candidates available to receive a pass
		if ( player.isThreatened() && player.team.isPassPossible( player, receiver, ballTarget, power, PlayerBase.CONFIG.PLAYER_MIN_PASS_DISTANCE ) )
		{
			// add some noise to the kick
			player.ball.addNoiseToKick( ballTarget );

			// this is the direction the ball will be kicked in
			kickDirection.subVectors( ballTarget, player.ball.object3D.position );

			// do the kick!
			player.ball.kick( kickDirection, power );

			// let the receiving player know the ball's coming at him
			eventManager.sendMessageToEntitySync( player.id, receiver.object.id, MESSAGE.RECEIVE_BALL, {
				target : ballTarget.clone()
			} );

			// the player should wait at his current position unless instructed
			// otherwise
			player.stateMachine.changeState( States.Wait );

			player.findSupport();
		}
		else
		{
			// cannot shoot or pass, so dribble the ball upfield
			player.findSupport();

			player.stateMachine.changeState( States.Dribble );
		}
	};

}() );

KickBall.prototype.exit = function( player ) {

	logger.log( "Exit State \"KickBall\" with field player: ", player.id );
};


/*
 * State Dribble --------------------------------------------------- In this
 * state the ball controlling field player moves to the opposing goal.
 */
function Dribble() {

}

Dribble.prototype = Object.create( State.prototype );
Dribble.prototype.constructor = Dribble;

Dribble.prototype.enter = function( player ) {

	// let the team know this player is controlling
	player.team.setControllingPlayer( player );
	
	logger.log("Enter State \"Dribble\" with field player: ", player.id );
};

Dribble.prototype.execute = ( function() {

	var quarterPI = Math.PI * 0.25;

	var rotationMatrix = new THREE.Matrix4();

	return function( player ) {
		
		// get direction of player
		var playerDirection = player.getDirection();

		// calculate the dot product of direction and home goal facing
		var dot = playerDirection.dot( player.team.homeGoal.facing );

		// if the ball is between the player and the home goal, it needs to
		// swivel the ball around by doing multiple small kicks and turns until
		// the player is facing in the correct direction
		if ( dot < 0 )
		{
			// the player's heading is going to be rotated by a small amount
			// (Pi/4) and then the ball will be kicked in that direction

			// calculate the sign (+/-) of the angle between the player heading
			// and the facing direction of the goal so that the player rotates
			// around in the correct direction
			var sign = ( ( playerDirection.x * player.team.homeGoal.facing.z ) < ( playerDirection.z * player.team.homeGoal.facing.x ) ) ? 1 : -1;

			// setup rotation matrix
			rotationMatrix.makeRotationY( ( quarterPI * sign ) );

			// apply rotation to direction
			playerDirection.transformDirection( rotationMatrix );

			// kick the ball with a lower force if the player turns around
			player.ball.kick( playerDirection, PlayerBase.CONFIG.PLAYER_MAX_DRIBBLE_AND_TURN_FORCE );
		}
		else
		{
			// kick the ball down the field
			player.ball.kick( player.team.homeGoal.facing, PlayerBase.CONFIG.PLAYER_MAX_DRIBBLE_FORCE );
		}

		// the player has kicked the ball so he must now change state to follow
		// it
		player.stateMachine.changeState( States.ChaseBall );
	};

}() );

Dribble.prototype.exit = function( player ) {

	logger.log( "Exit State \"Dribble\" with field player: ", player.id );
};

/*
 * State ReceiveBall --------------------------------------------------- In this
 * state the field player receives the ball.
 */
function ReceiveBall() {

}

ReceiveBall.prototype = Object.create( State.prototype );
ReceiveBall.prototype.constructor = ReceiveBall;

ReceiveBall.prototype.enter = function( player ) {
		
	// let the team know this player is receiving the ball
	player.team.receivingPlayer = player;

	// this player is also now the controlling player
	player.team.setControllingPlayer( player );

	// there are two types of receive behavior. One uses arrive to direct the
	// receiver to the position sent by the passer in its message. The other
	// uses the pursuit behavior to pursue the ball. This statement selects
	// between them dependent on the probability
	// CHANCE_OF_USING_ARRIVE_TYPE_RECEIVE_BEHAVIOR, whether or not an opposing
	// player is close to the receiving player, and whether or not the receiving
	// player is in the opponents "hot region" (the third of the pitch closest
	// to the opponent's goal)
	if ( ( player.isInHotRegion() || Math.random() < PlayerBase.CONFIG.PLAYER_CHANCE_OF_USING_ARRIVE_TYPE_RECEIVE_BEHAVIOR ) && 
		 !player.team.isOpponentWithinRadius( player.object3D.position, PlayerBase.CONFIG.PLAYER_PASS_THREAD_RADIUS ) ) 
	{
		player.steering.arriveOn();
	}
	else
	{
		player.steering.pursuitOn();
	}
	
	logger.log("Enter State \"ReceiveBall\" with field player: ", player.id );
};

ReceiveBall.prototype.execute = function( player ) {

	// if the ball comes close enough to the player or if his team lose
	// control he should change state to chase the ball
	if ( player.isBallWithinReceivingRange() || !player.team.isInControl() )
	{
		player.stateMachine.changeState( States.ChaseBall );

		return;
	}

	// if "pursuit" is active, it's necessary to update the target position
	if ( player.steering.isPursuitOn() )
	{
		player.steering.target.copy( player.ball.object3D.position );
	}

	// if the player has "arrived" at the steering target he should wait and
	// turn to face the ball
	if ( player.isAtTarget() )
	{
		player.steering.arriveOff();
		player.steering.pursuitOff();
		player.trackBall();
		player.velocity.set( 0, 0, 0 );
	}
};

ReceiveBall.prototype.exit = function( player ) {

	player.steering.arriveOff();
	player.steering.pursuitOff();
	
	player.team.receivingPlayer = null;
	
	logger.log( "Exit State \"ReceiveBall\" with field player: ", player.id );
};

var States = {
	GlobalState : new GlobalState(),
	ChaseBall : new ChaseBall(),
	SupportAttacker : new SupportAttacker(),
	ReturnToHomeRegion : new ReturnToHomeRegion(),
	Wait : new Wait(),
	KickBall : new KickBall(),
	Dribble : new Dribble(),
	ReceiveBall : new ReceiveBall()
};

module.exports = States;