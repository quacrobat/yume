/**
 * @file This prototype holds the central Web Audio context and manages the
 * requirements for spatial sound effects.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

/**
 * Creates an audioListener. The constructor creates the central WebAudio
 * context of the application, a compressor and a gain-node for adjusting the
 * master volume.
 * 
 * node sequence: master gain -> compressor -> destination
 * 
 * @constructor
 * @augments THREE.Object3D
 * 
 */
function AudioListener() {

	THREE.Object3D.call( this );

	// central Web Audio context
	global.window.AudioContext = global.window.AudioContext || global.window.webkitAudioContext;

	Object.defineProperties( this, {
		type : {
			value : "AudioListener",
			configurable : false,
			enumerable : true,
			writable : false
		},
		context : {
			value : new global.window.AudioContext(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		compressor : {
			value : {},
			configurable : false,
			enumerable : true,
			writable : true
		},
		gain : {
			value : {},
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );

	// dynamics compression
	this.compressor = this.context.createDynamicsCompressor();
	this.compressor.connect( this.context.destination );

	// master gain
	this.gain = this.context.createGain();
	this.gain.connect( this.compressor );
}

AudioListener.prototype = Object.create( THREE.Object3D.prototype );
AudioListener.prototype.constructor = AudioListener;

/**
 * This method updates the position of the audioListener in 3D-space. Only then,
 * spatial sound effects can be emitted correctly.
 * 
 * @param {boolean} force - Flag for calculation the world matrix.
 */
AudioListener.prototype.updateMatrixWorld = ( function() {

	var position, quaternion, scale, orientation;

	return function( force ) {

		if ( position === undefined )
		{
			position = new THREE.Vector3();
			quaternion = new THREE.Quaternion();
			scale = new THREE.Vector3();
			orientation = new THREE.Vector3();
		}

		// call the parent method
		THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

		this.matrixWorld.decompose( position, quaternion, scale );

		// calculate the orientation of the audio listener
		orientation.set( 0, 0, -1 ).applyQuaternion( quaternion );

		// set position and orientation to the WebAudio context
		this.context.listener.setPosition( position.x, position.y, position.z );
		this.context.listener.setOrientation( orientation.x, orientation.y, orientation.z, this.up.x, this.up.y, this.up.z );
	};

} )();

module.exports = AudioListener;