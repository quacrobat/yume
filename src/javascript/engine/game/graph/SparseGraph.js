/**
 * @file Graph prototype using the adjacency list representation.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates a sparse graph.
 * 
 * @constructor
 * 
 * @param {boolean} isDigraph - Is this a directed graph?
 */
function SparseGraph( isDigraph ) {

	Object.defineProperties( this, {
		// is this a directed graph?
		isDigraph : {
			value : isDigraph || false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the nodes that comprise this graph, organized in an associative array
		_nodes : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : true
		},
		// an associative array of adjacency edge list. (each node index keys
		// into the list of edges associated with that node)
		_edges : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : true
		},
		// the index of the next node to be added
		_nextNodeIndex : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

}

/**
 * Given a node this method first checks to see if the node has been added
 * previously but is now innactive. If it is, it is reactivated.
 * 
 * If the node has not been added previously, it is checked to make sure its
 * index matches the next node index before being added to the graph
 * 
 * @param {GraphNode} node - The node to add.
 * 
 * @returns {number} The index of the node.
 */
SparseGraph.prototype.addNode = function( node ) {

	if ( !this.isNodePresent( node.index ) )
	{
		// make sure the new node has been indexed correctly
		if ( node.index === this._nextNodeIndex )
		{
			this._nodes[ node.index ] = node;
			this._edges[ node.index ] = [];

			return this._nextNodeIndex++;
		}
		else
		{
			throw "ERROR: SparseGraph: Invalid node index. Unable to add node.";
		}

	}
	else
	{
		throw "ERROR: SparseGraph: Attempting to add a node with a duplicate index.";
	}
};

/**
 * Use this to add an edge to the graph. The method will ensure that the edge
 * passed as a parameter is valid before adding it to the graph. If the graph is
 * a digraph then a similar edge connecting the nodes in the opposite direction
 * will be automatically added.
 * 
 * @param {GraphEdge} edge - The edge to add.
 */
SparseGraph.prototype.addEdge = function( edge ) {

	var newEdge;

	// first make sure the from and to nodes exist within the graph and
	// both nodes are active before adding the edge
	if ( this.isNodePresent( edge.from ) && this.isNodePresent( edge.to ) )
	{
		// add the edge, first making sure it is unique
		if ( this._isEdgeUnique( edge.from, edge.to ) )
		{
			this._edges[ edge.from ].push( edge );
		}

		// if the graph is undirected we must add another connection in the
		// opposite direction
		if ( this.isDigraph === false )
		{
			// check to make sure the edge is unique before adding
			if ( this._isEdgeUnique( edge.to, edge.from ) )
			{
				// clone the edge
				newEdge = edge.clone();

				// change direction
				newEdge.from = edge.to;
				newEdge.to = edge.from;

				// add second edge
				this._edges[ edge.to ].push( newEdge );
			}
		}
	}
	else
	{
		throw "ERROR: SparseGraph: Invalid node indices of edge. Unable to add edge.";
	}

};

/**
 * Returns the reference to a specific node.
 * 
 * @param {number} index - The index of the node.
 * 
 * @returns {GraphNode} The reference to the node.
 */
SparseGraph.prototype.getNode = function( index ) {

	if ( this.isNodePresent( index ) )
	{
		return this._nodes[ index ];
	}
	else
	{
		throw "ERROR: SparseGraph: Invalid node index. Unable to get node.";
	}

};

/**
 * Returns the reference to a specific edge.
 * 
 * @param {number} from - The index of the first node.
 * @param {number} to -The index of the second node.
 * 
 * @returns {GraphEdge} The reference to the edge.
 */
SparseGraph.prototype.getEdge = function( from, to ) {
	
	var index, edge;

	// first, test if both node indices are present in the graph
	if ( this.isNodePresent( from ) && this.isNodePresent( to ) )
	{
		// then iterate over all edges of the "from" node and test, if "from/to"
		// is present in one single edge
		for ( index = 0; index <  this._edges[ from ].length; index++ )
		{
			edge = this._edges[ from ][ index ];
				
			if ( edge.to === to )
			{
				return edge;
			}
		}

		throw "ERROR: SparseGraph: From/to nodes are not connected to an edege.";
	}
	else
	{
		throw "ERROR: SparseGraph: Invalid from/to indices.";
	}
};

/**
 * Returns the edges outgoing of a node.
 * 
 * @param {number} from - The index the node.
 * 
 * @returns {object} An array of edges.
 */
SparseGraph.prototype.getEdgesOfNode = function( index ) {

	if ( this.isNodePresent( index ) )
	{
		return this._edges[ index ];
	}
	else
	{
		throw "ERROR: SparseGraph: Invalid node index. Unable to get edges of node.";
	}

};

/**
 * Returns the number of nodes present in the graph.
 * 
 * @returns {number} The total number of nodes.
 */
SparseGraph.prototype.getNumberOfNodes = function() {
	
	return Object.keys( this._nodes ).length;
};

/**
 * Returns the total number of edges present in the graph.
 * 
 * @returns {number} The total number of edges.
 */
SparseGraph.prototype.getNumberOfEdges = function() {

	var list, numberOfEdges = 0;

	// iterate over all edgeLists
	for ( list in this._edges )
	{
		if ( this._edges.hasOwnProperty( list ) )
		{
			// sum up the amount of edges
			numberOfEdges += this._edges[ list ].length;
		}
	}

	return numberOfEdges;
};

/**
 * Sets the cost of a specific edge.
 * 
 * @param {number} from - The index of the first node.
 * @param {number} to -The index of the second node.
 * @param {number} cost - The new cost to set.
 */
SparseGraph.prototype.setEdgeCost = function( from, to, cost ){
	
	var index, edge;
	
	// first, test if both node indices are present in the graph
	if ( this.isNodePresent( from ) && this.isNodePresent( to ) )
	{
		// determine the correct edge of the node's edge list
		for ( index = 0; index < this._edges[ from ].length; index++ )
		{
			edge = this._edges[ from ][ index ];

			if ( edge.to === to )
			{
				// assign the new cost
				edge.cost  = cost;
			}
		}
	}
	else
	{
		throw "ERROR: SparseGraph: Invalid from/to indices.";
	}
};

/**
 * Removes a node from the graph and removes any links to neighbouring nodes.
 * 
 * @param {number} index - The index of the node to remove.
 */
SparseGraph.prototype.removeNode = function( index ) {

	var i, j, edgeToNeighbor, edgeFromNeigbor;

	// if the node is present, delete it
	if ( this.isNodePresent( index ) )
	{
		delete this._nodes[ index ];

		// if the graph is not directed remove all edges leading to this node
		// and then clear the edges leading from the node
		if ( this.isDigraph === false )
		{
			// visit each neighbor and erase any edges leading to this node
			for ( i = 0; i < this._edges[ index ].length; i++ )
			{
				// this is a edge to a neighbor
				edgeToNeighbor = this._edges[ index ][ i ];

				// now iterate over all edges of the neighbor
				for ( j = 0; j < this._edges[ edgeToNeighbor.to ].length; j++ )
				{
					edgeFromNeigbor = this._edges[ edgeToNeighbor.to ][ j ];

					// if one of the edge leads to the specific node, remove the
					// edge from the list of the neighbor
					if ( edgeFromNeigbor.to === index )
					{
						this._edges[ edgeToNeighbor.to ].splice( j, 1 );

						break;
					}
				}
			}
		}
		else
		{
			// if a digraph remove the edges the slow way
			this._cullInvalidEdges();
		}
		
		// finally, clear this node's edges
		delete this._edges[ index ];
	}
	else
	{
		throw "ERROR: SparseGraph: Invalid node index. Unable to remove node.";
	}

};

/**
 * Removes the edge connecting "from" and "to" from the graph (if present). If a
 * digraph then the edge connecting the nodes in the opposite direction will
 * also be removed.
 * 
 * @param {number} from - The index of the first node.
 * @param {number} to -The index of the second node.
 */
SparseGraph.prototype.removeEdge = function( from, to ) {

	var index, currentEdge;

	// first, test if both node indices are present in the graph
	if ( this.isNodePresent( from ) && this.isNodePresent( to ) )
	{
		if ( this.isDigraph === false )
		{
			// delete the edge connecting the nodes in the opposite direction
			for ( index = 0; index < this._edges[ to ].length; index++ )
			{
				currentEdge = this._edges[ to ][ index ];

				if ( currentEdge.to === from )
				{
					this._edges[ to ].splice( index, 1 );
				}
			}
		}

		// delete the edge from the node's edge list
		for ( index = 0; index < this._edges[ from ].length; index++ )
		{
			currentEdge = this._edges[ from ][ index ];

			if ( currentEdge.to === to )
			{
				this._edges[ from ].splice( index, 1 );
			}
		}

	}
	else
	{
		throw "ERROR: SparseGraph: Invalid from/to indices.";
	}

};

/**
 * Removes all edges from the edge lists.
 */
SparseGraph.prototype.removeEdges = function() {
	
	var list;
	
	// iterate over all edgeLists
	for ( list in this._edges )
	{
		if ( this._edges.hasOwnProperty( list ) )
		{
			this._edges[list].length = 0;
		}
	}
};

/**
 * Clears the graph ready for new node insertions.
 */
SparseGraph.prototype.clear = function() {
	
	this._nodes = {};
	this._edges = {};
	this._nextNodeIndex = 0;
};

/**
 * Returns true if a node with the given index is present in the graph.
 * 
 * @param {number} index - The index of the node to check.
 * 
 * @returns {boolean} Is the node with the given index present in the graph?
 */
SparseGraph.prototype.isNodePresent = function( index ) {

	return this._nodes.hasOwnProperty( index );

};

/**
 * Returns true if an edge with the given "from/to" is present in the graph.
 * 
 * @param {number} from - The index of the first node.
 * @param {number} to -The index of the second node.
 * 
 * @returns {boolean} Is the edge with the given from/to present in the graph?
 */
SparseGraph.prototype.isEdgePresent = function( from, to ) {

	var index, edge;

	// first, test if both node indices are present in the graph
	if ( this.isNodePresent( from ) && this.isNodePresent( to ) )
	{
		// then iterate over all edges of the "from" node and test, if "from/to"
		// is present in one single edge
		for ( index = 0; index < this._edges[ from ].length; index++ )
		{
			edge = this._edges[ from ][ index ];

			if ( edge.to === to )
			{
				return true;
			}
		}

		return false;
	}
	else
	{
		return false;
	}

};

/**
 * Returns true if the edge is not present in the graph. Used when adding edges
 * to prevent duplication.
 * 
 * @param {number} from - The index of the first node.
 * @param {number} to -The index of the second node.
 * 
 * @returns {boolean} Is the edge unique?
 */
SparseGraph.prototype._isEdgeUnique = function( from, to ) {

	var index, edge;

	// iterate over all edges of the "from" node and test, if "from/to"
	// is present in one single edge
	for ( index = 0; index < this._edges[ from ].length; index++ )
	{
		edge = this._edges[ from ][ index ];

		if ( edge.to === to )
		{
			return false;
		}
	}

	return true;
};

/**
 * Iterates through all the edges in the graph and removes any that point to an
 * invalidated node.
 */
SparseGraph.prototype._cullInvalidEdges = function() {

	var list, index, edge;

	// iterate over all edge lists( edges per node )
	for ( list in this._edges )
	{
		if ( this._edges.hasOwnProperty( list ) )
		{
			// for each list, iterate over all edges
			for ( index = 0; index <  this._edges[list].length; index++ )
			{
				edge = this._edges[list][ index ];

				// if the from OR to index is invalid, delete the edge from
				// the list
				if ( !this._nodes.hasOwnProperty( edge.from ) || !this._nodes.hasOwnProperty( edge.to ) )
				{
					this._edges[list].splice( index, 1 );
				}

			}
		}
	}

};

module.exports = SparseGraph;