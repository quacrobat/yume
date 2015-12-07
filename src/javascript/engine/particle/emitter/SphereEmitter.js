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
		
		// the origin of the emitter
		origin : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
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
	
	// ensure the update method is called at least once
	this.update();
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

		var azimuth, inclination, sinusInclination, radius, speed;

		if ( position === undefined )
		{
			position = new THREE.Vector3();
		}

		// first, call method of base prototype
		Emitter.prototype.emit.call( this, particle );

		// calculate components of polar coordinates
		azimuth = THREE.Math.randFloat( this.minAzimuth, this.maxAzimuth );
		inclination = THREE.Math.randFloat( this.minInclination, this.maxInclination );

		// determine random values for radius, speed, lifetime, size and angle
		// velocity
		radius = THREE.Math.randFloat( this.minRadius, this.maxRadius );
		speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );

		// determine the relative position of the particle by converting polar
		// coordinates to Cartesian coordinates
		sinusInclination = Math.sin( inclination );

		position.x = sinusInclination * Math.cos( azimuth );
		position.y = sinusInclination * Math.sin( azimuth );
		position.z = Math.cos( inclination );

		particle.position.copy( position ).multiplyScalar( radius );

		// add the origin of the emitter to the relative position of the
		// particle to get world coordinates
		particle.position.add( this.origin );

		// calculate default movement
		if ( this.defaultMovement === true )
		{
			particle.movement.copy( position ).normalize();
		}
		
		// regard speed
		particle.movement.multiplyScalar( speed );
	};

}() );

/**
 * Updates the internal state of the emitter.
 */
SphereEmitter.prototype.update = function() {

	// nothing to do here
};

module.exports = SphereEmitter;