/**
 * @file Use this prototype to regulate code flow (e.g. for an update function).
 * Instantiate the prototype with the frequency you would like your code section
 * to flow (like 10 times per second) and then only allow the program flow to
 * continue if isReady() returns true.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

// the number of milliseconds the update period can vary per required
// update-step. This is here to make sure any multiple clients of this prototype
// have their updates spread evenly.
var updatePeriodVariator = 10;

/**
 * Creates a regulator instance.
 * 
 * @param {number} updatesPerSeconds - The update frequency.
 * 
 */
function Regulator( updatesPerSeconds ) {

	Object.defineProperties( this, {
		// the time period between updates
		_updatePeriod : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// the next time the regulator allows code flow
		_nextUpdateTime : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// the current timestamp
		_currentTime : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// setup initial timestamp
	this._nextUpdateTime = global.performance.now();

	// setup update period
	if ( updatesPerSeconds > 0 )
	{
		this._updatePeriod = 1000 / updatesPerSeconds;
	}
	else if ( updatesPerSeconds === 0 )
	{
		this._updatePeriod = 0;
	}
	else if ( updatesPerSeconds < 0 )
	{
		this._updatePeriod = -1;
	}
}

/**
 * Returns true if the current time exceeds the next update time.
 * 
 * @returns {boolean} Is the code allowed to flow?
 */
Regulator.prototype.isReady = function() {

	// if a regulator is instantiated with a zero frequency then it goes into
	// stealth mode (doesn't regulate)
	if ( this._updatePeriod === 0 )
	{
		return true;
	}

	// if the regulator is instantiated with a negative frequency then it will
	// never allow the code to flow
	if ( this._updatePeriod < 0 )
	{
		return false;
	}

	// retrieve timestamp
	this._currentTime = global.performance.now();

	// if the current timestamp is equal or greater than the "nextUpdateTime"
	// allow the code to flow
	if ( this._currentTime >= this._nextUpdateTime )
	{
		// calculate next update time
		this._nextUpdateTime = this._currentTime + this._updatePeriod + THREE.Math.randFloat( -updatePeriodVariator, updatePeriodVariator );

		return true;
	}

	return false;
};

module.exports = Regulator;