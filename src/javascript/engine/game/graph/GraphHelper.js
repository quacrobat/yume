/**
 * @file Some useful functions you can use with graphs.
 * 
 * see: "Programming Game AI by Example", Chapter: "The Secret Life of Graphs",
 * by Mat Buckland
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var NavGraphNode = require( "./NavGraphNode" );
var NavGraphEdge = require( "./NavGraphEdge" );

var world = require( "../../core/World" );

/**
 * Creates a graph helper.
 * 
 * @constructor
 */
function GraphHelper() {

}

/**
 * Creates a graph based on a grid layout.
 * 
 * @param {SparseGraph} graph - The graph object.
 * @param {THREE.Vector2} dimension - The dimension of the grid.
 * @param {number} offset - The offset between nodes.
 */
GraphHelper.prototype.generateGridLayout = function( graph, dimension, offset ) {

	// first create all the nodes
	generateNodesGridLayout( graph, dimension, offset );

	// now to calculate the edges.
	generateEdges( graph, offset );

};

/**
 * Creates a helper object to visualize the grid. 
 * 
 * @param {THREE.Vector2} dimension - The dimension of the grid.
 * @param {number} offset - The offset between nodes.
 * @param {THREE.Color} color - The color of the grid.
 */
GraphHelper.prototype.createGridHelper = function( dimension, offset, color ) {

	var grid, gridSize, i;

	// increase the dimensions, because the nodes should be in the center
	// of a grid cell
	gridSize = dimension.clone();
	gridSize.addScalar( offset * 0.5 );

	// mesh properties
	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial( {
		color : color || new THREE.Color( 0xffffff )
	} );

	// generate vertices for the grid
	for ( i = -gridSize.x; i <= gridSize.x; i += offset )
	{
		geometry.vertices.push( new THREE.Vector3( i, 0.01, -gridSize.y ), new THREE.Vector3( i, 0.01, gridSize.y ) );
	}

	for ( i = -gridSize.y; i <= gridSize.y; i += offset )
	{
		geometry.vertices.push( new THREE.Vector3( -gridSize.x, 0.01, i ), new THREE.Vector3( gridSize.x, 0.01, i ) );
	}

	// create the lines
	grid = new THREE.LineSegments( geometry, material );

	// prevent auto update
	grid.matrixAutoUpdate = false;
	grid.updateMatrix();

	world.addObject3D( grid );

};

/**
 * Creates helper objects to visualize the nodes. 
 * 
 * @param {SparseGraph} graph - The graph object.
 * @param {THREE.Color} color - The color of the edges.
 * @param {number} size - The size of the helpers.
 */
GraphHelper.prototype.createNodeHelper = function( graph, color, size ) {
	
	var geometry = new THREE.PlaneBufferGeometry( size || 1, size || 1, 1, 1 );

	var mesh, i;

	// create for each node position a mesh as visual feedback
	for ( i = 0; i < graph.getNumberOfNodes(); i++ )
	{
		mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {
			color : color || new THREE.Color( 0xffffff ),
			side : THREE.DoubleSide
		} ) );

		// adjust mesh
		mesh.position.copy( graph.getNode( i ).position );
		mesh.rotation.set( Math.PI * -0.5, 0, 0 );
		
		// save a reference to the node
		// used for intersection tests
		mesh.userData.nodeIndex = i;

		// prevent auto update
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix();

		world.addObject3D( mesh );
	}
};

/**
 * Creates a helper object to visualize the edges. 
 * 
 * @param {SparseGraph} graph - The graph object.
 * @param {THREE.Color} color - The color of the edges.
 */
GraphHelper.prototype.createEdgeHelper = function( graph, color ) {

	var start, end, edges, lines, i, j;

	// mesh properties
	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial( {
		color : color || new THREE.Color( 0xffffff )
	} );

	// iterate over all nodes
	for ( i = 0; i < graph.getNumberOfNodes(); i++ )
	{
		// get edges of the current node
		edges = graph.getEdgesOfNode( i );

		// extract the position of from/to and store them into the geometry for
		// the linesegements
		for ( j = 0; j < edges.length; j++ )
		{
			start = graph.getNode( edges[ j ].from ).position.clone();
			end = graph.getNode( edges[ j ].to ).position.clone();
			
			// lift the lines a bit
			start.y += 0.01;
			end.y += 0.01;
			
			// store the vertices in the geometry
			geometry.vertices.push( start, end );
		}
	}

	// create the lines
	lines = new THREE.LineSegments( geometry, material );

	// prevent auto update
	lines.matrixAutoUpdate = false;
	lines.updateMatrix();

	world.addObject3D( lines );
};

module.exports = new GraphHelper();

/**
 * Generates nodes based on a grid layout.
 * 
 * @param {SparseGraph} graph - The graph object.
 * @param {THREE.Vector2} dimension - The dimension of the grid.
 * @param {number} offset - The offset between nodes.
 */
function generateNodesGridLayout( graph, dimension, offset ) {

	var i, j;

	for ( i = -dimension.x; i <= dimension.x; i += offset )
	{
		for ( j = -dimension.y; j <= dimension.y; j += offset )
		{
			graph.addNode( new NavGraphNode( graph.getNextFreeNodeIndex(), new THREE.Vector3( i, 0, j ) ) );
		}
	}
}

/**
 * Generates edges based on existing nodes in the graph.
 * 
 * @param {SparseGraph} graph - The graph object.
 * @param {number} offset - The offset between nodes.
 */
function generateEdges( graph, offset ) {

	var i, j, node, neighbor, distance;

	// this will be used to determine the adjacent nodes
	var boundingSphere = new THREE.Sphere();

	// the radius is the length of the diagonal of a node area plus a little
	// buffer
	boundingSphere.radius = offset * Math.SQRT2 + 0.01;

	// iterate over all nodes
	for ( i = 0; i < graph.getNumberOfNodes(); i++ )
	{
		// retrieve node
		node = graph.getNode( i );

		// set the position of the bounding sphere to the current node
		boundingSphere.center.copy( node.position );

		// now check all other nodes for neighborhood
		for ( j = 0; j < graph.getNumberOfNodes(); j++ )
		{
			// the current node can't be its own neighbor
			if ( i !== j )
			{
				// retrieve neighbor
				neighbor = graph.getNode( j );

				// check, if the neighbor is within the radius
				if ( boundingSphere.containsPoint( neighbor.position ) === true )
				{
					// calculate distance, the cost of the edge
					distance = node.position.distanceTo( neighbor.position );

					// this neighbor is okay so it can be added
					graph.addEdge( new NavGraphEdge( i, j, distance ) );
				}
			}
		}
	}// next node

}