/**
 * @file Graph node for use in creating a navigation graph. This node contains
 * the position of the node and a pointer to a GameEntity... useful if you want
 * your nodes to represent health packs, gold mines and the like.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );

var GraphNode = require( "./GraphNode" );
/**
 * Creates a graph node.
 * 
 * @constructor
 * 
 * @param {number} index - Every node has an index. A valid index is >= 0.
 * @param {THREE.Vector3} position - The node's position
 * @param {object} extraInfo - Often you will require a navgraph node to contain
 * additional information. For example a node might represent a pickup such as
 * armor in which case "extraInfo" could be an enumerated value denoting the
 * pickup type, thereby enabling a search algorithm to search a graph for
 * specific items. Going one step further, "extraInfo" could be a pointer to the
 * instance of the item type the node is twinned with. This would allow a search
 * algorithm to test the status of the pickup during the search.
 */
function NavGraphNode( index, position, extraInfo ) {

	GraphNode.call( this, index );

	Object.defineProperties( this, {
		position : {
			value : position || new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		extraInfo : {
			value : extraInfo || null,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

NavGraphNode.prototype = Object.create( GraphNode.prototype );
NavGraphNode.prototype.constructor = NavGraphNode;

/**
 * Clones the navigation edge. Used by digraphes.
 * 
 * @returns {NavGraphNode} The cloned edge.
 */
NavGraphNode.prototype.clone = function(){
	
	return new this.constructor().copy( this );
};

/**
 * Copies all values from one edge to an other.
 * 
 * @returns {NavGraphNode} The reference to the current edge.
 */
NavGraphNode.prototype.copy = function( source ){
	
	this.position.copy( source.position );
	this.extraInfo = source.extraInfo;
	
	return this;
};


module.exports = NavGraphNode;