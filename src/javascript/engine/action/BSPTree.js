/**
 * @file This prototpye can be used to generate an axis-aligned BSP Tree for
 * fast ray-tracing or collision detection.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 14.1.2, BSP Trees
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var system = require( "../core/System" );

/**
 * Creates an axis-aligned BSP Tree.
 * 
 * @constructor
 * 
 * @param {object} actionObjects - A reference to an array with all
 * action objects.
 * @param {object} interactiveObjects - A reference to an array with all
 * interactive objects.
 */
function BSPTree( actionObjects, interactiveObjects ) {

	Object.defineProperties( this, {
		_root : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_actionObjects : {
			value : actionObjects,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_interactiveObjects : {
			value : interactiveObjects,
			configurable : false,
			enumerable : false,
			writable : false
		},
		_currentAxis : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_AXIS_COUNT : {
			value : 3,
			configurable : false,
			enumerable : false,
			writable : false
		}
	} );
}

/**
 * This method controls the generation of the BSP Tree.
 * 
 * @param {World} world - The world object.
 */
BSPTree.prototype.generate = function( world ) {
	
	var nextNode;
	
	// create a stack (LIFO), in JavaScript done via a plain array
	var stack = [];

	// first, create the root node of the BSP-Tree
	this._buildRootNode();
	
	// push it onto the stack
	stack.push( this._root );
	
	// while there are nodes in the stack keep subdividing
	while ( stack.length > 0 )
	{
		// grab the next node and remove it from the stack
		nextNode = stack.pop();
		
		// subdivide the node 
		this._subdivide( nextNode );

		// then, check if the subdivision has created children
		if( nextNode.hasChildren() === true ){
			
			// if so, push them onto the stack
			stack.push( nextNode.leftChild );
			stack.push( nextNode.rightChild );
		}
		
		// if the engine runs in dev mode, visualize the AABB of each node
		if( system.isDevModeActive === true ){
			
			this._addHelper( nextNode, world );
		}
		
	}  // next node
};

/**
 * Executes a recursive, simple Ray/AABB intersection test to determine objects
 * for the exact ray intersection test by the action manager.
 * 
 * @param {THREE.Ray} ray - The ray for the test.
 * @param {object} intersects - An array with action objects for further testing.
 */
BSPTree.prototype.intersectRay = ( function() {
	
	var stack = [];
	
	return function( ray, intersects ){
				
		var nextNode, index;
		
		// reset stack
		stack.length = 0;
		
		// push the root node onto the stack
		stack.push( this._root );

		// while there are nodes in the stack keep testing
		while ( stack.length > 0 )
		{
			// grab the next node and remove it from the stack
			nextNode = stack.pop();

			// execute intersection test
			if ( ray.intersectsBox( nextNode.aabb ) === true )
			{
				// push all entities to the result array
				for ( index = 0; index < nextNode.entities.length; index++ )
				{
					intersects.push( nextNode.entities[ index ].object );
				}

				// if the node has children, push them onto the stack
				if ( nextNode.hasChildren() === true )
				{
					stack.push( nextNode.leftChild );
					stack.push( nextNode.rightChild );
				}
			}

		} // next node

		return intersects;
	};

}() );

/**
 * Builds the root node of the BSP Tree. The root node encloses all relevant 3D
 * objects in the stage.
 */
BSPTree.prototype._buildRootNode = function() {

	var entity, entities, i, j;

	// create the root node
	this._root = new Node();

	// retrieve all 3D entities
	entities = this._retrieveEntities();

	// we iterate over all entities to calculate the root element's AABB
	for ( i = 0; i < entities.length; i++ )
	{
		entity = entities[ i ];

		// we need to process each vertex of the entities
		for ( j = 0; j < entity.verticesWorldSpace.length; j++ )
		{
			// this method call ensures that the AABB encloses all vertices of
			// the given entities
			this._root.aabb.expandByPoint( entity.verticesWorldSpace[ j ] );

		} // next vertex

		// we assign all entities to the root element
		this._root.entities.push( entity );

	} // next entity

};

/**
 * This method is used to get all relevant 3D entities of the stage. Besides, it
 * provides vertex data of the geometry in world space. This is necessary for
 * AABB calculations.
 */
BSPTree.prototype._retrieveEntities = function() {

	var entities = [], interactiveObject, verticesModelSpace, verticesWorldSpace, vertex, i, j;

	for ( i = 0; i < this._interactiveObjects.length; i++ )
	{
		// retrieve object
		interactiveObject = this._interactiveObjects[ i ];

		// ensure model matrix is up to date
		interactiveObject.mesh.updateMatrix();
		interactiveObject.mesh.updateMatrixWorld();

		verticesWorldSpace = [];
		verticesModelSpace = interactiveObject.mesh.geometry.vertices;

		// iterate over all vertices and transform them to world space
		for ( j = 0; j < verticesModelSpace.length; j++ )
		{
			vertex = verticesModelSpace[ j ].clone();

			verticesWorldSpace.push( vertex.applyMatrix4( interactiveObject.mesh.matrixWorld ) );

		} // next vertex

		// save the data in the internal entity array
		entities.push( {
			object : interactiveObject,
			verticesWorldSpace : verticesWorldSpace,
			processed : false
		} );

	} // next object

	return entities;

};

/**
 * This will create new nodes from a given node. In this BSP implementation the
 * algorithm will split the node in the center of a particular axis. If this
 * process does not provide good results, the splitting is repeated with the
 * other two axis. If no axis provides a result, no child node will be created
 * and the entities will remain in the current node
 * 
 * @param {Node} node - The node to subdivide.
 */
BSPTree.prototype._subdivide = function( node ) {

	// we only create sub-nodes if there is more than one entity
	if ( node.entities.length > 1 )
	{
		node.splitStep++;

		// create the child nodes
		this._createChildNodes( node );

		// try to distribute all entities to the child nodes
		this._distributeEntities( node );

		// check the results of the splitting
		if ( node.hasValidChildren() === false )
		{
			// if there is no valid result, try the splitting again with an
			// other axis. we can do this two times, because we have overall
			// three axis
			if ( node.splitStep < this._AXIS_COUNT )
			{
				this._subdivide( node );
			}

			// if no splitting axis works, keep the 3D entities on the current node
			// and delete the sub-nodes
			else
			{
				node.leftChild = null;
				node.rightChild = null;
			}
		}
		else
		{
			node.removeInvalidEntities();
		}
	}

	// this property is no longer required, so it's deleted here to free memory
	delete node.splitStep;
};

/**
 * Creates child nodes for a given node. The method divides the AABB of the
 * given node into two even AABBs for the child nodes.
 * 
 * @param {Node} node - The parent node.
 */
BSPTree.prototype._createChildNodes = function( node ) {

	var minValue, maxValue, midpoint;

	// create new nodes
	node.leftChild = new Node();
	node.rightChild = new Node();

	// copy the parent's AABB to the new childs
	node.leftChild.aabb.copy( node.aabb );
	node.rightChild.aabb.copy( node.aabb );

	// get minimum and maximum value of the splitting axis
	minValue = node.aabb.min.getComponent( this._currentAxis );
	maxValue = node.aabb.max.getComponent( this._currentAxis );

	// calculate midpoint of the splitting axis. this is the position, where the
	// AABB is divided into two new AABBs
	midpoint = ( maxValue - minValue ) * 0.5;

	// now adjust the new AABBs so they have exactly the half size of the parent
	node.leftChild.aabb.max.setComponent( this._currentAxis, minValue + midpoint );
	node.rightChild.aabb.min.setComponent( this._currentAxis, maxValue - midpoint );

	// ensure we split the next AABB towards an other axis
	this._nextAxis();
};

/**
 * This method tries to distribute the entities of a given node to its children.
 * An entity will only assign to a child node, if it's fully contained of the
 * corresponding AABB.
 * 
 * @param {Node} node - The parent node.
 */
BSPTree.prototype._distributeEntities = function( node ) {

	var index, entity;

	// iterate over all entities to distribute them to child nodes
	for ( index = 0; index < node.entities.length; index++ )
	{
		entity = node.entities[ index ];

		// test to see if the entity can sorted to the left child. that will
		// only be the case IF all vertices are bounded by the node
		if ( node.leftChild.containsEntity( entity ) === true )
		{
			node.leftChild.addEntity( entity );
		}

		// test to see if the entity can sorted to the right child. that will
		// only be the case IF all vertices are bounded by the node
		if ( node.rightChild.containsEntity( entity ) === true )
		{
			node.rightChild.addEntity( entity );
		}

	} // next object

};

/**
 * Sets the "currentAxis" property to the next axis.
 */
BSPTree.prototype._nextAxis = function() {

	if ( ++this._currentAxis > ( this._AXIS_COUNT - 1 ) )
	{
		this._currentAxis = 0;
	}
};

/**
 * Adds a helper to the 3D world to visualize the AABB of a node.
 * 
 * @param {Node} node - The node that gets the helper.
 * @param {World} world - The world object.
 */
BSPTree.prototype._addHelper = ( function() {

	var geometry, material;

	return function( node, world ) {

		var helper;

		if ( geometry === undefined )
		{
			geometry = new THREE.BoxGeometry( 1, 1, 1 );
			material = new THREE.MeshBasicMaterial( {
				color : 0xffffff,
				wireframe : true
			} );
		}

		// create the mesh
		helper = new THREE.Mesh( geometry, material );

		// retrieve position and scaling from the bounding box
		node.aabb.size( helper.scale );
		node.aabb.center( helper.position );

		// add it to the world
		world.addObject3D( helper );
	};

}() );

module.exports = BSPTree;

/**
 * Creates a node for a BSP Tree.
 * 
 * @constructor
 */
function Node() {

	Object.defineProperties( this, {
		aabb : {
			value : new THREE.Box3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		entities : {
			value : [],
			configurable : false,
			enumerable : true,
			writable : false
		},
		leftChild : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		rightChild : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		splitStep : {
			value : 0,
			configurable : true,
			enumerable : true,
			writable : true
		}
	} );

}

/**
 * Checks, if the node has valid children. This depends primarily on the
 * distribution of 3D entities between parent and children.
 */
Node.prototype.hasValidChildren = function() {

	var max = this.entities.length, min = 0;

	if ( ( this.leftChild.entities.length < max && this.rightChild.entities.length < max ) && ( this.leftChild.entities.length > min && this.rightChild.entities.length > min ) )
	{
		return true;
	}

	return false;
};

/**
 * Checks, if the node children.
 */
Node.prototype.hasChildren = function() {

	if ( this.rightChild !== null && this.leftChild !== null )
	{
		return true;
	}

	return false;
};

/**
 * Adds an entity to the internal array.
 * 
 * @param {object} entity - The entity to add.
 */
Node.prototype.addEntity = function( entity ) {

	this.entities.push( entity );
};

/**
 * Removes an entity of the internal array.
 * 
 * @param {object} entity - The entity to remove.
 */
Node.prototype.removeEntity = function( entity ) {

	var index = this.entities.indexOf( entity );
	this.entities.splice( index, 1 );
};

/**
 * Checks, if the node contains a given entity.
 * 
 * @param {object} entity - The entity to check.
 */
Node.prototype.containsEntity = function( entity ) {

	var index, vertex;

	// we need to check if all vertices in world space are inside the
	// corresponding AABB
	for ( index = 0; index < entity.verticesWorldSpace.length; index++ )
	{
		vertex = entity.verticesWorldSpace[ index ];

		if ( this.aabb.containsPoint( vertex ) === false )
		{
			return false;
		}

	} // next vertex

	return true;
};

/**
 * Removes invalid entities from the internal array.
 */
Node.prototype.removeInvalidEntities = function() {

	var index;

	// if entities were transfered to child nodes, they will be removed from the
	// parent's internal array
	for ( index = 0; index < this.leftChild.entities.length; index++ )
	{
		this.removeEntity( this.leftChild.entities[ index ] );
	}

	for ( index = 0; index < this.rightChild.entities.length; index++ )
	{
		this.removeEntity( this.rightChild.entities[ index ] );
	}

};