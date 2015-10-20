/**
 * @file Prototype to help calculate the average value of a history of vector
 * values.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates a new smoother.
 * 
 * @constructor
 * 
 * @param {number} numberOfSamples - How many samples the smoother will use to
 * average a value.
 */
function Smoother( numberOfSamples ) {

	Object.defineProperties( this, {
		_numberOfSamples : {
			value : numberOfSamples || 10,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_history : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		_slot : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// initialize history with objects
	for ( var index = 0; index < this._numberOfSamples; index++ )
	{
		this._history[ index ] = new THREE.Vector3();
	}
}

/**
 * Each time you want to get a new average, feed it the most recent value and
 * this method will return an average over the last numberOfSamples updates.
 * 
 * @param {THREE.Vector3} mostRecentValue - The most recent value to add.
 * @param {THREE.Vector3} average - The target average vector.
 */
Smoother.prototype.update = function( mostRecentValue, average ) {

	// ensure, average is a zero vector
	average.set( 0, 0, 0 );

	// make sure the slot index wraps around
	if ( this._slot === this._numberOfSamples )
	{
		this._slot = 0;
	}

	// overwrite the oldest value with the newest
	this._history[ this._slot ].copy( mostRecentValue );

	// increase slot index
	this._slot++;

	// now calculate the average of the history array
	for ( var index = 0; index < this._numberOfSamples; index++ )
	{
		average.add( this._history[ index ] );
	}

	average.divideScalar( this._numberOfSamples );

};

module.exports = Smoother;