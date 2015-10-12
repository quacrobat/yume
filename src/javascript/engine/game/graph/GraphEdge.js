/**
 * @file Prototype to define an edge connecting two nodes. An edge has an
 * associated cost.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates a graph edge.
 * 
 * @constructor
 * 
 * @param {number} from - An edge connects two nodes. Valid node indices are always positive.
 * @param {number} to - An edge connects two nodes. Valid node indices are always positive.
 * @param {number} cost - The cost of traversing the edge
 */
function GraphEdge( from, to, cost ) {

	Object.defineProperties( this, {
		from : {
			value : from,
			configurable : false,
			enumerable : true,
			writable : true
		},
		to : {
			value : to,
			configurable : false,
			enumerable : true,
			writable : true
		},
		cost : {
			value : cost,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

/**
 * Tests, if two edges are equal.
 * 
 * @param {GraphEdge} edgeToCompare - The edge to compare.
 * 
 * @returns {boolean} Are both edges equal?
 */
GraphEdge.prototype.isEqual = function( edgeToCompare ) {

	return this.from === edgeToCompare.from && 
		   this.to === edgeToCompare.to && 
		   this.cost === edgeToCompare.cost;
};

/**
 * Clones the edge. Used by digraphes.
 * 
 * @returns {GraphEdge} The cloned edge.
 */
GraphEdge.prototype.clone = function(){
	
	return new this.constructor().copy( this );
};

/**
 * Copies all values from one edge to an other.
 * 
 * @returns {GraphEdge} The reference to the current edge.
 */
GraphEdge.prototype.copy = function( source ){
	
	this.from = source.from;
	this.to = source.to;
	this.cost = source.cost;
	
	return this;
};

module.exports = GraphEdge;