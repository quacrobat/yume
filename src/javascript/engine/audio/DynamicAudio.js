/**
 * @file Prototype for creating dynamic, full-buffered audio objects.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");
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
 * @param {number} refDistance - Reference distance for reducing volume as the audio source moves further from the listener.
 * @param {number} rolloffFactor - How quickly the volume is reduced as the source moves away from the listener.
 * @param {number} maxDistance - Maximum distance between the audio source and the listener, after which the volume is not reduced any further.
 * @param {boolean} isStageIndependent - Should the audio independent of the stage?
 * 
 */
function DynamicAudio(id, listener, buffer, isLoop, refDistance, rolloffFactor, maxDistance, isStageIndependent) {
	
	THREE.Object3D.call( this );
	
	Object.defineProperties(this, {
		type: {
			value: "DynamicAudio",
			configurable: false,
			enumerable: true,
			writable: false
		},
		audioId: {
			value: id,
			configurable: false,
			enumerable: true,
			writable: false
		},
		context: {
			value: listener.context,
			configurable: false,
			enumerable: true,
			writable: false
		},
		gain: {
			value: listener.context.createGain(),
			configurable: false,
			enumerable: true,
			writable: false
		},
		panner: {
			value: listener.context.createPanner(),
			configurable: false,
			enumerable: true,
			writable: false
		},
		source: {
			value:listener.context.createBufferSource(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		isStageIndependent: {
			value: isStageIndependent || false,
			configurable: false,
			enumerable: true,
			writable: true
		},
		_needsRebuild: {
			value: false,
			configurable: false,
			enumerable: false,
			writable: true
		},
	});
	
	// audio-node for volume
	this.gain.connect(listener.gain);
	
	// audio-node for spatial sound effects
	this.panner.refDistance 	= refDistance || 1;
	this.panner.rolloffFactor	= rolloffFactor  || 1;
	this.panner.maxDistance		= maxDistance || 10000;
	this.panner.distanceModel 	= "linear";
	this.panner.panningModel	= "HRTF";
	this.panner.connect(this.gain);
	
	// audio-node for buffer source
	this.source.loop = isLoop || false;
	this.source.connect( this.panner );
	if(buffer !== undefined){
		this.source.buffer = buffer;
	}
}

DynamicAudio.prototype = Object.create(THREE.Audio.prototype);
DynamicAudio.prototype.constructor = DynamicAudio;

/**
 * Plays an audio file once. You always have to create a new AudioBufferSource when
 * playing the file more than one time.
 * 
 * @param {number} time - The time offset, where the audio file should start playing.
 */
DynamicAudio.prototype.play = function(time){
	
	if(this._needsRebuild === true){
		this.source.disconnect();
		var source = this.context.createBufferSource(); // sources can just played once, see https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
		source.buffer = this.source.buffer;
		source.loop = this.source.loop;
		source.connect(this.panner);		
		this.source = source;
		this.source.start(time || 0);
	}else{
		this.source.start(time || 0);
		this._needsRebuild = true;
	}
};

/**
 * Stops an audio file.
 * 
 * @param {number} time - The time offset, where the audio file should stop playing.
 */
DynamicAudio.prototype.stop = function(time){
	
	this.source.stop(time || 0);
};

/**
 * Sets the volume of the audio file.
 * 
 * @param {number} volume - The volume to set.
 */
DynamicAudio.prototype.setVolume = function(volume){
	
	this.gain.gain.value = volume;
};

/**
 * Sets the loop property of an AudioBufferSource.
 * 
 * @param {boolean} isLoop - The loop-flag to set.
 */
DynamicAudio.prototype.setLoop = function(isLoop){
	
	this.source.loop = isLoop;
};

/**
 * Sets the refDistance property of the PannerNode.
 * 
 * @param {number} refDistance - The refDistance to set.
 */
DynamicAudio.prototype.setRefDistance = function(refDistance){
	
	this.panner.refDistance = refDistance;
};

/**
 * Sets the rolloffFactor property of the PannerNode.
 * 
 * @param {number} rolloffFactor - The rolloffFactor to set.
 */
DynamicAudio.prototype.setRolloffFactor = function(rolloffFactor){
	
	this.panner.rolloffFactor = rolloffFactor;
};

/**
 * Sets the maxDistance property of the PannerNode.
 * 
 * @param {number} maxDistance - The maxDistance to set.
 */
DynamicAudio.prototype.setMaxDistance = function(maxDistance){
	
	this.panner.maxDistance = maxDistance;
};

/**
 * Sets the stageIndependent property of the dynamic audio .
 * 
 * @param {boolean} isStageIndependent - The stageIndependent-flag to set.
 */
DynamicAudio.prototype.setSceneIndependent = function(isStageIndependent){
	
	this.isStageIndependent = isStageIndependent;
};

/**
 * Special method to add specific spatial effects to a dynamic audio.
 * 
 * @param {number} coneInnerAngle - Describing the angle, in degrees, of a cone inside of which there will be no volume reduction.
 * @param {number} coneOuterAngle - Describing the angle, in degrees, of a cone outside of which the volume will be reduced by a constant value, defined by the coneOuterGain attribute.
 * @param {number} coneOuterGain - Describing the amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard.
 */
DynamicAudio.prototype.addDirection = function(coneInnerAngle, coneOuterAngle, coneOuterGain){
	
	this.panner.coneInnerAngle = coneInnerAngle;
	this.panner.coneOuterAngle = coneOuterAngle;
	this.panner.coneOuterGain  = coneOuterGain;
};

/**
 * This method updates the position of the dynamicAudio in 3D-space.
 * Only then, spatial sound effects can be emitted correctly.
 * 
 * @param {boolean} force - Flag for calculation the world matrix.
 */
DynamicAudio.prototype.updateMatrixWorld = ( function () {

	var position = new THREE.Vector3();

	return function ( force ) {

		THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

		position.setFromMatrixPosition( this.matrixWorld );

		this.panner.setPosition( position.x, position.y, position.z );
	};
})();

module.exports = DynamicAudio;