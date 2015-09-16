/**
 * @file The prototype StaticObject enables ordinary 3D-Objects to be static. 
 * Any interactive object is part of the collision-detection logic.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");
var OBB = require("../etc/OBB");

/**
 * Creates a static object.
 * 
 * @constructor
 * 
 * @param {THREE.Mesh} mesh - The mesh object.
 * @param {number} collisionType - The type of collision detection.
 */
function StaticObject( object, collisionType ) {

	Object.defineProperties(this, {
		mesh: {
			value: object,
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
 * This method detects an intersection between the given bounding box
 * and the bounding volume of the static object.
 * 
 * @param {THREE.Box3} boundingBox - The boundingBox of the controls.
 * 
 * @returns {boolean} Intersects the object with the given bounding box?
 */
StaticObject.prototype.isIntersection = ( function(){
	
	var isIntersection;
	
	return function( boundingBox ){
		
		isIntersection = false;
		
		// check type of collision test
		switch ( this.collisionType ){
		
			case StaticObject.COLLISIONTYPES.AABB: {
				
				// compute bounding box only once
				if( this.mesh.geometry.boundingBox === null ){
					this.mesh.geometry.computeBoundingBox();
				}
				
				// apply transformation
				this._aabb.copy( this.mesh.geometry.boundingBox );
				this._aabb.applyMatrix4( this.mesh.matrixWorld );
				
				// do intersection test
				isIntersection = this._aabb.isIntersectionBox( boundingBox );
				
				break;
			}
		
			case StaticObject.COLLISIONTYPES.OBB: {
				
				// calculate OBB
				this._obb.setFromObject( this.mesh );
				
				// do intersection test
				isIntersection =  this._obb.isIntersectionAABB( boundingBox );
				
				break;
			}
			
			default: {
				
				throw "ERROR: StaticObject: No valid collision type applied to object.";
			}
		}
		
		return isIntersection;
		
	};
	
} ( ) );

StaticObject.COLLISIONTYPES = {
	AABB : 0,
	OBB : 1
};

module.exports = StaticObject;