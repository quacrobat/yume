/**
 * @file Test file for "Interpolator".
 * 
 * @author Human Interactive
 */

"use strict";

var assert = require( "assert" );
var Interpolator = require( "../src/javascript/engine/particle/operator/Interpolator" );

describe( "Interpolator", function() {

	describe( "#getValue()", function() {

		it( "should return an interpolated value if there are at least two elements defined", function() {

			// create a new interpolator
			var interpolator = new Interpolator();

			// add some elements
			interpolator.addValue( 0.2, 3 );
			interpolator.addValue( 0.4, 7 );
			interpolator.addValue( 0.7, 20 );

			assert.equal( 3, interpolator.getValue( 0.1 ) );
			assert.equal( 3, interpolator.getValue( 0.2 ) );
			assert.equal( 5, interpolator.getValue( 0.3 ) );
			assert.equal( 7, interpolator.getValue( 0.4 ) );
			assert.equal( 20, interpolator.getValue( 0.7 ) );
			assert.equal( 20, interpolator.getValue( 0.9 ) );

		} );

		it( "should work with unsorted definition of values", function() {

			// create a new interpolator
			var interpolator = new Interpolator();

			// add some elements (unsorted)
			interpolator.addValue( 0.2, 3 );
			interpolator.addValue( 0.7, 20 );
			interpolator.addValue( 0.4, 7 );

			assert.equal( 3, interpolator.getValue( 0.1 ) );
			assert.equal( 3, interpolator.getValue( 0.2 ) );
			assert.equal( 5, interpolator.getValue( 0.3 ) );
			assert.equal( 7, interpolator.getValue( 0.4 ) );
			assert.equal( 20, interpolator.getValue( 0.7 ) );
			assert.equal( 20, interpolator.getValue( 0.9 ) );

		} );

	} );

} );