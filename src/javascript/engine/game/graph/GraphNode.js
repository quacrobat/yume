/**
 * @file Node prototype to be used with graphs.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates a graph node.
 * 
 * @constructor
 * 
 * @param {number} index - Every node has an index. A valid index is >= 0.
 */
function GraphNode( index ) {

	Object.defineProperties( this, {
		index : {
			value : ( index >= 0 ) ? index : GraphNode.INVALID_NODE_INDEX,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

GraphNode.INVALID_NODE_INDEX = -1;

module.exports = GraphNode;