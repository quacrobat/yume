/**
 * @file Prototype for creating dynamic, full-buffered audio objects.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );
/**
 * Creates a dynamic audio object.
 * 
 * node sequence: source -> panner -> gain
 * 
 * @constructor
 * @augments THREE.Object3D
 * 
 * @param {string} id - The ID of the dynamic audio.
 * @param {AudioListener} listener - The listener object.
 * @param {object} buffer - The buffered audio file.
 * @param {boolean} isLoop - Should the audio played in a loop?
 * @param {boolean} isStageIndependent - Should the audio independent of the
 * stage?
 * 
 */
function DynamicAudio( id, listener, buffer, isLoop, isStageIndependent ) {

	THREE.Object3D.call( this );

	Object.defineProperties( this, {
		type : {
			value : "DynamicAudio",
			configurable : false,
			enumerable : true,
			writable : false
		},
		audioId : {
			value : id,
			configurable : false,
			enumerable : true,
			writable : false
		},
		buffer : {
			value : buffer,
			configurable : false,
			enumerable : true,
			writable : true
		},
		isLoop : {
			value : isLoop || false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		isStageIndependent : {
			value : isStageIndependent || false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		_context : {
			value : listener.context,
			configurable : false,
			enumerable : true,
			writable : false
		},
		_gain : {
			value : listener.context.createGain(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		_panner : {
			value : listener.context.createPanner(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		_source : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		_pitchVariation : {
			value : undefined,
			configurable : false,
			enumerable : false,
			writable : true
		},
	} );

	// audio-node for volume
	this._gain.connect( listener.gain );

	// audio-node for spatial effects
	this._panner.distanceModel = "linear";
	this._panner.panningModel = "HRTF";
	this._panner.connect( this._gain );
}

DynamicAudio.prototype = Object.create( THREE.Object3D.prototype );
DynamicAudio.prototype.constructor = DynamicAudio;

/**
 * Plays an audio file once. You always have to create a new AudioBufferSource
 * when playing the file more than one time.
 * 
 * @param {number} time - The time offset, where the audio file should start
 * playing.
 */
DynamicAudio.prototype.play = function( time ) {

	// disconnect source node, if necessary
	if ( this._source !== null )
	{
		this._source.disconnect();
	}

	// build new source node because sources can just played once
	// see https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
	this._source = this._context.createBufferSource();

	this._source.buffer = this.buffer;
	this._source.loop = this.isLoop;
	this._source.connect( this._panner );

	// regard pitch variation
	if ( typeof this._pitchVariation === "function" )
	{
		this._source.playbackRate.value = this._pitchVariation();
	}

	// play sound
	this._source.start( time || 0 );
};

/**
 * Stops an audio file.
 * 
 * @param {number} time - The time offset, where the audio file should stop
 * playing.
 */
DynamicAudio.prototype.stop = function( time ) {

	this._source.stop( time || 0 );
};

/**
 * Gets the volume of the audio file.
 * 
 * @return {number} The volume.
 */
DynamicAudio.prototype.getVolume = function() {

	return this._gain.gain.value;
};

/**
 * Sets the volume of the audio file.
 * 
 * @param {number} volume - The volume to set.
 */
DynamicAudio.prototype.setVolume = function( volume ) {

	this._gain.gain.value = volume;
};

/**
 * Gets the refDistance.
 * 
 * @return {number} Reference distance for reducing volume as the audio source
 * moves further from the listener.
 */
DynamicAudio.prototype.getRefDistance = function() {

	return this._panner.refDistance;
};

/**
 * Sets the refDistance.
 * 
 * @param {number} refDistance - Reference distance for reducing volume as the
 * audio source moves further from the listener.
 */
DynamicAudio.prototype.setRefDistance = function( refDistance ) {

	this._panner.refDistance = refDistance;
};

/**
 * Gets the rolloffFactor.
 * 
 * @return {number} How quickly the volume is reduced as the source moves away
 * from the listener.
 */
DynamicAudio.prototype.getRolloffFactor = function() {

	return this._panner.rolloffFactor;
};

/**
 * Sets the rolloffFactor.
 * 
 * @param {number} rolloffFactor - How quickly the volume is reduced as the
 * source moves away from the listener.
 */
DynamicAudio.prototype.setRolloffFactor = function( rolloffFactor ) {

	this._panner.rolloffFactor = rolloffFactor;
};

/**
 * Gets the maxDistance.
 * 
 * @return {number} Maximum distance between the audio source and the listener,
 * after which the volume is not reduced any further.
 */
DynamicAudio.prototype.getMaxDistance = function() {

	return this._panner.maxDistance;
};

/**
 * Sets the maxDistance.
 * 
 * @param {number} maxDistance - Maximum distance between the audio source and
 * the listener, after which the volume is not reduced any further.
 */
DynamicAudio.prototype.setMaxDistance = function( maxDistance ) {

	this._panner.maxDistance = maxDistance;
};

/**
 * Special method to add specific spatial effects to a dynamic audio.
 * 
 * @param {number} coneInnerAngle - Describing the angle, in degrees, of a cone
 * inside of which there will be no volume reduction.
 * @param {number} coneOuterAngle - Describing the angle, in degrees, of a cone
 * outside of which the volume will be reduced by a constant value, defined by
 * the coneOuterGain attribute.
 * @param {number} coneOuterGain - Describing the amount of volume reduction
 * outside the cone defined by the coneOuterAngle attribute. Its default value
 * is 0, meaning that no sound can be heard.
 */
DynamicAudio.prototype.addDirection = function( coneInnerAngle, coneOuterAngle, coneOuterGain ) {

	this._panner.coneInnerAngle = coneInnerAngle;
	this._panner.coneOuterAngle = coneOuterAngle;
	this._panner.coneOuterGain = coneOuterGain;
};

/**
 * Adds a custom function, that calculates pitch variations.
 * 
 * @param {function} pitchVariation - Function for calculation pitch variations.
 */
DynamicAudio.prototype.addPitchVariation = function( pitchVariation ) {

	this._pitchVariation = pitchVariation;
};

/**
 * This method updates the position of the dynamicAudio in 3D-space. Only then,
 * spatial sound effects can be emitted correctly.
 * 
 * @param {boolean} force - Flag for calculation the world matrix.
 */
DynamicAudio.prototype.updateMatrixWorld = ( function() {

	var position = new THREE.Vector3();

	return function( force ) {

		THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

		position.setFromMatrixPosition( this.matrixWorld );

		this._panner.setPosition( position.x, position.y, position.z );
	};
} )();

module.exports = DynamicAudio;