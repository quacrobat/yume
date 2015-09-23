/**
 * @file This prototype is used for LOD handling. It is an enhancement of the
 * LOD functionality of three.js. Instead of switching directly between LOD
 * objects, this prototype uses a linear blend over a short period of time. This
 * approach provides a smoother switch and so avoids popping.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 14.7.1, LOD Switching, Blend LODs
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );
/**
 * Creates a LOD instance.
 * 
 * @constructor
 * @augments THREE.LOD
 * 
 * @param {string} id - The id of the LOD instance.
 * @param {number} mode - The transition mode.
 * @param {Camera} camera - The camera object.
 * @param {number} threshold - The threshold where the blending is done.
 */
function LOD( id, mode, camera, threshold ) {

	THREE.LOD.call( this );

	Object.defineProperties( this, {
		idLOD : {
			value : id,
			configurable : false,
			enumerable : true,
			writable : false
		},
		mode : {
			value : mode || LOD.MODE.DIRECT,
			configurable : false,
			enumerable : true,
			writable : true
		},
		camera : {
			value : camera,
			configurable : false,
			enumerable : true,
			writable : true
		},
		threshold : {
			value : threshold || 0,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

LOD.prototype = Object.create( THREE.LOD.prototype );
LOD.prototype.constructor = LOD;

/**
 * Updates the LOD instance. Overwrites the standard method of three.js.
 * 
 * @param {Camera} camera - The camera object.
 */
LOD.prototype.update = ( function() {

	var positionCamera = new THREE.Vector3();
	var positionObject = new THREE.Vector3();

	var distance = 0; // calculated distance
	var edge = 0; // this distance marks the begin/end of the transition
	var opacity = 0; // opacity value for blending
	var index = 0; // index for loops
	var currentObject = null; // current object of the loop
	var previousObject = null; // previous object of the loop

	return function() {

		if ( this.mode === LOD.MODE.DIRECT )
		{
			// process code of parent prototype
			THREE.LOD.prototype.update.call( this, this.camera );

		}
		else if ( this.mode === LOD.MODE.SMOOTH )
		{
			// process LOD selection only if there are at least two objects
			if ( this.objects.length > 1 )
			{
				// get position of the camera and the LOD instance
				positionCamera.setFromMatrixPosition( this.camera.matrixWorld );
				positionObject.setFromMatrixPosition( this.matrixWorld );

				// calculate distance between camera and LOD instance
				distance = positionCamera.distanceTo( positionObject );

				// set first LOD object always visible and opaque
				this.objects[ 0 ].object.visible = true;
				this.objects[ 0 ].object.material.transparent = false;
				this.objects[ 0 ].object.material.opacity = 1;

				// start the iteration with the second object in the array
				for ( index = 1; index < this.objects.length; index++ )
				{
					// save current object
					currentObject = this.objects[ index ];
					previousObject = this.objects[ index - 1 ];

					// if the calculated distance is smaller than the
					// LOD-distance but greater than the threshold,
					// show the new object smoothly
					if ( distance < currentObject.distance && distance >= ( currentObject.distance - this.threshold ) )
					{
						edge = currentObject.distance - this.threshold;
						opacity = Math.min( ( distance - edge ) / this.threshold, 1 );

						currentObject.object.visible = true;
						currentObject.object.material.transparent = true;
						currentObject.object.material.opacity = opacity;

						previousObject.object.material.transparent = false;
						previousObject.object.material.opacity = 1;

						// if the calculated distance is greater than the
						// LOD-distance but smaller than the threshold,
						// hide the old object smoothly
					}
					else if ( distance >= currentObject.distance && distance < ( currentObject.distance + this.threshold ) )
					{
						edge = currentObject.distance + this.threshold;
						opacity = Math.max( ( edge - distance ) / this.threshold, 0 );

						currentObject.object.material.opacity = 1;
						currentObject.object.material.transparent = false;

						previousObject.object.material.transparent = true;
						previousObject.object.material.opacity = opacity;
					}

					// if the calculated distance is greater than the
					// LOD-distance plus the threshold, show/ hide fully the
					// objects
					else if ( distance >= currentObject.distance + this.threshold )
					{
						currentObject.object.visible = true;
						previousObject.object.visible = false;
					}

					// if no condition is true, exit the loop
					// this happens when the camera is very close to the LOD
					// instance so the object with the highest details is chosen
					else
					{
						break;
					}

				}

				// hide all subsequent objects and reset values
				// we use the index of the previous loop
				for ( ; index < this.objects.length; index++ )
				{
					this.objects[ index ].object.visible = false;
					this.objects[ index ].object.material.transparent = false;
					this.objects[ index ].object.material.opacity = 1;
				}
			}
		}
	};
}() );

LOD.MODE = {
	DIRECT : 0,
	SMOOTH : 1
};

module.exports = LOD;