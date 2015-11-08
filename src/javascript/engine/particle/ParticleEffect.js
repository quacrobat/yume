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
			value : new THREE.Geometry(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the material of the particle effect
		_particleMaterial : {
			value : new THREE.PointsMaterial(),
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
		}
		
	} );

	this._init();
}

/**
 * Updates the particle effect.
 * 
 * @param {number} delta - The time delta value.
 */
ParticleEffect.prototype.update = function( delta ) {

	var index, particle;

	// update emitter only if the respective flag is set
	if ( this.emitterAutoUpdate === true )
	{
		this.particleEmitter.update();
	}

	// update all particles
	for ( index = 0; index < this._particles.length; index++ )
	{
		particle = this._particles[ index ];

		particle.update( delta );

		// if the particle exceeds its lifetime, just emit it again
		if ( particle.age > particle.lifetime )
		{
			this.particleEmitter.emit( particle );
		}

	} // next particle

	// we need to tell three.js to update the vertices of the geometry
	this._particleGeometry.verticesNeedUpdate = true;
};

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

	var index, particle;

	// check existence of a valid particle emitter
	if ( this.particleEmitter instanceof Emitter === false )
	{
		throw "ERROR: ParticleEffect: No valid particle emitter set.";
	}

	// then create the particles
	for ( index = 0; index < this.numberOfParticles; index++ )
	{
		particle = new Particle();

		// push the particle to the internal array
		this._particles.push( particle );

		// push the position vector to the geometry object
		this._particleGeometry.vertices.push( particle.position );
	}

	// create the particle effect
	this._particleSystem = new THREE.Points( this._particleGeometry, this._particleMaterial );

	// disable view frustum culling. this avoids disappearing particles when
	// moving the camera away from the emitter
	this._particleSystem.frustumCulled = false;

	// add the system to the world
	world.addObject3D( this._particleSystem );
};

module.exports = ParticleEffect;