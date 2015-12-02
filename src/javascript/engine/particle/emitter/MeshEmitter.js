/**
 * @file The mesh emitter uses an arbitrary mesh to determine the position
 * particles will be emitted.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var Emitter = require( "./Emitter" );

/**
 * Creates a mesh emitter.
 * 
 * @constructor
 * @augments Emitter
 * 
 * @param {object} options - The options of the emitter.
 */
function MeshEmitter( options ) {

	Emitter.call( this );

	Object.defineProperties( this, {

		// the mesh of the emitter
		mesh : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this will be used to store the vertex normals. access via vertex
		// index
		_vertexNormals : {
			value : {},
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this will be used to calculate the vertex normal in world space
		_normalMatrix : {
			value : new THREE.Matrix3(),
			configurable : false,
			enumerable : false,
			writable : false
		}

	} );

	// transfer the options values to the object
	for ( var property in options )
	{
		if ( options.hasOwnProperty( property ) )
		{
			if ( options[ property ] instanceof THREE.Vector3 )
			{
				this[ property ].copy( options[ property ] );
			}
			else
			{
				this[ property ] = options[ property ];
			}
		}
	}

	// retrieve the vertex normals for velocity calculation
	this._getVertexNormals();

	// ensure the update method is called at least once
	this.update();
}

MeshEmitter.prototype = Object.create( Emitter.prototype );
MeshEmitter.prototype.constructor = MeshEmitter;

/**
 * Emits the particle within a predefined bounding volume.
 * 
 * @param {Particle} particle - The particle to emit.
 */
MeshEmitter.prototype.emit = ( function() {

	var position;

	return function( particle ) {

		var speed, vertexIndex;

		if ( position === undefined )
		{
			position = new THREE.Vector3();
		}
		
		// first, call method of base prototype
		Emitter.prototype.emit.call( this, particle );

		// determine random values for speed, lifetime, size and angle velocity
		speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );

		// determine randomly a vertex from the geometry
		vertexIndex = THREE.Math.randInt( 0, this.mesh.geometry.vertices.length - 1 );

		// copy the vertex data to the position vector of the particle
		particle.position.copy( this.mesh.geometry.vertices[ vertexIndex ] );

		// finally, we need to apply the world matrix of the mesh to calculate
		// the world position of the particle
		particle.position.applyMatrix4( this.mesh.matrixWorld );

		// the vertex normal determines the movement direction of the particle
		particle.velocity.copy( this._vertexNormals[ vertexIndex ] );

		// transform the velocity/normal to world space
		particle.velocity.applyMatrix3( this._normalMatrix );

		// regard the speed
		particle.velocity.normalize().multiplyScalar( speed );
	};

}() );

/**
 * Updates the internal state of the emitter.
 */
MeshEmitter.prototype.update = function() {

	// update the world matrix of the mesh
	this.mesh.updateMatrixWorld( true );

	// update the normal matrix. used for velocity calculation
	this._normalMatrix.getNormalMatrix( this.mesh.matrixWorld );
};

/**
 * This method creates a simple map for fast access to the vertex normal via the
 * index of a vertex.
 */
MeshEmitter.prototype._getVertexNormals = function() {

	var index;

	// first, calculate face and vertex normals
	this.mesh.geometry.computeFaceNormals();
	this.mesh.geometry.computeVertexNormals( true );

	// then create the map. save the vertex normal along with the vertex index
	for ( index = 0; index < this.mesh.geometry.vertices.length; index++ )
	{
		this._vertexNormals[ index ] = this._getVertexNormal( index );
	}

};

/**
 * Returns the normal of a given vertex.
 * 
 * @param {number} vertexIndex - The index of the vertex.
 */
MeshEmitter.prototype._getVertexNormal = ( function() {

	var keys;

	return function( vertexIndex ) {

		var face, i, j;

		if ( keys === undefined )
		{
			keys = [ "a", "b", "c" ];
		}

		// iterate over all faces to retrieve the vertex normal
		for ( i = 0; i < this.mesh.geometry.faces.length; i++ )
		{
			face = this.mesh.geometry.faces[ i ];

			for ( j = 0; j < face.vertexNormals.length; j++ )
			{
				// if the index of the current face vertex is equal with the
				// given index, we can return the vertex normal
				if ( face[ keys[ j ] ] === vertexIndex )
				{
					return face.vertexNormals[ j ];
				}

			} // next vertex normal

		} // next face
	};

}() );

module.exports = MeshEmitter;