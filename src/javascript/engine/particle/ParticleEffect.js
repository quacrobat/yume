/**
 * @file This prototype will be used to emit and update particles that share
 * common properties such as texture, interpolated colors, interpolated scale,
 * forces that will be applied to each particle and blending modes, and sorting
 * criteria. Since all the particles in a particle effect will all share the
 * same texture, several particle effects will be required to create a complex
 * particle effect that requires several different texture to look correct (for
 * example, a fire and smoke particle system would require at least two
 * different particle effects – one for the fire and one for the smoke).
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var logger = require( "../core/Logger" );
var world = require( "../core/World" );
var camera = require( "../core/Camera" );

var Particle = require( "./Particle" );
var Interpolator = require( "./Interpolator" );
var Emitter = require( "./emitter/Emitter" );
var ParticleShader = require( "../shader/ParticleShader" );

/**
 * Creates a particle effect.
 * 
 * @constructor
 * 
 * @param {object} options - The options of the particle effect.
 */
function ParticleEffect( options ) {

	Object.defineProperties( this, {

		// the number of particles in this effect.
		numberOfParticles : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// a reference to a particle emitter
		emitter : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this texture will be used for all particles. if the effect requires
		// more than one texture, you need to create additional instances of
		// this prototype
		texture : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this indicates if the texture should rotate
		rotateTexture : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this indicates if the effect sorts the particles in back-to-front
		// order
		sortParticles : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this indicates if the particles should be transparent
		transparent : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this controls the blending mode
		blending : {
			value : THREE.NormalBlending,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this controls the update of the emitter. static particle effects can
		// set this value to false
		emitterAutoUpdate : {
			value : true,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the particles of the effect
		_particles : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the geometry of the particle effect
		_particleGeometry : {
			value : new THREE.BufferGeometry(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the material of the particle effect
		_particleMaterial : {
			value : new THREE.ShaderMaterial( {
				// we can't assign the reference for defines, because particle
				// effects may need different constants in their shader program
				defines : {
					USE_SIZE_ATTENUATION : ParticleShader.defines.USE_SIZE_ATTENUATION,
					USE_TEXTURE : ParticleShader.defines.USE_TEXTURE,
					USE_ROTATION : ParticleShader.defines.USE_ROTATION
				},
				uniforms : ParticleShader.uniforms,
				vertexShader : ParticleShader.vertexShader,
				fragmentShader : ParticleShader.fragmentShader
			} ),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the actual 3D object which contains the geometry and material of the
		// particle effect. this property will be created in the initialize
		// method
		_particleSystem : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this will be used to store all interpolators of the effect
		_interpolators : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},

	} );

	// transfer the options values to the object
	for ( var property in options )
	{
		if ( options.hasOwnProperty( property ) )
		{
			this[ property ] = options[ property ];
		}
	}

	this._init();
}

/**
 * Updates the particle effect.
 * 
 * @param {number} delta - The time delta value.
 */
ParticleEffect.prototype.update = ( function() {

	var displacement;

	return function( delta ) {

		var index, particle, lifeRatio;

		if ( displacement === undefined )
		{
			displacement = new THREE.Vector3();
		}

		// update emitter only if the respective flag is set
		if ( this.emitterAutoUpdate === true )
		{
			this.emitter.update();
		}

		// update all particles
		for ( index = 0; index < this._particles.length; index++ )
		{
			// buffer particle
			particle = this._particles[ index ];

			// update age of the particle
			particle.age += delta;

			// if the particle exceeds its lifetime, just emit it again
			if ( particle.age > particle.lifetime )
			{
				this.emitter.emit( particle );
			}

			// update the position by adding a displacement
			displacement.copy( particle.movement ).multiplyScalar( delta );
			particle.position.add( displacement );

			// this value will be used for interpolation
			lifeRatio = THREE.Math.clamp( ( particle.age / particle.lifetime ), 0, 1 );
			
			// execute interpolators
			if ( this._interpolators.length > 0 )
			{
				this._interpolate( particle, lifeRatio );
			}
			
			// angle calculation if necessary
			if ( this.rotateTexture === true )
			{
				particle.angle += particle.angleVelocity * delta;
			}
			
		} // next particle

		// update the buffer data for shader program
		this._buildBuffer();

		// finally, sort the particles if necessary
		if ( this.sortParticles === true )
		{
			this._sortParticles();
		}
	};

}() );

/**
 * Destroys the particle effect.
 */
ParticleEffect.prototype.destroy = function() {

	// remove the particle effect from the world
	world.removeObject3D( this._particleSystem );
};

/**
 * Adds an interpolator to the particle effect.
 * 
 * @param {Interpolator} interpolator - The interpolator object.
 * @param {String} name - The name of a particle property.
 */
ParticleEffect.prototype.addInterpolatorToProperty = function( interpolator, name ) {

	if ( interpolator instanceof Interpolator )
	{
		this._interpolators.push( {
			key : name,
			object : interpolator
		} );
	}
	else
	{
		throw "ERROR: ParticleEffect: No valid interpolator set.";
	}

};

/**
 * Removes an interpolator of the particle effect.
 * 
 * @param {String} name - The name of a particle property.
 */
ParticleEffect.prototype.removeInterpolatorFromProperty = function( name ) {

	var index, interpolator;

	for ( index = 0; index < this._interpolators.length; index++ )
	{
		interpolator = this._interpolators[ index ];
		
		if( interpolator.key === name ){
			
			this._interpolators.splice( index, 1 );
			
			return;
		}
	}
};

/**
 * Initializes the particle effect.
 */
ParticleEffect.prototype._init = function() {

	var index, particle, positionBuffer, colorBuffer, sizeBuffer, angleBuffer, indexBuffer;

	// check existence of a valid particle emitter
	if ( this.emitter instanceof Emitter === false )
	{
		throw "ERROR: ParticleEffect: No valid particle emitter set.";
	}

	// if no texture is set, delete the constants from the shader program that
	// controls texture sampling and rotating
	if ( this.texture === null )
	{
		delete this._particleMaterial.defines.USE_TEXTURE;
		delete this._particleMaterial.defines.USE_ROTATION;
	}
	else
	{
		// if we have a texture, we maybe want no rotation. if so, delete the
		// corresponding shader constant
		if ( this.rotateTexture === false )
		{
			delete this._particleMaterial.defines.USE_ROTATION;
		}
	}

	// set texture, transparent flag and blending mode
	this._particleMaterial.uniforms.texture.value = this.texture;
	this._particleMaterial.transparent = this.transparent;
	this._particleMaterial.blending = this.blending;

	// create buffers
	positionBuffer = new Float32Array( this.numberOfParticles * 3 );
	colorBuffer = new Float32Array( this.numberOfParticles * 4 );
	sizeBuffer = new Float32Array( this.numberOfParticles );
	angleBuffer = new Float32Array( this.numberOfParticles );

	// add buffers to geometry
	this._particleGeometry.addAttribute( "position", new THREE.BufferAttribute( positionBuffer, 3 ) );
	this._particleGeometry.addAttribute( "color", new THREE.BufferAttribute( colorBuffer, 4 ) );
	this._particleGeometry.addAttribute( "size", new THREE.BufferAttribute( sizeBuffer, 1 ) );
	this._particleGeometry.addAttribute( "angle", new THREE.BufferAttribute( angleBuffer, 1 ) );
	
	// then create the particles
	for ( index = 0; index < this.numberOfParticles; index++ )
	{
		// create a new particle
		particle = new Particle();
		
		// provide a first random lifetime.
		// this will ensure, that particles will be emitted evenly
		particle.lifetime = THREE.Math.randFloat( 0, this.emitter.maxLifetime );
		
		// push the particle to the internal array
		this._particles.push( particle );
	}

	// if we need sorted particles, we create an additional index buffer
	if ( this.sortParticles === true )
	{
		indexBuffer = new Uint16Array( this.numberOfParticles );

		for ( index = 0; index < this.numberOfParticles; index++ )
		{
			indexBuffer[ index ] = index;
		}

		this._particleGeometry.setIndex( new THREE.BufferAttribute( indexBuffer, 1 ) );
	}

	// create the particle effect
	this._particleSystem = new THREE.Points( this._particleGeometry, this._particleMaterial );

	// disable view frustum culling. this avoids disappearing particles when
	// moving the camera away from the emitter
	this._particleSystem.frustumCulled = false;

	// add the system to the world
	world.addObject3D( this._particleSystem );
};

/**
 * Builds the buffer for the partciel shader program.
 */
ParticleEffect.prototype._buildBuffer = function() {

	var particle, positionBuffer, colorBuffer, sizeBuffer, angleBuffer, i, j, c;

	// shortcut to buffers
	positionBuffer = this._particleGeometry.attributes.position.array;
	colorBuffer = this._particleGeometry.attributes.color.array;
	sizeBuffer = this._particleGeometry.attributes.size.array;
	angleBuffer = this._particleGeometry.attributes.angle.array;

	// iterate over all particles and create the corresponding buffer data
	for ( i = j = c = 0; i < this._particles.length; i += 1, j += 3, c += 4 )
	{
		particle = this._particles[ i ];

		// position
		positionBuffer[ j + 0 ] = particle.position.x;
		positionBuffer[ j + 1 ] = particle.position.y;
		positionBuffer[ j + 2 ] = particle.position.z;

		// color
		colorBuffer[ c + 0 ] = particle.color.r;
		colorBuffer[ c + 1 ] = particle.color.g;
		colorBuffer[ c + 2 ] = particle.color.b;
		colorBuffer[ c + 3 ] = particle.opacity;

		// size
		sizeBuffer[ i ] = particle.size;
		
		// angle
		angleBuffer[ i ] = particle.angle;
	}

	// we need to tell three.js to update the buffers
	this._particleGeometry.attributes.position.needsUpdate = true;
	this._particleGeometry.attributes.color.needsUpdate = true;
	this._particleGeometry.attributes.size.needsUpdate = true;
	this._particleGeometry.attributes.angle.needsUpdate = true;
};

/**
 * Executes all interpolators for a given particle.
 * 
 * @param {Particle} particle - The particle used for interpolation.
 * @param {number} lifeRatio - The life ratio of the particle.
 */
ParticleEffect.prototype._interpolate = function( particle, lifeRatio ) {

	var index, interpolator;

	for ( index = 0; index < this._interpolators.length; index++ )
	{
		interpolator = this._interpolators[ index ];

		// the method call of "getValue" depends on the interpolated property.
		// we distinguish between objects and primitives
		if ( typeof particle[ interpolator.key ] === "object" )
		{
			interpolator.object.getValue( lifeRatio, particle[ interpolator.key ] );
		}
		else
		{
			particle[ interpolator.key ] = interpolator.object.getValue( lifeRatio );
		}
	}
};

/**
 * The method sorts all particles in back-to-front order. This is sometimes
 * necessary for particles with transparency.
 */
ParticleEffect.prototype._sortParticles = ( function() {

	var vector = new THREE.Vector3();
	var mvpMatrix = new THREE.Matrix4();

	var sortArray = [];

	return function() {

		var index, positionBuffer, indexBuffer;

		// reset array
		sortArray.length = 0;

		// shortcut to buffers
		positionBuffer = this._particleGeometry.attributes.position.array;
		indexBuffer = this._particleGeometry.index.array;

		// calculate model view projection matrix
		mvpMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
		mvpMatrix.multiply( this._particleSystem.matrixWorld );

		// calculate for all particles the depth an store this value along with
		// its index
		for ( index = 0; index < this._particles.length; index++ )
		{
			// transform the position vector to clip-space to get its depth
			// value
			vector.fromArray( positionBuffer, index * 3 );
			vector.applyProjection( mvpMatrix );

			// push the entry to the sort array
			sortArray.push( [ vector.z, index ] );
		}

		// execute the sort ( back-to-front )
		sortArray.sort( compareNumbers );

		// update the index buffer with the sorted values
		for ( index = 0; index < this._particles.length; index++ )
		{
			indexBuffer[ index ] = sortArray[ index ][ 1 ];
		}

		// we need to tell three.js to update the buffer
		this._particleGeometry.index.needsUpdate = true;
	};

}() );

module.exports = ParticleEffect;

/**
 * Compare function for array.sort().
 */
function compareNumbers( a, b ) {

	return b[ 0 ] - a[ 0 ];
}