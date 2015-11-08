/**
 * @file The particle prototype defines the properties of a single particle that
 * is used to simulate the particle effect.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates a particle.
 * 
 * @constructor
 */
function Particle() {

	Object.defineProperties( this, {
		
		// the position of the particle
		position : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the velocity of the particle
		velocity : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the duration in seconds since the particle was emitted
		age : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// how long the particle will live for. when the particle’s age has
		// exceeded it’s lifetime, it is considered “dead” and will not be
		// rendered until it is re-emitted
		lifetime : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		}
		
	} );

}

/**
 * Updates the particle.
 * 
 * @param {number} delta - The time delta value.
 */
Particle.prototype.update = ( function() {

	var displacement = new THREE.Vector3();

	return function( delta ) {

		if ( displacement === undefined )
		{
			displacement = new THREE.Vector3();
		}

		// update age of the particle
		this.age += delta;

		// calculate displacement
		displacement.copy( this.velocity ).multiplyScalar( delta );

		// update the position by adding the displacement
		this.position.add( displacement );
	};

}() );

module.exports = Particle;