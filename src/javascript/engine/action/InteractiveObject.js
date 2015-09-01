/**
 * @file The prototype InteractiveObject enables ordinary 3D-Objects to be interactive. 
 * Any interactive object is part of the collision-detection logic and ready for interacting with the player.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");
var OBB = require("../etc/OBB");

/**
 * Creates an interactive object.
 * 
 * @constructor
 * 
 * @param {THREE.Mesh} mesh - The mesh object.
 * @param {number} collisionType - The type of collision detection.
 * @param {number} raycastPrecision - The precision of the raycast operation.
 * @param {Action} action - The action, that should be executed.
 */
function InteractiveObject(mesh, collisionType, raycastPrecision, action) {

	Object.defineProperties(this, {
		mesh: {
			value: mesh,
			configurable: false,
			enumerable: true,
			writable: true
		},
		collisionType: {
			value: collisionType,
			configurable: false,
			enumerable: true,
			writable: true
		},
		raycastPrecision: {
			value: raycastPrecision,
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
		},
		// bounding volumes
		_aabb: {
			value: new THREE.Box3(),
			configurable: false,
			enumerable: false,
			writable: true
		},
		_obb: {
			value: new OBB(),
			configurable: false,
			enumerable: false,
			writable: true
		},
		
	});
}

/**
 * This method detects an intersection between the raycaster and the 
 * relevant object. According to raycast precision, different algorithm
 * are used to detect an intersection.
 * 
 * 
 * @param {THREE.Raycaster} raycaster - A raycaster instance.
 * @param {object} intersects - An array with intersection points.
 */
InteractiveObject.prototype.raycast = ( function(){
	
	var index = 0;
	var intersectsRay = [];
	
	return function(raycaster, intersects){
		
		if( this.raycastPrecision === InteractiveObject.RAYCASTPRECISION.FACE ){
			
			// call default raycast method of the mesh object
			this.mesh.raycast(raycaster, intersectsRay);
			
			for(index = 0; index < intersectsRay.length; index++){
				
				// set the interactive object as result object, not mesh
				intersectsRay[index].object = this;
				
				// push to result array
				intersects.push(intersectsRay[index]);
			}
			 // reset the array for next call
			intersectsRay.length = 0;
			
		}else{
		
			if (this.mesh.geometry.boundingBox === null){
				this.mesh.geometry.computeBoundingBox();
			}

			this._aabb.copy(this.mesh.geometry.boundingBox);
			this._aabb.applyMatrix4(this.mesh.matrixWorld);

			// do intersection test
			this._intersectionPoint = raycaster.ray.intersectBox(this._aabb);

			if ( this._intersectionPoint !== null)  {
				
				// get the distance to the intersection point
				this._distance = raycaster.ray.origin.distanceTo(this._intersectionPoint);
				
				if (this._distance >= raycaster.precision && this._distance >= raycaster.near && this._distance <= raycaster.far){
				
					// store the result in special data structure, see THREE.Mesh.raycast
					intersects.push({
						distance: this._distance,
						point: this._intersectionPoint,
						face: null,
						faceIndex: null,
						object: this
					});
				}
			}
			
		}
	};
	
}());
	
/**
 * This method detects an intersection between the bounding box
 * of the controls and the bounding volume of the interactive object.
 * 
 * @param {THREE.Box3} boundingBox - The boundingBox of the controls.
 */
InteractiveObject.prototype.isIntersection = function( boundingBox ){
	
	if( this.collisionType === InteractiveObject.COLLISIONTYPES.OBB ){
		
		this._obb.setFromObject( this.mesh );
		return this._obb.isIntersectionAABB( boundingBox );
		
	}else{
		
		if (this.mesh.geometry.boundingBox === null){
			this.mesh.geometry.computeBoundingBox();
		}
	
		this._aabb.copy(this.mesh.geometry.boundingBox);
		this._aabb.applyMatrix4(this.mesh.matrixWorld);
		
		return this._aabb.isIntersectionBox(boundingBox);
	}
};

InteractiveObject.COLLISIONTYPES = {
	AABB: 0,
	OBB: 1
};

InteractiveObject.RAYCASTPRECISION = {
	AABB: 0,
	FACE: 1
};

module.exports = InteractiveObject;