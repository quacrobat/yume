/**
 * @file This prototype will be used to manipulate vectors with an oscillation
 * animation. This operator can be used to create a wavy particle effects.
 * 
 * @author Human Interactive
 */

"use strict";

var utils = require( "../../etc/Utils" );

/**
 * Creates an oscillator.
 * 
 * @constructor
 * 
 * @param {number} amplitude - The amplitude of the oscillator.
 * @param {number} period - The time period of a single wave in seconds.
 * @param {number} offset - The offset of the oscillator curve.
 */
function Oscillator( amplitude, period, offset ) {

	Object.defineProperties( this, {

		amplitude : {
			value : amplitude || 1,
			configurable : false,
			enumerable : false,
			writable : false
		},
		period : {
			value : period || 1,
			configurable : false,
			enumerable : false,
			writable : false
		},
		offset : {
			value : offset || 0,
			configurable : false,
			enumerable : false,
			writable : false
		}

	} );

}

/**
 * Calculates the value of the oscillation animation.
 * 
 * @param {number} elapsedTime - The elapsed time.
 *  
 * @returns {number} The calculated value.
 */
Oscillator.prototype.getValue = function( elapsedTime ){
	
	return ( this.amplitude * Math.sin( ( elapsedTime * utils.TWO_PI ) / this.period ) ) + this.offset;
};

module.exports = Oscillator;