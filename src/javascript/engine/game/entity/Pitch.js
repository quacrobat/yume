/**
 * @file Prototype to define a goal for a soccer pitch.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var GameEntity = require( "./GameEntity" );
var Region = require( "./Region" );
var Ball = require( "./Ball" );
var Goal = require( "./Goal" );
var Team = require( "./Team" );
var TeamStates = require( "../fsm/TeamStates" );
var eventManager = require( "../../messaging/EventManager" );
var TOPIC = require( "../../messaging/Topic" );
var world = require( "../../core/World" );
var logger = require( "../../core/Logger" );

/**
 * Creates a soccer pitch.
 * 
 * @constructor
 * @augments GameEntity
 * 
 * @param {EntityManager} entityManager - The reference to the entity manager.
 * @param {THREE.Vector2} dimension - The dimensions of the playing area.
 * 
 */
function Pitch( entityManager, dimension ) {

	GameEntity.call( this, entityManager );

	Object.defineProperties( this, {
		// soccer entities
		ball : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		redTeam : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		blueTeam : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		redGoal : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		blueGoal : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// defines the dimensions of the playing area
		playingArea : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// true if a goalkeeper has possession
		isGoalKeeperInBallPossession : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// true if the game is in play. Set to false whenever the players are
		// getting ready for kickoff.
		isGameOn : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// set true to pause the motion
		isPaused : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the playing field is broken up into regions that the team
		// can make use of to implement strategies
		_regions : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );
	
	// setup playing area
	this.playingArea = new Region( dimension.y * 0.5, dimension.x * 0.5, dimension.x * -0.5, dimension.y * -0.5 );
	
	// setup mesh components
	var geometry = new THREE.PlaneBufferGeometry( this.playingArea.width, this.playingArea.height );
	var material = new THREE.MeshBasicMaterial( {
		color : 0x1f4b1a
	} );
	
	// apply mesh
	this.object3D = new THREE.Mesh( geometry, material );

	// apply default rotation
	this.object3D.rotation.set( Math.PI * -0.5, 0, 0 );

	// setup regions
	this._createRegions();

	// setup game
	this._createGame();
	
	// setup boundary
	this._createWalls();
	
	// start game
	this.isGameOn = true;
}

Pitch.prototype = Object.create( GameEntity.prototype );
Pitch.prototype.constructor = Pitch;

/**
 * Updates the pitch.
 */
Pitch.prototype.update = function() {

	if ( this.isPaused === true )
	{
		return;
	}

	// update ball
	this.ball.update();

	// update the teams
	this.redTeam.update();
	this.blueTeam.update();

	// if a goal has been detected reset the pitch ready for kickoff
	if ( this.redGoal.isScored( this.ball ) || this.blueGoal.isScored( this.ball ) )
	{
		this.isGameOn = false;

		// reset ball at origin
		this.ball.placeAtPosition();

		// get the teams ready for kickoff
		this.redTeam.stateMachine.changeState( TeamStates.PrepareForKickOff );
		this.blueTeam.stateMachine.changeState( TeamStates.PrepareForKickOff );

		// inform system about goal
		eventManager.publish( TOPIC.GAME.SCORE, {
			goalsBlue : this.redGoal.numberGoalsScored,
			goalsRed : this.blueGoal.numberGoalsScored
		} );
	}
};

/**
 * Returns the region by the given ID.
 * 
 * @param {number} id - The ID of the region
 * 
 * @returns {Region} The requested region.
 */
Pitch.prototype.getRegionById = function( id ) {

	logger.assert( id >= 0 && id < this._regions.length );

	return this._regions[ id ];
};

/**
 * Toggles pause state.
 */
Pitch.prototype.togglePause = function() {

	this.isPaused = !this.isPaused;
};

/**
 * This instantiates the regions the players utilize to position themselves.
 */
Pitch.prototype._createRegions = function() {

	// identifier of a region
	var id = 0;

	// calculate dimension
	var width = this.playingArea.width / Pitch.REGIONS.HORIZONTAL;
	var height = this.playingArea.height / Pitch.REGIONS.VERTICAL;

	// create regions
	for ( var col = 0; col < Pitch.REGIONS.HORIZONTAL; col++ )
	{
		for ( var row = 0; row < Pitch.REGIONS.VERTICAL; row++ )
		{
			this._regions[ id ] = new Region( 
					this.playingArea.bottom + ( row + 1 ) * height, // top
					this.playingArea.left + ( col + 1 ) * width, // right
					this.playingArea.left + col * width, // left
					this.playingArea.bottom + row * height, // bottom
					id );
			
			// increase id
			id++;
		}
	}
};

/**
 * Creates the game with all entities.
 */
Pitch.prototype._createGame = function() {

	// ball
	this.ball = new Ball( this.entityManager, Ball.SIZE, Ball.MASS );
	world.addObject3D( this.ball.object3D );

	// goals
	this.redGoal = new Goal( this.entityManager, new THREE.Vector3( this.playingArea.right + 1, 3, 0 ), new THREE.Vector3( 2, 6, 10 ), new THREE.Vector3( -1, 0, 0 ), Team.RED );
	world.addObject3D( this.redGoal.object3D );

	this.blueGoal = new Goal( this.entityManager, new THREE.Vector3( this.playingArea.left - 1, 3, 0 ), new THREE.Vector3( 2, 6, 10 ), new THREE.Vector3( 1, 0, 0 ), Team.BLUE );
	world.addObject3D( this.blueGoal.object3D );

	// teams
	this.blueTeam = new Team( this.entityManager, this.blueGoal, this.redGoal, this, Team.BLUE );
	this.redTeam = new Team( this.entityManager, this.redGoal, this.blueGoal, this, Team.RED );
	
	// make sure each team knows who their opponents are
	this.blueTeam.opponents = this.redTeam;
	this.redTeam.opponents = this.blueTeam;
};

/**
 * Creates the walls.
 */
Pitch.prototype._createWalls = function() {

	var wall;

	// calculate the distance "post - out"
	var distance = ( this.playingArea.height * 0.5 ) - this.blueGoal.rightPost.z;

	var wallFrontGeometry = new THREE.Geometry().fromBufferGeometry( new THREE.PlaneBufferGeometry( this.playingArea.width, 10, 1, 1 ) );
	var wallSideGeometry = new THREE.Geometry().fromBufferGeometry( new THREE.PlaneBufferGeometry( distance, 10, 1, 1 ) );
	var wallMaterial = new THREE.MeshBasicMaterial( {
		visible : false
	} );

	// bottom wall
	wall = new THREE.Mesh( wallFrontGeometry, wallMaterial );
	wall.position.set( 0, 5, this.playingArea.bottom );
	world.addWall( wall );

	// top wall
	wall = new THREE.Mesh( wallFrontGeometry, wallMaterial );
	wall.position.set( 0, 5, this.playingArea.top );
	wall.rotation.set( 0, -Math.PI, 0 );
	world.addWall( wall );

	// left wall ( right post blue goal )
	wall = new THREE.Mesh( wallSideGeometry, wallMaterial );
	wall.position.set( this.blueGoal.center.x, 5, ( distance * 0.5 ) + this.blueGoal.rightPost.z );
	wall.rotation.set( 0, Math.PI * 0.5, 0 );
	world.addWall( wall );

	// left wall ( left post blue goal )
	wall = new THREE.Mesh( wallSideGeometry, wallMaterial );
	wall.position.set( this.blueGoal.center.x, 5, ( distance * -0.5 ) + this.blueGoal.leftPost.z );
	wall.rotation.set( 0, Math.PI * 0.5, 0 );
	world.addWall( wall );
	
	// right wall ( right post red goal )
	wall = new THREE.Mesh( wallSideGeometry, wallMaterial );
	wall.position.set( this.redGoal.center.x, 5, ( distance * 0.5 ) + this.redGoal.rightPost.z );
	wall.rotation.set( 0, Math.PI * -0.5, 0 );
	world.addWall( wall );
	
	// right wall ( left post red goal )
	wall = new THREE.Mesh( wallSideGeometry, wallMaterial );
	wall.position.set( this.redGoal.center.x, 5, ( distance * -0.5 ) + this.redGoal.leftPost.z );
	wall.rotation.set( 0, Math.PI * -0.5, 0 );
	world.addWall( wall );
};

Pitch.REGIONS = {
	HORIZONTAL : 6,
	VERTICAL : 3
};

module.exports = Pitch;