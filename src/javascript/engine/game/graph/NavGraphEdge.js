/**
 * @file Prototype to define an edge connecting two navigation nodes.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */

"use strict";

var GraphEdge = require( "./GraphEdge" );

/**
 * Creates a navigation graph edge.
 * 
 * @constructor
 * 
 * @param {number} from - An edge connects two nodes. Valid node indices are always positive.
 * @param {number} to - An edge connects two nodes. Valid node indices are always positive.
 * @param {number} cost - The cost of traversing the edge
 * @param {number} flags - The type of action the player needs to do to solve this edge.
 * @param {number} id - If this edge intersects with an object (such as a door or lift), then this is that object's ID. 
 */
function NavGraphEdge( from, to, cost, flags, id ) {
	
	GraphEdge.call( this, from, to, cost );

	Object.defineProperties( this, {
		flags : {
			value : flags || NavGraphEdge.FLAGS.NORMAL,
			configurable : false,
			enumerable : true,
			writable : true
		},
		iDofIntersectingEntity : {
			value : id || -1,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

NavGraphEdge.prototype = Object.create( GraphEdge.prototype );
NavGraphEdge.prototype.constructor = NavGraphEdge;

/**
 * Clones the navigation edge. Used by digraphes.
 * 
 * @returns {NavGraphEdge} The cloned edge.
 */
NavGraphEdge.prototype.clone = function(){
	
	return new this.constructor().copy( this );
};

/**
 * Copies all values from one edge to an other.
 * 
 * @returns {NavGraphEdge} The reference to the current edge.
 */
NavGraphEdge.prototype.copy = function( source ){
	
	GraphEdge.prototype.copy.call( this, source );
	
	this.flags = source.flags;
	this.iDofIntersectingEntity = source.iDofIntersectingEntity;
	
	return this;
};

NavGraphEdge.FLAGS = {
	NORMAL : 0,
	SWIM : 1,
	CRAWL : 2,
	CREEP : 3,
	JUMP : 4,
	FLY : 5,
	GRAPPLE : 6,
	GOES_THROUGH_DOOR : 7,
};

module.exports = NavGraphEdge;