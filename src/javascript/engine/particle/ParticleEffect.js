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

var Emitter = require( "./emitter/Emitter" );
var Particle = require( "./Particle" );
var Interpolator = require( "./Interpolator" );
var logger = require( "../core/Logger" );
var world = require( "../core/World" );

/**
 * Creates a particle effect.
 * 
 * @constructor
 * 
 * @param {number} numberOfParticles - The number of the particles.
 * @param {Emitter} particleEmitter - The particle emitter.
 */
function ParticleEffect( numberOfParticles, particleEmitter ) {

	Object.defineProperties( this, {

		// the number of particles in this effect.
		numberOfParticles : {
			value : numberOfParticles,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// a reference to a particle emitter
		particleEmitter : {
			value : particleEmitter,
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
			value : new THREE.PointsMaterial( {
				vertexColors : THREE.VertexColors
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
		// this will be used to interpolate the particle color over time
		_colorInterpolator : {
			value : new Interpolator(),
			configurable : false,
			enumerable : false,
			writable : false
		}

	} );

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
			this.particleEmitter.update();
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
				this.particleEmitter.emit( particle );
			}

			// update the position by adding a displacement
			displacement.copy( particle.velocity ).multiplyScalar( delta );
			particle.position.add( displacement );

			// this value will be used for interpolation
			lifeRatio = THREE.Math.clamp( ( particle.age / particle.lifetime ), 0, 1 );
			
			// interpolate color
			this._colorInterpolator.getValue( lifeRatio, particle.color );
			
		} // next particle

		// update the buffer data for shader program
		this._buildBuffer();
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
 * Initializes the particle effect.
 */
ParticleEffect.prototype._init = function() {

	var index, positionBuffer, colorBuffer;

	// check existence of a valid particle emitter
	if ( this.particleEmitter instanceof Emitter === false )
	{
		throw "ERROR: ParticleEffect: No valid particle emitter set.";
	}

	// then create the particles
	for ( index = 0; index < this.numberOfParticles; index++ )
	{
		// push the particle to the internal array
		this._particles.push( new Particle() );
	}

	// create buffers
	positionBuffer = new Float32Array( this.numberOfParticles * 3 );
	colorBuffer = new Float32Array( this.numberOfParticles * 3 );

	// add buffers to geometry
	this._particleGeometry.addAttribute( "position", new THREE.BufferAttribute( positionBuffer, 3 ) );
	this._particleGeometry.addAttribute( "color", new THREE.BufferAttribute( colorBuffer, 3 ) );

	// create the particle effect
	this._particleSystem = new THREE.Points( this._particleGeometry, this._particleMaterial );

	// disable view frustum culling. this avoids disappearing particles when
	// moving the camera away from the emitter
	this._particleSystem.frustumCulled = false;

	// add the system to the world
	world.addObject3D( this._particleSystem );
	
	// setup the color interpolator
	this._colorInterpolator.addValue( 0.0, new THREE.Color( 0xff0000) );
	this._colorInterpolator.addValue( 0.4, new THREE.Color( 0x00ff00) );
	this._colorInterpolator.addValue( 0.7, new THREE.Color( 0x0000ff) );
};

/**
 * Builds the buffer for the partciel shader program.
 */
ParticleEffect.prototype._buildBuffer = function() {

	var particle, positionBuffer, colorBuffer, i, j;

	// shortcut to buffers
	positionBuffer = this._particleGeometry.attributes.position.array;
	colorBuffer = this._particleGeometry.attributes.color.array;

	// iterate over all particles and create the corresponding buffer data
	for ( i = 0, j = 0; i < this._particles.length; i++, j += 3 )
	{
		particle = this._particles[ i ];

		// position
		positionBuffer[ j + 0 ] = particle.position.x;
		positionBuffer[ j + 1 ] = particle.position.y;
		positionBuffer[ j + 2 ] = particle.position.z;
		
		// color
		colorBuffer[ j + 0 ] = particle.color.r;
		colorBuffer[ j + 1 ] = particle.color.g;
		colorBuffer[ j + 2 ] = particle.color.b;
	}

	// we need to tell three.js to update buffer
	this._particleGeometry.attributes.position.needsUpdate = true;
	this._particleGeometry.attributes.color.needsUpdate = true;
};

module.exports = ParticleEffect;