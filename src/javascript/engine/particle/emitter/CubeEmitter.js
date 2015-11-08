/**
 * @file The cube emitter uses an AABB to determine the position particles will
 * be emitted.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var Emitter = require( "./Emitter" );

/**
 * Creates a cube emitter.
 * 
 * @constructor
 * @augments Emitter
 * 
 * @param {object} options - The options of the emitter.
 */
function CubeEmitter( options ) {
	
	Emitter.call( this );

	Object.defineProperties( this, {
		// the size of the emitter
		size : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
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
		_boundingVolume : {
			value : new THREE.Box3(),
			configurable : false,
			enumerable : false,
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

CubeEmitter.prototype = Object.create( Emitter.prototype );
CubeEmitter.prototype.constructor = CubeEmitter;

/**
 * Emits the particle within a predefined bounding volume.
 * 
 * @param {Particle} particle - The particle to emit.
 */
CubeEmitter.prototype.emit = ( function() {

	var position;

	return function( particle ) {
		
		var speed, lifetime;

		if ( position === undefined )
		{
			position = new THREE.Vector3();
		}

		// determine random values for speed and lifetime
		speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );
		lifetime = THREE.Math.randFloat( this.minLifetime, this.maxLifetime );

		// determine random values for position
		position.x = THREE.Math.randFloat( this._boundingVolume.min.x, this._boundingVolume.max.x );
		position.y = THREE.Math.randFloat( this._boundingVolume.min.y, this._boundingVolume.max.y );
		position.z = THREE.Math.randFloat( this._boundingVolume.min.z, this._boundingVolume.max.z );

		// add the origin of the emitter to the relative position of the
		// particle to get world coordinates
		particle.position.copy( position ).add( this.origin );

		// calculate velocity
		particle.velocity.copy( position ).normalize().multiplyScalar( speed );

		// set time properties
		particle.lifetime = lifetime;
		particle.age = 0;
	};

}() );

/**
 * Updates the internal state of the emitter.
 */
CubeEmitter.prototype.update = ( function() {

	var center;

	return function() {

		if ( center === undefined )
		{
			center = new THREE.Vector3();
		}

		// calculate bounding volume
		this._boundingVolume.setFromCenterAndSize( center, this.size );
	};

}() );

module.exports = CubeEmitter;