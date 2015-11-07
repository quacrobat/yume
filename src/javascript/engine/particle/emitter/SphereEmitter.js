/**
 * @file The sphere emitter will randomly emit a particle somewhere about a
 * sphere within some range. The emitter uses spherical coordinates to determine
 * the range in which particles will be emitted in. The spherical coordinates
 * are converted to Cartesian coordinates to determine the position and velocity
 * that the particle is emitted in 3D space.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var Emitter = require( "./Emitter" );

/**
 * Creates a sphere emitter.
 * 
 * @constructor
 * @augments Emitter
 * 
 * @param {object} options - The options of the emitter.
 */
function SphereEmitter( options ) {
	
	Emitter.call( this );

	Object.defineProperties( this, {
		// radius must be in range: [ 0, ∞ )
		// the minimum radius
		minRadius : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum radius
		maxRadius : {
			value : 10,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// azimuth must be in range: [ 0, 2π )
		// the minimum azimuth
		minAzimuth : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum azimuth
		maxAzimuth : {
			value : Math.PI * 1.999,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// inclination must be in range: [ 0, π ]
		// the minimum inclination
		minInclination : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum inclination
		maxInclination : {
			value : Math.PI,
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
		}

	} );

	// transfer the options values to the object
	for ( var property in options )
	{
		if ( options.hasOwnProperty( property ) )
		{
			if ( options[ property ] instanceof THREE.Vector3 || options[ property ] instanceof THREE.Box3 )
			{
				this[ property ].copy( options[ property ] );
			}
			else
			{
				this[ property ] = options[ property ];
			}
		}
	}

}

SphereEmitter.prototype = Object.create( Emitter.prototype );
SphereEmitter.prototype.constructor = SphereEmitter;

/**
 * Emits the particle within a predefined bounding volume.
 * 
 * @param {Particle} particle - The particle to emit.
 */
SphereEmitter.prototype.emit = ( function() {

	var position;

	return function( particle ) {

		if ( position === undefined )
		{
			position = new THREE.Vector3();
		}

		// calculate components of polar coordinates
		var azimuth = THREE.Math.randFloat( this.minAzimuth, this.maxAzimuth );
		var inclination = THREE.Math.randFloat( this.minInclination, this.maxInclination );

		// determine random values for radius, speed and lifetime
		var radius = THREE.Math.randFloat( this.minRadius, this.maxRadius );
		var speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );
		var lifetime = THREE.Math.randFloat( this.minLifetime, this.maxLifetime );

		// determine the relative position of the particle by converting polar
		// coordinates to Cartesian coordinates
		var sinusInclination = Math.sin( inclination );

		position.x = sinusInclination * Math.cos( azimuth );
		position.y = sinusInclination * Math.sin( azimuth );
		position.z = Math.cos( inclination );

		particle.position.copy( position ).multiplyScalar( radius );

		// add the origin of the emitter to the relative position of the
		// particle to get world coordinates
		particle.position.add( this.origin );

		// calculate velocity
		particle.velocity.copy( position ).normalize().multiplyScalar( speed );

		// calculate time properties
		particle.lifetime = lifetime;
		particle.age = 0;
	};

}() );

module.exports = SphereEmitter;