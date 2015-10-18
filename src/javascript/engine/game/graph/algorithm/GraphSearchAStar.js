/**
 * @file Prototype to implement the A* search algorithm.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */

"use strict";

var algorithmHelper = require( "./AlgorithmHelper" );

var GraphNode = require( "../GraphNode" );
var GraphEdge = require( "../GraphEdge" );

/**
 * Creates a instance of the A* search algorithm.
 * 
 * @constructor
 * 
 * @param {SparseGraph} graph - A reference to the graph to be searched.
 * @param {number} source - The source node index.
 * @param {number} target - The target node index.
 * @param {AStarHeuristicPolicy} heuristic - A heuristic policy for use with the A* algorithm.
 */
function GraphSearchAStar( graph, source, target, heuristic ) {

	Object.defineProperties( this, {
		_graph : {
			value : graph,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_heuristic : {
			value : heuristic,
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
		// this array contains the edges that comprise the shortest path tree -
		// a directed sub-tree of the graph that encapsulates the best paths
		// from every node on the SPT to the source node
		_shortestPathTree : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : true
		},
		// contains the "real" accumulative cost to a node
		_GCosts : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : true
		},
		// contains the cost from adding this._GCosts[n] to the heuristic cost
		// from n to the target node.
		_FCosts : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this is an indexed (by node) object of "parent" edges leading to
		// nodes connected to the SPT but that have not been added to the SPT
		// yet. This is a little like the stack or queue used in BST and DST
		// searches.
		_searchFrontier : {
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
GraphSearchAStar.prototype.getPathToTarget = function() {

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
	while ( ( currentNode !== this._source ) )
	{
		// determine the parent of the current node
		currentNode = this._shortestPathTree[ currentNode ].from;

		// push the new current node at the beginning of the array
		path.unshift( currentNode );
	}

	return path;
};

/**
 * Returns the array of edges that defines the SPT. If a target was given in the
 * constructor then this will be an SPT comprising of all the nodes examined
 * before the target was found, else it will contain all the nodes in the graph.
 * 
 * @returns {object} An array with edges the search has examined.
 */
GraphSearchAStar.prototype.getSearchTree = function() {
	
	var object = this._shortestPathTree;

	// this will return an array, converted from an object
	return Object.keys( object ).map( function( key ) {

		return object[ key ];
	} );
};

/**
 * Returns the total cost to the target.
 * 
 * @returns {number} The total cost to the target.
 */
GraphSearchAStar.prototype.getCostToTarget = function() {

	return this._GCosts[ this._target ];
};

/**
 * Returns the total cost to the given node
 * 
 * @param {number} index - The index of the node.
 * 
 * @returns {number} The total cost to the given node.
 */
GraphSearchAStar.prototype.getCostToNode = function( index ) {

	return this._GCosts[ index ];
};

/**
 * This method performs the A* algorithm.
 * 
 * @returns {boolean} Is a path found to the target?
 */
GraphSearchAStar.prototype._search = function() {

	var i, j, nextClosestNode, outgoingEdges, edge, HCost, GCost, FCost;

	// create a queue(FIFO) of objects, in JavaScript done via an array.
	// the objects in this queue will be sorted smallest to largest cost.
	var queue = [];

	// put the source node on the queue
	queue.push( {
		cost : 0,
		nodeIndex : this._source
	} );

	// while the queue is not empty
	while ( queue.length > 0 )
	{
		// get lowest cost node from the queue. Don't forget, the return value
		// is a node index, not the node itself. This node is the node not
		// already on the SPT that is the closest to the source node
		nextClosestNode = queue.shift().nodeIndex;

		// move this edge from the frontier to the shortest path tree
		if ( this._searchFrontier.hasOwnProperty( nextClosestNode ) === true )
		{
			this._shortestPathTree[ nextClosestNode ] = this._searchFrontier[ nextClosestNode ];
		}

		// if the target has been found exit
		if ( nextClosestNode === this._target )
		{
			return true;
		}

		// now relax the edges
		outgoingEdges = this._graph.getEdgesOfNode( nextClosestNode );

		for ( i = 0; i < outgoingEdges.length; i++ )
		{
			edge = outgoingEdges[ i ];
			
			// A* cost formula : F = G + H
			
			// H is the heuristic estimate of the distance to the target
			HCost = this._heuristic.calculate( this._graph, this._target, edge.to );

			// G is the cumulative cost to reach a node
			GCost = ( this._GCosts[ nextClosestNode ] || 0 ) + edge.cost;
			
			// F is the sum of G and H
			FCost = GCost + HCost;

			// if the node has not been added to the frontier, add it and update
			// the G and F costs
			if ( this._searchFrontier.hasOwnProperty( edge.to ) === false )
			{
				this._FCosts[ edge.to ] = FCost;
				this._GCosts[ edge.to ] = GCost;

				this._searchFrontier[ edge.to ] = edge;

				queue.push( {
					cost : FCost,
					nodeIndex : edge.to
				} );

				queue.sort( algorithmHelper.sortQueueByCost );
			}

			// else test to see if the cost to reach the destination node via
			// the current node is cheaper than the cheapest cost found so far.
			// If this path is cheaper, update its entry in the queue to reflect
			// the change, update the cost of the destination node and add the
			// edge to the frontier
			else if ( ( GCost < this._GCosts[ edge.to ] ) && ( this._shortestPathTree.hasOwnProperty( edge.to ) === false ) )
			{
				this._FCosts[ edge.to ] = FCost;
				this._GCosts[ edge.to ] = GCost;

				this._searchFrontier[ edge.to ] = edge;
				
				algorithmHelper.updateEntryInQueue( queue, edge.to, FCost );
			}
			
		} // next edge
	}
	
	// no path to target
	return false;
};

module.exports = GraphSearchAStar;