/**
 * @file Prototype to implement a depth first search.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */

"use strict";

var GraphNode = require( "../GraphNode" );
var GraphEdge = require( "../GraphEdge" );

/**
 * Creates a instance of the depth first search.
 * 
 * @constructor
 * 
 * @param {SparseGraph} graph - A reference to the graph to be searched.
 * @param {number} source - The source node index.
 * @param {number} target - The target node index.
 */
function GraphSearchDFS( graph, source, target ) {

	Object.defineProperties( this, {
		_graph : {
			value : graph,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_source : {
			value : ( source >= 0 ) ? source : GraphNode.INVALID_NODE_INDEX,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_target : {
			value : ( target >= 0 ) ? target : GraphNode.INVALID_NODE_INDEX,
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this records the indexes of all the nodes that are visited as the
		// search progresses
		_visited : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this holds the route taken to the target. Given a node index, the
		// value at that index is the node's parent.
		_route : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : true
		},
		// true if a path to the target has been found
		isFound : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
	
	// execute search
	this.isFound = this._search();
}

/**
 * Returns an array of node indices that comprise the shortest path from the
 * source to the target.
 * 
 * @returns {object} The path as an array with node indices.
 */
GraphSearchDFS.prototype.getPathToTarget = function() {

	var currentNode, path = [];

	// just return an empty path if no path to target found or if no target has
	// been specified
	if ( this.isFound === false || this._target < 0 )
	{
		return path;
	}

	// start with the target of the path
	path.unshift( currentNode = this._target );

	// while the current node is not the source node keep processing
	while ( currentNode !== this._source )
	{
		// determine the parent of the current node
		currentNode = this._route[ currentNode ];

		// push the new current node at the beginning of the array
		path.unshift( currentNode );
	}

	return path;
};

/**
 * This method performs the DFS search.
 * 
 * @returns {boolean} Is a path found to the target?
 */
GraphSearchDFS.prototype._search = function() {

	var index, nextEdge, outgoingEdges;

	// create a stack(LIFO) of edges, in JavaScript done via an array
	var stack = [];

	// create a dummy edge and put on the stack
	stack.push( new GraphEdge( this._source, this._source, 0 ) );

	// while there are edges in the stack keep searching
	while ( stack.length > 0 )
	{
		// grab the next edge and remove it from the stack
		nextEdge = stack.pop();

		// make a note of the parent of the node this edge points to
		this._route[ nextEdge.to ] = nextEdge.from;

		// and mark it visited
		this._visited[ nextEdge.to ] = true;

		// if the target has been found the method can return success
		if ( nextEdge.to === this._target )
		{
			return true;
		}
		
		// determine outgoing edges
		outgoingEdges = this._graph.getEdgesOfNode( nextEdge.to );

		// push the edges leading from the node this edge points to onto the
		// stack (provided the edge does not point to a previously visited node)
		for ( index = 0; index < outgoingEdges.length; index++ )
		{
			if ( this._visited[ outgoingEdges[ index ].to ] !== true )
			{
				stack.push( outgoingEdges[ index ] );
			}
			
		} // next edge
	}
	
	// no path to target
	return false;
};

module.exports = GraphSearchDFS;