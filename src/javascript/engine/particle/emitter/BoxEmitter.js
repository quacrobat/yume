/**
 * @file The box emitter uses an AABB to determine the position particles will
 * be emitted.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var Emitter = require( "./Emitter" );

/**
 * Creates a box emitter.
 * 
 * @constructor
 * @augments Emitter
 * 
 * @param {object} options - The options of the emitter.
 */
function BoxEmitter( options ) {
	
	Emitter.call( this );

	Object.defineProperties( this, {
		
		// the origin of the emitter
		origin : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// the size of the emitter
		size : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
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

BoxEmitter.prototype = Object.create( Emitter.prototype );
BoxEmitter.prototype.constructor = BoxEmitter;

/**
 * Emits the particle within a predefined bounding volume.
 * 
 * @param {Particle} particle - The particle to emit.
 */
BoxEmitter.prototype.emit = ( function() {

	var position;

	return function( particle ) {
		
		if ( position === undefined )
		{
			position = new THREE.Vector3();
		}
		
		// first, call method of base prototype
		Emitter.prototype.emit.call( this, particle );

		// determine random values for position
		position.x = THREE.Math.randFloat( this._boundingVolume.min.x, this._boundingVolume.max.x );
		position.y = THREE.Math.randFloat( this._boundingVolume.min.y, this._boundingVolume.max.y );
		position.z = THREE.Math.randFloat( this._boundingVolume.min.z, this._boundingVolume.max.z );

		// add the origin of the emitter to the relative position of the
		// particle to get world coordinates
		particle.position.copy( position ).add( this.origin );

		// calculate default movement
		if ( this.defaultMovement === true )
		{
			particle.movement.copy( position ).normalize().multiplyScalar( particle.speed );
		}
		
	};

}() );

/**
 * Updates the internal state of the emitter.
 */
BoxEmitter.prototype.update = ( function() {

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

module.exports = BoxEmitter;