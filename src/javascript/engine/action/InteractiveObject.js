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
function InteractiveObject( mesh, collisionType, raycastPrecision, action ) {

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
		// bounding volumes
		boundingSphere: {
			value: new THREE.Sphere(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		aabb: {
			value: new THREE.Box3(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		obb: {
			value: new OBB(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		
	});
	
	// compute default bounding volumes
	this.mesh.geometry.computeBoundingBox();
	this.mesh.geometry.computeBoundingSphere();
}

/**
 * Updates the static object.
 */
InteractiveObject.prototype.update = function(){
	
	// always update bounding sphere
	// other bounding volumes are only calculated if required
	this.boundingSphere.copy( this.mesh.geometry.boundingSphere );
	this.boundingSphere.applyMatrix4( this.mesh.matrixWorld );
};

/**
 * This method detects an intersection between the raycaster and the 
 * relevant object. According to raycast precision, different algorithm
 * are used to detect an intersection.
 * 
 * @param {THREE.Raycaster} raycaster - A raycaster instance.
 * @param {object} intersects - An array with intersection points.
 */
InteractiveObject.prototype.raycast = ( function(){
	
	var index = 0;
	var intersectsRay = [];
	var intersectionPoint = null;
	var distance = 0;
	
	return function( raycaster, intersects ){
		
		// check raycast precision
		switch ( this.raycastPrecision ){
		
			case InteractiveObject.RAYCASTPRECISION.AABB: {
							
				// apply transformation
				this.aabb.copy( this.mesh.geometry.boundingBox );
				this.aabb.applyMatrix4( this.mesh.matrixWorld );
				
				// do intersection test
				intersectionPoint = raycaster.ray.intersectBox( this.aabb );
				
				break;
			}
			
			case InteractiveObject.RAYCASTPRECISION.OBB: {
				
				// calculate OBB
				this.obb.setFromObject( this.mesh );
				
				// do intersection test
				intersectionPoint = this.obb.intersectRay( raycaster.ray );
				
				break;
			}
			
			case InteractiveObject.RAYCASTPRECISION.FACE: {
				
				// call default raycast method of the mesh object
				this.mesh.raycast( raycaster, intersectsRay );
				
				for( index = 0; index < intersectsRay.length; index++ ){
					
					// set the interactive object as result object
					intersectsRay[ index ].object = this;
					
					// push to result array
					intersects.push( intersectsRay[ index ] );
				}
				 // reset array for next call
				intersectsRay.length = 0;
				
				break;
			}
			
			default: {
				
				throw "ERROR: InteractiveObject: No valid raycast precision applied to object.";
			}
		
		}
		
		// if a single intersectionPoint is found, we need to calculate
		// additional data and push the point into the intersects array
		if ( intersectionPoint !== null)  {
			
			// get the distance to the intersection point
			distance = raycaster.ray.origin.distanceTo(intersectionPoint);
			
			if (distance >= raycaster.precision && distance >= raycaster.near && distance <= raycaster.far){
			
				// store the result in special data structure, see THREE.Mesh.raycast
				intersects.push({
					distance: distance,
					point: intersectionPoint,
					face: null,
					faceIndex: null,
					object: this
				});
			}
			
			// reset value
			intersectionPoint = null;
		}
		
	};
	
}());
	
/**
 * This method detects an intersection between the given bounding box
 * and the bounding volume of the interactive object.
 * 
 * @param {THREE.Box3} boundingBox - The boundingBox of the controls.
 * 
 * @returns {boolean} Intersects the object with the given bounding box?
 */
InteractiveObject.prototype.isIntersection = ( function(){
	
	var isIntersection;
	
	return function( boundingBox ){
		
		isIntersection = false;
		
		// check type of collision test
		switch ( this.collisionType ){
		
			case InteractiveObject.COLLISIONTYPES.AABB: {
				
				// apply transformation
				this.aabb.copy( this.mesh.geometry.boundingBox );
				this.aabb.applyMatrix4( this.mesh.matrixWorld );
				
				// do intersection test
				isIntersection = this.aabb.isIntersectionBox( boundingBox );
				
				break;
			}
		
			case InteractiveObject.COLLISIONTYPES.OBB: {
				
				// calculate OBB
				this.obb.setFromObject( this.mesh );
				
				// do intersection test
				isIntersection =  this.obb.isIntersectionAABB( boundingBox );
				
				break;
			}
			
			default: {
				
				throw "ERROR: InteractiveObject: No valid collision type applied to object.";
			}
		}
		
		return isIntersection;
		
	};
	
} ( ) );

InteractiveObject.COLLISIONTYPES = {
	AABB: 0,
	OBB: 1
};

InteractiveObject.RAYCASTPRECISION = {
	AABB: 0,
	OBB: 1,
	FACE: 2
};

module.exports = InteractiveObject;