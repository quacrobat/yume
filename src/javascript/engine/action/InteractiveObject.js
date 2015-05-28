/**
 * @file The prototype InteractiveObject enables ordinary 3D-Objects to be interactive. 
 * Any interactive object is part of the collision-detection logic and ready for interacting with the player.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

/**
 * Creates an interactive object.
 * 
 * @constructor
 * 
 * @param {THREE.Object3D} object - An arbitrary 3D-Object.
 * @param {Action} action - The action, that should be executed.
 */
function InteractiveObject(object, action) {

	Object.defineProperties(this, {
		object: {
			value: object,
			configurable: false,
			enumerable: true,
			writable: true
		},
		action: {
			value: action,
			configurable: false,
			enumerable: true,
			writable: true
		},
		_boundingBox: {
			value: new THREE.Box3(),
			configurable: false,
			enumerable: false,
			writable: true
		},
		_distance: {
			value: 0,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_intersectionPoint: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
}

/**
 * This method is detects an intersection between the raycaster and the 
 * relevant object. The actual raycast-method of THREE.Mesh, which calculates
 * intersections via the faces of an object, is not used in this application.
 * Because of a better performance, this method uses only bounding boxes.
 * 
 * 
 * @param {THREE.Raycaster} raycaster - A raycaster instance.
 * @param {object} intersects - An array with intersection points.
 */
InteractiveObject.prototype.raycast = function(raycaster, intersects){
	
	if (this.object.geometry.boundingBox === null){
		this.object.geometry.computeBoundingBox();
	}

	this._boundingBox.copy(this.object.geometry.boundingBox);
	this._boundingBox.applyMatrix4(this.object.matrixWorld);

	this._intersectionPoint = raycaster.ray.intersectBox(this._boundingBox);

	if ( this._intersectionPoint !== null)  {
		
		this._distance = raycaster.ray.origin.distanceTo(this._intersectionPoint);
		
		if (this._distance >= raycaster.precision && this._distance >= raycaster.near && this._distance <= raycaster.far){
		
			intersects.push({
				distance: this._distance,
				point: this._intersectionPoint,
				face: null,
				faceIndex: null,
				object: this
			});
		}
	}
	
};

/**
 * This method is detects an intersection between the bounding box
 * of the controls and the AABB of the static object.
 * 
 * @param {THREE.Box3} boundingBox - The boundingBox of the controls.
 */
InteractiveObject.prototype.isIntersectionBox = function(boundingBox){
	
	if (this.object.geometry.boundingBox === null){
		this.object.geometry.computeBoundingBox();
	}

	this._boundingBox.copy(this.object.geometry.boundingBox);
	this._boundingBox.applyMatrix4(this.object.matrixWorld);
	
	return this._boundingBox.isIntersectionBox(boundingBox);
};	

module.exports = InteractiveObject;