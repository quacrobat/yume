/**
 * @file This prototype holds the central Web Audio context and
 * manages the requirements for spatial sound effects.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

/**
 * Creates an audioListener. The constructor creates the central WebAudio context
 * of the application and a gain-node for adjusting the master volume.
 * 
 * @constructor
 * @augments THREE.Object3D
 * 
 */
function AudioListener() {
	
	THREE.Object3D.call(this);
	
	// central Web Audio context
	global.window.AudioContext = global.window.AudioContext || global.window.webkitAudioContext;
	
	Object.defineProperties(this, {
		type: {
			value: "AudioListener",
			configurable: false,
			enumerable: true,
			writable: false
		},
		context: {
			value: new global.window.AudioContext(),
			configurable: false,
			enumerable: true,
			writable: false
		},
		gain: {
			value: {},
			configurable: false,
			enumerable: true,
			writable: true
		}
	});

	this.gain = this.context.createGain();
	this.gain.connect(this.context.destination);
}

AudioListener.prototype = Object.create(THREE.Object3D.prototype);
AudioListener.prototype.constructor = AudioListener;

/**
 * This method updates the position of the audioListener in 3D-space.
 * Only then, spatial sound effects can be emitted correctly.
 * 
 * @param {boolean} force - Flag for calculation the world matrix.
 */
AudioListener.prototype.updateMatrixWorld = (function() {

	var position = new THREE.Vector3();
	var quaternion = new THREE.Quaternion();
	var scale = new THREE.Vector3();

	var orientation = new THREE.Vector3();

	return function (force) {

		THREE.Object3D.prototype.updateMatrixWorld.call(this, force);

		var listener = this.context.listener;
		var up = this.up;

		this.matrixWorld.decompose(position, quaternion, scale);

		orientation.set(0, 0, -1).applyQuaternion(quaternion );

		listener.setPosition(position.x, position.y, position.z);
		listener.setOrientation( orientation.x, orientation.y, orientation.z, up.x, up.y, up.z);
	};

})();

module.exports = AudioListener;