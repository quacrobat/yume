/**
 * @file This prototype defines heuristic policies for use with the A* search
 * algorithm.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates the interface of a heuristic policy.
 * 
 * @constructor
 */
function HeuristicPolicy() {
}

/**
 * Calculates a heuristic estimate.
 * 
 * @param {number} node1 - The index of the first node.
 * @param {number} node2 - The index of the second node.
 * 
 * @returns {number} The heuristic estimate.
 */
HeuristicPolicy.prototype.calculate = function( node1, node2 ) {

	throw "ERROR: HeuristicPolicy: Policy needs to be implemented by inheriting prototype";
};

/**
 * Heuristic policy "Euclid"
 * -------------------------------------------------------------------------
 */

/**
 * Creates a euclidean heuristic (straight-line distance).
 * 
 * @constructor
 */
function HeuristicPolicyEuclid() {

	HeuristicPolicy.call( this );
}

HeuristicPolicyEuclid.prototype = Object.create( HeuristicPolicy.prototype );
HeuristicPolicyEuclid.prototype.constructor = HeuristicPolicyEuclid;

/**
 * Calculates the straight line distance from node1 to node2.
 * 
 * @param {SparseGraph} graph - A reference to the graph.
 * @param {number} node1 - The index of the first node.
 * @param {number} node2 - The index of the second node.
 * 
 * @returns {number} The heuristic estimate.
 */
HeuristicPolicyEuclid.prototype.calculate = function( graph, node1, node2 ) {

	return graph.getNode( node1 ).position.distanceTo( graph.getNode( node2 ).position );
};

/**
 * Heuristic policy "EuclidSq"
 * -------------------------------------------------------------------------
 */

/**
 * Creates a euclidean heuristic (straight-line distance in squared space).
 * 
 * @constructor
 */
function HeuristicPolicyEuclidSq() {

	HeuristicPolicy.call( this );
}

HeuristicPolicyEuclidSq.prototype = Object.create( HeuristicPolicy.prototype );
HeuristicPolicyEuclidSq.prototype.constructor = HeuristicPolicyEuclidSq;

/**
 * Calculates the straight line distance in squared space from node1 to node2.
 * 
 * @param {SparseGraph} graph - A reference to the graph.
 * @param {number} node1 - The index of the first node.
 * @param {number} node2 - The index of the second node.
 * 
 * @returns {number} The heuristic estimate.
 */
HeuristicPolicyEuclidSq.prototype.calculate = function( graph, node1, node2 ) {

	return graph.getNode( node1 ).position.distanceToSquared( graph.getNode( node2 ).position );
};

/**
 * Heuristic policy "Dijkstra"
 * -------------------------------------------------------------------------
 */

/**
 * You can use this class to turn the A* algorithm into Dijkstra's search. This
 * is because Dijkstra's is equivalent to an A* search using a heuristic value
 * that is always equal to zero.
 * 
 * @constructor
 */
function HeuristicPolicyDijkstra() {

	HeuristicPolicy.call( this );
}

HeuristicPolicyDijkstra.prototype = Object.create( HeuristicPolicy.prototype );
HeuristicPolicyDijkstra.prototype.constructor = HeuristicPolicyDijkstra;

/**
 * Returns always a zero value.
 * 
 * @param {SparseGraph} graph - A reference to the graph.
 * @param {number} node1 - The index of the first node.
 * @param {number} node2 - The index of the second node.
 * 
 * @returns {number} The heuristic estimate.
 */
HeuristicPolicyDijkstra.prototype.calculate = function( graph, node1, node2 ) {

	return 0;
};

module.exports = {
	Euclidean : new HeuristicPolicyEuclid(),
	EuclideanSq : new HeuristicPolicyEuclidSq(),
	Dijkstra : new HeuristicPolicyDijkstra()
};