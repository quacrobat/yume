/**
 * @file Base prototype for all emitters.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates an emitter.
 * 
 * @constructor
 */
function Emitter() {

	Object.defineProperties( this, {
		
		// the color of a particle
		color : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the minimum size of a particle
		minSize : {
			value : 3,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum size of a particle
		maxSize : {
			value : 5,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the minimum opacity of a particle
		minOpacity : {
			value : 1,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum opacity of a particle
		maxOpacity : {
			value : 1,
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
		// the minimum rotation speed of a particle
		minAngleSpeed : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the maximum rotation speed of a particle
		maxAngleSpeed : {
			value : Math.PI * 0.5, // 90 degrees per second
			configurable : false,
			enumerable : true,
			writable : true
		}
		
	} );

}

/**
 * Emits the particle within a predefined bounding volume.
 * 
 * @param {Particle} particle - The particle to emit.
 */
Emitter.prototype.emit = function( particle ) {

	// set time properties
	particle.lifetime = THREE.Math.randFloat( this.minLifetime, this.maxLifetime );
	particle.age = 0;
	
	// set size and opacity value 
	particle.size = THREE.Math.randFloat( this.minSize, this.maxSize );
	particle.opacity = THREE.Math.randFloat( this.minOpacity, this.maxOpacity );
	
	// set angle properties
	particle.angleVelocity = THREE.Math.randFloat( this.minAngleSpeed, this.maxAngleSpeed );
	particle.angle = 0;
	
	// set color
	if ( this.color !== null )
	{
		particle.color.copy( this.color );
	}

};

/**
 * Updates the internal state of the emitter.
 */
Emitter.prototype.update = function() {

	throw "ERROR: Emitter: This method must be implemented in a derived emitter prototype.";
};

module.exports = Emitter;