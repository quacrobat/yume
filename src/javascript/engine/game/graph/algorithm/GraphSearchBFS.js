/**
 * @file Prototype to implement a breadth first search.
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
 * Creates a instance of the breadth first search.
 * 
 * @constructor
 * 
 * @param {SparseGraph} graph - A reference to the graph to be searched.
 * @param {number} source - The source node index.
 * @param {number} target - The target node index.
 */
function GraphSearchBFS( graph, source, target ) {

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
		// As the search progresses, this will hold all the edges the algorithm
		// has examined. THIS IS NOT NECESSARY FOR THE SEARCH, IT IS HERE PURELY
		// TO PROVIDE THE USER WITH SOME VISUAL FEEDBACK
		_spanningTree : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
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
GraphSearchBFS.prototype.getPathToTarget = function() {

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
 * Returns an array containing references to all the edges the search has examined.
 * 
 * @returns {object} An array with edges the search has examined.
 */
GraphSearchBFS.prototype.getSearchTree = function() {

	return this._spanningTree;
};

/**
 * This method performs the BFS search.
 * 
 * @returns {boolean} Is a path found to the target?
 */
GraphSearchBFS.prototype._search = function() {

	var index, nextEdge, outgoingEdges;

	// create a queue(FIFO) of edges, in JavaScript done via an array
	var queue = [];

	// create a dummy edge and put on the queue
	var dummy = new GraphEdge( this._source, this._source, 0 );
	queue.push( dummy );

	// while there are edges in the queue keep searching
	while ( queue.length > 0 )
	{
		// grab the first edge and remove it from the queue
		nextEdge = queue.shift();

		// make a note of the parent of the node this edge points to
		this._route[ nextEdge.to ] = nextEdge.from;
		
		// put it on the tree. (making sure the dummy edge is not placed on the tree)
		if ( !nextEdge.isEqual( dummy ) )
		{
			this._spanningTree.unshift( nextEdge );
		}

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
			// if the node hasn't already been visited we can push the
			// edge onto the queue
			if ( this._visited[ outgoingEdges[ index ].to ] !== true )
			{
				queue.push( outgoingEdges[ index ] );

				// and mark it visited
				this._visited[ outgoingEdges[ index ].to ] = true;
			}
			
		} // next edge
	}

	// no path to target
	return false;
};

module.exports = GraphSearchBFS;