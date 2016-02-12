/**
 * @file This prototype enables ordinary 3D-Objects to be interactive. Any
 * action object is part of the collision-detection logic and ready for
 * interacting with the player.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );
var OBB = require( "../etc/OBB" );

/**
 * Creates an action object.
 * 
 * @constructor
 * 
 * @param {THREE.Mesh} mesh - The mesh object.
 * @param {number} collisionType - The type of collision detection.
 * @param {number} raycastPrecision - The precision of the raycast operation.
 * @param {Action} action - The action, that should be executed.
 */
function ActionObject( mesh, collisionType, raycastPrecision, action ) {

	Object.defineProperties( this, {
		mesh : {
			value : mesh,
			configurable : false,
			enumerable : true,
			writable : true
		},
		collisionType : {
			value : collisionType,
			configurable : false,
			enumerable : true,
			writable : true
		},
		raycastPrecision : {
			value : raycastPrecision,
			configurable : false,
			enumerable : true,
			writable : true
		},
		action : {
			value : action,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// if the action object never changes its position or orientation, you
		// can set this value to false to prevent the update of bounding volumes
		autoUpdate : {
			value : true,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// bounding volumes
		boundingSphere : {
			value : new THREE.Sphere(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		aabb : {
			value : new THREE.Box3(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		obb : {
			value : new OBB(),
			configurable : false,
			enumerable : true,
			writable : true
		}

	} );

	// compute default bounding volumes
	this.mesh.geometry.computeBoundingBox();
	this.mesh.geometry.computeBoundingSphere();
	
	// update the action object at least once
	this.update();
}

/**
 * This method will update the bounding volumes of the action object.
 */
ActionObject.prototype.update = function() {

	if ( this.autoUpdate === true )
	{
		// update bounding sphere
		this.boundingSphere.copy( this.mesh.geometry.boundingSphere );
		this.boundingSphere.applyMatrix4( this.mesh.matrixWorld );

		// update other bounding volumes if necessary
		if ( this.collisionType === ActionObject.COLLISIONTYPES.AABB || this.raycastPrecision === ActionObject.RAYCASTPRECISION.AABB )
		{
			this.aabb.copy( this.mesh.geometry.boundingBox );
			this.aabb.applyMatrix4( this.mesh.matrixWorld );
		}

		if ( this.collisionType === ActionObject.COLLISIONTYPES.OBB || this.raycastPrecision === ActionObject.RAYCASTPRECISION.OBB )
		{
			this.obb.setFromObject( this.mesh );
		}

	}
};

/**
 * This method detects an intersection between the raycaster and the relevant
 * object. According to raycast precision, different algorithm are used to
 * detect an intersection.
 * 
 * @param {THREE.Raycaster} raycaster - A raycaster instance.
 * @param {object} intersects - An array with intersection points.
 */
ActionObject.prototype.raycast = function( raycaster, intersects ) {

	var intersectsRay = [], intersectionPoint, index, distance;

	// check raycast precision
	switch ( this.raycastPrecision )
	{

		case ActionObject.RAYCASTPRECISION.AABB:
		{
			intersectionPoint = raycaster.ray.intersectBox( this.aabb );

			break;
		}

		case ActionObject.RAYCASTPRECISION.OBB:
		{
			intersectionPoint = this.obb.intersectRay( raycaster.ray );

			break;
		}

		case ActionObject.RAYCASTPRECISION.FACE:
		{
			// call default raycast method of the mesh object
			this.mesh.raycast( raycaster, intersectsRay );

			for ( index = 0; index < intersectsRay.length; index++ )
			{
				// set the action object as result object
				intersectsRay[ index ].object = this;

				// push to result array
				intersects.push( intersectsRay[ index ] );
			}
			
			// reset array for next call
			intersectsRay.length = 0;

			break;
		}

		default:
		{
			throw "ERROR: ActionObject: No valid raycast precision applied to object.";
		}

	}

	// if a single intersectionPoint is found, we need to calculate
	// additional data and push the point into the intersects array
	if ( intersectionPoint !== undefined && intersectionPoint !== null )
	{
		// get the distance to the intersection point
		distance = raycaster.ray.origin.distanceTo( intersectionPoint );

		if ( distance >= raycaster.near && distance <= raycaster.far )
		{
			// store the result in special data structure, see
			// THREE.Mesh.raycast
			intersects.push( {
				distance : distance,
				point : intersectionPoint,
				face : null,
				faceIndex : null,
				object : this
			} );
		}
	}
};

/**
 * This method detects an intersection between the given bounding box and the
 * bounding volume of the action object.
 * 
 * @param {THREE.Box3} boundingBox - The boundingBox of the controls.
 * 
 * @returns {boolean} Intersects the object with the given bounding box?
 */
ActionObject.prototype.intersects = function( boundingBox ) {

	var intersection = false;

	// check type of collision test
	switch ( this.collisionType )
	{

		case ActionObject.COLLISIONTYPES.AABB:
		{
			intersection = this.aabb.intersectsBox( boundingBox );

			break;
		}

		case ActionObject.COLLISIONTYPES.OBB:
		{
			intersection = this.obb.intersectsAABB( boundingBox );

			break;
		}

		default:
		{
			throw "ERROR: ActionObject: No valid collision type applied to object.";
		}
	}

	return intersection;

};

ActionObject.COLLISIONTYPES = {
	AABB : 0,
	OBB : 1
};

ActionObject.RAYCASTPRECISION = {
	AABB : 0,
	OBB : 1,
	FACE : 2
};

module.exports = ActionObject;