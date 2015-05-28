/**
 * @file The prototype StaticObject enables ordinary 3D-Objects to be static. 
 * Any interactive object is part of the collision-detection logic.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

/**
 * Creates a static object.
 * 
 * @constructor
 * 
 * @param {THREE.Object3D} object - An arbitrary 3D-Object.
 */
function StaticObject(object, action) {

	Object.defineProperties(this, {
		object: {
			value: object,
			configurable: false,
			enumerable: true,
			writable: true
		},
		_boundingBox: {
			value: new THREE.Box3(),
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
}

/**
 * This method is detects an intersection between the bounding box
 * of the controls and the AABB of the static object.
 * 
 * @param {THREE.Box3} boundingBox - The boundingBox of the controls.
 */
StaticObject.prototype.isIntersectionBox = function(boundingBox){
	
	if (this.object.geometry.boundingBox === null){
		this.object.geometry.computeBoundingBox();
	}

	this._boundingBox.copy(this.object.geometry.boundingBox);
	this._boundingBox.applyMatrix4(this.object.matrixWorld);
	
	return this._boundingBox.isIntersectionBox(boundingBox);
};	

module.exports = StaticObject;