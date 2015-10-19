/**
 * @file This prototype is a wrapper for the HTML5 User Timing API. It provides
 * a mechanism for accurate time measurement.
 * 
 * @author Human Interactive
 */

"use strict";

var system = require( "./System" );
var logger = require( "./Logger" );

/**
 * Creates a timing instance.
 * 
 * @constructor
 */
function Timing() {

}

/**
 * Stores a high resolution timestamp with the associated name.
 * 
 * @param {string} name - The name of the mark.
 */
Timing.prototype.mark = function( name ) {

	if ( system.isDevModeActive === true )
	{
		global.performance.mark( name );
	}

};

/**
 * Stores the time elapsed between two marks with the provided name.
 * 
 * @param {string} name - The name of the measurement.
 * @param {string} mark1 - The name of first mark.
 * @param {string} mark2 - The name of second mark.
 */
Timing.prototype.measure = function( name, mark1, mark2 ) {

	if ( system.isDevModeActive === true )
	{
		global.performance.measure( name, mark1, mark2 );

		// clear timestamps after measurement
		global.performance.clearMarks( mark1 );
		global.performance.clearMarks( mark2 );
	}

};

/**
 * Prints the given measurement to console.
 * 
 * @param {string} name - The name of the measurement.
 */
Timing.prototype.print = function( name ) {

	if ( system.isDevModeActive === true )
	{
		var entires = global.performance.getEntriesByName( name );

		logger.log( "INFO: Timing: Duration of %s: %f ms", entires[ 0 ].name, entires[ 0 ].duration );

		// clear measurement after logging
		global.performance.clearMeasures( name );
	}

};

module.exports = new Timing();