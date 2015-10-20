/**
 * @file Prototype to determine the best spots for a supporting soccer player to
 * move to.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var Regulator = require( "../../core/Regulator" );
var world = require( "../../core/World" );
var system = require( "../../core/System" );

var PlayerBase = require( "./PlayerBase" );

/**
 * Creates a SupportSpotCalculator.
 * 
 * @param {Team} team - A reference to the soccer team.
 * @param {boolean} isLeftSide - This value indicates, if the team is on the
 * left side of the pitch.
 */
function SupportSpotCalculator( team, isLeftSide ) {

	Object.defineProperties( this, {
		team : {
			value : team,
			configurable : false,
			enumerable : true,
			writable : false
		},
		isLeftSide : {
			value : isLeftSide,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// an array to manage all spots
		_spots : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// a reference to the highest valued spot from the last update
		_bestSupportSpot : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this will regulate how often the spots are calculated (default is one
		// update per second)
		_regulator : {
			value : new Regulator( SupportSpotCalculator.UPDATE_FREQUENCY ),
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );

	this._calculateSupportingSpots();
}

/**
 * This method calculates the positions of all spots, creates them and stores
 * them in the internal array.
 */
SupportSpotCalculator.prototype._calculateSupportingSpots = function() {

	var playingField = this.team.pitch.playingArea;

	// the dimensions of the spot region is derived from the playing field
	var widthOfSpotRegion = playingField.width * 0.9;
	var heightOfSpotRegion = playingField.height * 0.8;

	// calculate the dimensions per spot
	var sliceX = widthOfSpotRegion / SupportSpotCalculator.SPOTS_X;
	var sliceY = heightOfSpotRegion / SupportSpotCalculator.SPOTS_Y;

	// calculate offsets
	var top = playingField.top - ( ( playingField.height - heightOfSpotRegion ) * 0.5 ) - ( sliceY * 0.5 );
	var right = playingField.right - ( ( playingField.width - widthOfSpotRegion ) * 0.5 ) - ( sliceX * 0.5 );
	var left = playingField.left + ( ( playingField.width - widthOfSpotRegion ) * 0.5 ) + ( sliceX * 0.5 );

	// create the spots for the respective team. the spots are always located in
	// the
	// opposing part of the soccer pitch.
	for ( var x = 0; x < ( SupportSpotCalculator.SPOTS_X * 0.5 ) - 1; x++ )
	{
		for ( var y = 0; y < SupportSpotCalculator.SPOTS_Y; y++ )
		{
			if ( this.isLeftSide === true )
			{
				this._spots.push( {
					position : new THREE.Vector3( left + ( x * sliceX ), 0, top - ( y * sliceY ) ),
					score : 0
				} );
			}
			else
			{
				this._spots.push( {
					position : new THREE.Vector3( right - ( x * sliceX ), 0, top - ( y * sliceY ) ),
					score : 0
				} );
			}
		}
	}

	// add helpers in dev mode
	if ( system.isDevModeActive === true )
	{
		var helper;
		var spotGeometry = new THREE.CircleGeometry( 0.5, 10 );

		for ( var index = 0; index < this._spots.length; index++ )
		{
			helper = new THREE.Mesh( spotGeometry,  new THREE.MeshBasicMaterial( {color : 0xf3f4f6} ) );
			helper.position.copy( this._spots[ index ].position );
			helper.position.y += 0.1;
			helper.rotation.set( Math.PI * -0.5, 0, 0 );
			world.addObject3D( helper );
			this._spots[ index ].helper = helper;
		}

	}
};

/**
 * This method iterates through each possible spot and calculates its score.
 * 
 * @returns {THREE.Vector3} The best supporting spot on the soccer pitch.
 */
SupportSpotCalculator.prototype.calculateBestSupportingPosition = ( function() {

	var shotTarget = new THREE.Vector3();

	return function() {
		
		var spot, distance, temp;
		
		// this will be used to track the best supporting spot
		var bestScoreSoFar = 0;

		if ( !this._regulator.isReady() && this._bestSupportSpot !== null )
		{
			return this._bestSupportSpot.position;
		}

		// reset the best supporting spot
		this._bestSupportSpot = null;

		for ( var index = 0; index < this._spots.length; index++ )
		{
			spot = this._spots[ index ];

			// first remove any previous score
			spot.score = 0;
			
			// reset color in dev mode
			if ( system.isDevModeActive === true )
			{
				spot.helper.material.color = new THREE.Color( 0xf3f4f6 );
			}

			// Test 1. is it possible to make a safe pass from the ball's
			// position to this position?
			if ( this.team.isPassSafeFromAllOpponents( this.team.controllingPlayer.object3D.position, spot.position, null, PlayerBase.CONFIG.PLAYER_MAX_PASSING_FORCE ) )
			{
				spot.score += SupportSpotCalculator.SCORE.CAN_PASS;
			}

			// Test 2. determine if a goal can be scored from this position
			if ( this.team.isShootPossible( spot.position, PlayerBase.CONFIG.PLAYER_MAX_SHOOTING_FORCE, shotTarget ) )
			{
				spot.score += SupportSpotCalculator.SCORE.CAN_SCORE;
			}

			// Test 3. calculate how far this spot is away from the controlling
			// player. The further away, the higher the score. Any distances
			// further away than optimalDistance do not receive a score
			if ( this.team.supportingPlayer !== null )
			{
				distance = this.team.controllingPlayer.object3D.position.distanceTo( spot.position );

				temp = Math.abs( SupportSpotCalculator.OPT_DISTANCE - distance );

				if ( temp < SupportSpotCalculator.OPT_DISTANCE )
				{
					// normalize the distance and add it to the score
					spot.score += SupportSpotCalculator.SCORE.DISTANCE_SCORE * ( SupportSpotCalculator.OPT_DISTANCE - temp ) / SupportSpotCalculator.OPT_DISTANCE;
				}
			}

			// check to see if this spot has the highest score so far
			if ( spot.score > bestScoreSoFar )
			{
				bestScoreSoFar = spot.score;
				
				this._bestSupportSpot = spot;
			}
			
		} // next spot
		
		// highlight the best supporting spot in dev mode
		if ( system.isDevModeActive === true )
		{
			this._bestSupportSpot.helper.material.color = new THREE.Color( 0x20252f );
		}

		return this._bestSupportSpot.position;
	};

}() );

/**
 * Returns the best supporting spot if there is one. If one hasn't been
 * calculated yet, this method calls determineBestSupportingPosition and returns
 * the result.
 * 
 * @returns {THREE.Vector3} The best supporting spot on the soccer pitch.
 */
SupportSpotCalculator.prototype.getBestSupportingSpot = function() {

	if ( this._bestSupportSpot === null )
	{
		return this.calculateBestSupportingPosition();
	}
	else
	{
		return this._bestSupportSpot.position;
	}
};

SupportSpotCalculator.SCORE = {
		CAN_PASS : 2,
		CAN_SCORE : 1,
		DISTANCE_SCORE : 2
};

SupportSpotCalculator.UPDATE_FREQUENCY = 1;
SupportSpotCalculator.SPOTS_X = 13;
SupportSpotCalculator.SPOTS_Y = 6;
SupportSpotCalculator.OPT_DISTANCE = 20;

module.exports = SupportSpotCalculator;