/**
 * @file Defines a rectangular region. A region has an identifying number, and
 * four corners. The y-value of any position in this region is in this prototype
 * always zero.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates a region.
 * 
 * @constructor
 * 
 * @param {number} id - The id of the region.
 * @param {number} top - The top side of the region.
 * @param {number} left - The left side of the region.
 * @param {number} right - The right side of the region.
 * @param {number} bottom - The bottom side of the region.
 * 
 */
function Region( top, right, left, bottom, id ) {

	Object.defineProperties( this, {
		id : {
			value : id || -1,
			configurable : false,
			enumerable : true,
			writable : true
		},
		top : {
			value : top || 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		right : {
			value : right || 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		left : {
			value : left || 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		bottom : {
			value : bottom || 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		width : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		height : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		length : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		breadth : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		center : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		}
	} );

	// calculate dimensions
	this.width  = Math.abs( this.right - this.left );
	this.height = Math.abs( this.top - this.bottom );

	// calculate center of region
	this.center.x = ( this.right + this.left ) * 0.5;
	this.center.z = ( this.top + this.bottom ) * 0.5;
	
	// calculate shortest and longest side
	this.length  = Math.max( this.width, this.height );
	this.breadth = Math.min( this.width, this.height );
}

/**
 * Returns a vector representing a random location within the region.
 * 
 * @returns {THREE.Vector3} A random position inside the region.
 */
Region.prototype.getRandomPosition = function() {

	return new THREE.Vector3( THREE.Math.randFloat( this.left, this.right ), 0, THREE.Math.randFloat( this.top, this.bottom ) );
};

/**
 * Returns true if the given position lays inside the region. The
 * "isHalfSize" can be used to contract the region boundaries.
 * 
 * @param {THREE.Vector3} position -The position vector to test.
 * @param {boolean} isHalfSize - Should the calculation use the half size of the
 * region?
 * 
 * @returns {boolean} Is the position inside the region?
 */
Region.prototype.isInside = function( position, isHalfSize ) {

	var marginX, marginY;

	if ( isHalfSize === true )
	{
		marginX = this.width * 0.25;
		marginY = this.height * 0.25;

		return ( ( position.x > ( this.left + marginX ) ) && 
				 ( position.x < ( this.right - marginX ) ) && 
				 ( position.z > ( this.bottom + marginY ) ) && 
				 ( position.z < ( this.top - marginY ) ) );
	}
	else
	{
		return ( ( position.x > this.left ) && 
				 ( position.x < this.right ) && 
				 ( position.z > this.bottom ) && 
				 ( position.z < this.top ) );
	}
};

module.exports = Region;