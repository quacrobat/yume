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
		// the color of the particle
		color : {
			value : new THREE.Color(),
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

module.exports = Particle;