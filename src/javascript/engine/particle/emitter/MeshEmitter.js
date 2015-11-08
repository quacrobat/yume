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
		// the minimum lifetime of a particle
		minLifetime : {
			value : 5,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum lifetime of a particle
		maxLifetime : {
			value : 10,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the minimum speed of a particle
		minSpeed : {
			value : 5,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum speed of a particle
		maxSpeed : {
			value : 10,
			configurable : false,
			enumerable : true,
			writable : true
		},
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
	
	// to calculate the velocity, we need face normals and vertex normals
	this.mesh.geometry.computeFaceNormals();
	this.mesh.geometry.computeVertexNormals( true );
	
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

	var position, vertexNormal;

	return function( particle ) {

		var speed, lifetime, vertexIndex;

		if ( position === undefined )
		{
			position = new THREE.Vector3();
			vertexNormal = new THREE.Vector3();
		}

		// determine random values for speed and lifetime
		speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );
		lifetime = THREE.Math.randFloat( this.minLifetime, this.maxLifetime );

		// determine randomly a vertex from the geometry
		vertexIndex = THREE.Math.randInt( 0, this.mesh.geometry.vertices.length - 1 );

		// copy the vertex data to the position vector of the particle
		particle.position.copy( this.mesh.geometry.vertices[ vertexIndex ] );

		// finally, we need to apply the world matrix of the mesh to calculate
		// the world position of the particle
		particle.position.applyMatrix4( this.mesh.matrixWorld );

		// retrieve the vertex normal
		this._getVertexNormal( vertexIndex, vertexNormal );

		// the vertex normal and the normal matrix determines the direction in
		// world space
		particle.velocity.copy( vertexNormal ).applyMatrix3( this._normalMatrix );

		// regard the speed
		particle.velocity.normalize().multiplyScalar( speed );

		// set time properties
		particle.lifetime = lifetime;
		particle.age = 0;
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
 * Returns the normal of a given vertex.
 * 
 * @param {number} vertexIndex - The index of the vertex.
 * @param {THREE.Vector3} vertexNormal - The vertex normal.
 */
MeshEmitter.prototype._getVertexNormal = ( function() {

	var keys;

	return function( vertexIndex, vertexNormal ) {

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
				// given vertex index, we can retrieve the vertex normal
				if ( face[ keys[ j ] ] === vertexIndex )
				{
					vertexNormal.copy( face.vertexNormals[ j ] );

					return;
				}
				
			} // next vertex normal
			
		} // next face
	};

}() );

module.exports = MeshEmitter;