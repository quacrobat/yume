/**
 * @file This prototype will be used to interpolate within a predefined set of
 * values. There must be added at least two values for interpolation.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates an interpolator.
 * 
 * @constructor
 */
function Interpolator() {

	Object.defineProperties( this, {

		// alpha values are stored in a sortable array
		_alpha : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the actual values are stored in an object. access via respective
		// alpha value
		_values : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : false
		}

	} );

}

/**
 * Adds a value to the internal map.
 * 
 * @param {number} alpha - This value determines the interpolation.
 * @param {object} value - The actual value. Can be a number, THREE.Vector or
 * THREE.Color.
 */
Interpolator.prototype.addValue = function( alpha, value ) {

	// store the alpha value and sort the array
	this._alpha.push( alpha );
	this._alpha.sort();

	// store the value
	this._values[ alpha ] = value;
};

/**
 * Returns an interpolated value at a given alpha value. If the internal values
 * are objects, the "target" parameter must be used to obtain a result, because
 * the method won't create new objects for performance reasons.
 * 
 * @param {number} alpha - This value determines the interpolation.
 * @param {object} target - The target object. Not used for primitive values.
 */
Interpolator.prototype.getValue = function( alpha, target ) {

	var result, index, alphaStart, alphaEnd, ratio, valueStart, valueEnd;

	// iterate over all map entries to determine the closest values for the
	// given alpha value (in other words: start and end value for interpolation)
	for ( index = 0; index < this._alpha.length; index++ )
	{
		if ( this._alpha[ index ] <= alpha )
		{
			alphaStart = this._alpha[ index ];
		}

		if ( this._alpha[ index ] > alpha )
		{
			alphaEnd = this._alpha[ index ];
			break;
		}
	}

	// case 1: the given alpha value is smaller than all alpha values in the
	// map
	if ( alphaStart === undefined )
	{
		// no interpolation, just return the first value of the map
		result = this._values[ this._alpha[ 0 ] ];

		if ( target !== undefined )
		{
			target.copy( result );
			return;
		}
		else
		{
			return result;
		}
	}

	// case 2: the given alpha value is greater than all alpha values in the
	// map
	if ( alphaEnd === undefined )
	{
		// no interpolation, just return the last value of the map
		result = this._values[ this._alpha[ this._alpha.length - 1 ] ];

		if ( target !== undefined )
		{
			target.copy( result );
			return;
		}
		else
		{
			return result;
		}
	}

	// case 3: the given alpha value lies between two values of the map.
	// interpolation required
	ratio = ( alpha - alphaStart ) / ( alphaEnd - alphaStart );

	valueStart = this._values[ alphaStart ];
	valueEnd = this._values[ alphaEnd ];

	if ( target !== undefined )
	{
		target.copy( valueStart ).lerp( valueEnd, ratio );
		return;
	}
	else
	{
		return valueStart * ( 1 - ratio ) + ( valueEnd * ratio );
	}

};

module.exports = Interpolator;