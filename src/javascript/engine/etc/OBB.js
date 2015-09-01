/**
 * @file A 3D arbitrarily oriented bounding box.
 * 
 * This data structure represents a box in 3D space. The local axes of this box can be arbitrarily oriented/rotated
 * with respect to the global world coordinate system. This allows OBBs to more tightly bound objects than AABBs do,
 * which always align with the world space axes. This flexibility has the drawback that the geometry tests and operations
 * involving OBBs are more costly, and representing an OBB in memory takes more space.
 * 
 * Reference: 
 * 
 * This file is a JavaScript/three.js implementation of the MathGeoLib by Jukka Jylänki. The prototype does not contain
 * the entire logic of the original source.
 * 
 * https://github.com/juj/MathGeoLib/blob/master/src/Geometry/OBB.h
 * https://github.com/juj/MathGeoLib/blob/master/src/Geometry/OBB.cpp
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require("three");

/**
 * Creates the OBB.
 * 
 * @constructor
 * 
 * @param {THREE.Vector3} position - The center position of the OBB.
 * @param {THREE.Vector3} halfSizes -  Stores half-sizes to x, y and z directions in the local space of the OBB.
 * @param {THREE.Matrix4} basis - Specifies normalized direction vectors for the local axes.
 */
function OBB(position, halfSizes, basis) {	
	
	Object.defineProperties(this, {
		position: {
			value: position || new THREE.Vector3(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		halfSizes: {
			value: halfSizes || new THREE.Vector3(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		basis: {
			value: basis || new THREE.Matrix4(),
			configurable: false,
			enumerable: true,
			writable: true
		},
		// The OBB-OBB test utilizes a SAT test to detect the intersection. A robust implementation requires
		// an epsilon threshold to test that the used axes are not degenerate.
		_epsilon: {
			value: 1e-3,
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
}

/**
 * Sets the OBB from a mesh. 
 * 
 * The basis of the objects world matrix is assumed to be orthogonal, which means no projection or shear is allowed. 
 * Additionally, the matrix must contain only uniform scaling.
 * 
 * @param {THREE.Mesh} object - The mesh object to convert to an OBB.
 * 
 * @returns {OBB} The reference to the OBB.
 */
OBB.prototype.setFromObject = (function( ){
	
	var vector = new THREE.Vector3();
	
	var aabb = null;
	var w = null;
	
	return function( object ){
		
		// calculate AABB, if necessary
		if( object.geometry.boundingBox === null ){
			object.geometry.computeBoundingBox();
		}
		
		// ensure, world matrix of the object is up to date
		object.updateMatrixWorld();
		
		// shortcuts
		aabb = object.geometry.boundingBox;
		w = object.matrixWorld.elements;
		
		// assign the transform center to the position member
		this.position = aabb.center().applyMatrix4( object.matrixWorld );
		
		// extract the rotation and assign it to the basis of the OBB
		// for numerical stability, you could orthonormalize the basis
		this.basis.extractRotation( object.matrixWorld );
		
		// calculate half sizes for each axis
		this.halfSizes = aabb.size().multiplyScalar( 0.5 );
		
		// extract the (uniform) scaling and apply it to the halfSizes
		var scale = vector.set( w[ 0 ], w[ 1 ], w[ 2 ] ).length();
		
		// do the scale
		this.halfSizes.multiplyScalar( scale );
		
		return this;
	};
	
} ( ) );

/**
 * Sets the OBB from an AABB.
 * 
 * @param {THREE.Box3} aabb - The AABB to convert to an OBB.
 * 
 * @returns {OBB} The reference to the OBB.
 */
OBB.prototype.setFromAABB = function( aabb ){
	
	this.position = aabb.center();
	
	this.halfSizes = aabb.size().multiplyScalar( 0.5 );
	
	this.basis.identity();
	
	return this;
};

/**
 * Sets the OBB from a Bounding Sphere.
 * 
 * @param {THREE.Sphere} sphere - The bounding sphere to convert to an OBB.
 * 
 * @returns {OBB} The reference to the OBB.
 */
OBB.prototype.setFromBS= function( sphere ){
	
	this.position = sphere.center;
	
	this.halfSizes.set( sphere.radius, sphere.radius, sphere.radius );
	
	this.basis.identity();
	
	return this;
};

/**
 * Tests if the given point is fully contained inside the OBB.
 *
 * @param {THREE.Vector3} point - The point to test.
 * 
 * @returns {boolean} Is the point contained inside the OBB?
 */
OBB.prototype.isPointContained = ( function( ){
	
	var vector = new THREE.Vector3();
	
	var xAxis = new THREE.Vector3();
	var yAxis = new THREE.Vector3();
	var zAxis = new THREE.Vector3();
	
	return function( point ){
		
		// calculate vector between point and center
		vector.subVectors( point, this.position );
		
		// extract each axis
		this.basis.extractBasis( xAxis, yAxis, zAxis );
		
		// project the calculated vector to each axis and 
		// compare the result with the respective half size.
		return Math.abs( vector.dot( xAxis ) ) <= this.halfSizes.x &&
			   Math.abs( vector.dot( yAxis ) ) <= this.halfSizes.y &&
			   Math.abs( vector.dot( zAxis ) ) <= this.halfSizes.z;
	};
	
} ( ) );

/**
 * Tests if the given AABB is fully contained inside the OBB.
 *
 * @param {THREE.Box3} aabb - The AABB to test.
 * 
 * @returns {boolean} Is the AABB fully contained inside the OBB?
 */
OBB.prototype.isAABBContained = ( function( ){
	
	var points = [
	              new THREE.Vector3(),
				  new THREE.Vector3(),
				  new THREE.Vector3(),
				  new THREE.Vector3(),
				  new THREE.Vector3(),
				  new THREE.Vector3(),
				  new THREE.Vector3(),
				  new THREE.Vector3()
	];
	
	return function( aabb ){
		
		// determine all corner points
		points[ 0 ].set( aabb.min.x, aabb.min.y, aabb.min.z );
		points[ 1 ].set( aabb.min.x, aabb.min.y, aabb.max.z );
		points[ 2 ].set( aabb.min.x, aabb.max.y, aabb.min.z );
		points[ 3 ].set( aabb.min.x, aabb.max.y, aabb.max.z );
		points[ 4 ].set( aabb.max.x, aabb.min.y, aabb.min.z );
		points[ 5 ].set( aabb.max.x, aabb.min.y, aabb.max.z );
		points[ 6 ].set( aabb.max.x, aabb.max.y, aabb.min.z );
		points[ 7 ].set( aabb.max.x, aabb.max.y, aabb.max.z );
		
		for(var index = 0; index < 8; ++index){
			
			// check each point
			if( this.isPointContained( points[ index ] ) === false){
				// as soon as one point is outside the OBB, return false
				return false;
			}
		}
		
		return true;
	};
	
} ( ) );

/**
 * Tests whether this OBB and the given AABB intersect.
 *
 * @param {THREE.Box3} box - The AABB to test.
 * 
 * @returns {boolean} Is there an intersection between the given AABB and the OBB?
 */
OBB.prototype.isIntersectionAABB = function( box ){
	
	return this.isIntersectionOBB( new OBB().setFromAABB( box ) );
};

/**
 * Tests whether this OBB and the given OBB intersect.
 * 
 * Reference: https://github.com/juj/MathGeoLib/blob/master/src/Geometry/OBB.cpp
 *
 * @param {OBB} box - The OBB to test.
 * 
 * @returns {boolean} Is there an intersection between the given OBB and the OBB?
 */
OBB.prototype.isIntersectionOBB = ( function(){
		
	var xAxisA = new THREE.Vector3();
	var yAxisA = new THREE.Vector3();
	var zAxisA = new THREE.Vector3();
	
	var xAxisB = new THREE.Vector3();
	var yAxisB = new THREE.Vector3();
	var zAxisB = new THREE.Vector3();
	
	var axisA = [];
	var axisB = [];
	var rotationMatrix = [[],[],[]];
	var rotationMatrixAbs = [[],[],[]];
	
	var halfSizeA = 0;
	var halfSizeB = 0;
	
	var translation = new THREE.Vector3();
	
	var vector = new THREE.Vector3();
	var t = 0, i = 0;
	
	return function( obb ){
		
		// extract each axis
		this.basis.extractBasis( xAxisA, yAxisA, zAxisA );
		obb.basis.extractBasis( xAxisB, yAxisB, zAxisB );
		
		// push basis vectors into arrays, so you can access them via indices
		axisA.push( xAxisA, yAxisA, zAxisA);
		axisB.push( xAxisB, yAxisB, zAxisB);
		
		// get translation vector
		vector.subVectors( obb.position , this.position );
		
		// express the translation vector in the coordinate frame of the current OBB (this)
		for(i = 0; i < 3; i++){
			translation.setComponent( i, vector.dot( axisA[i] ) );
		}
		
		// generate a rotation matrix that transforms from world space to the OBB's coordinate space
		for(i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				rotationMatrix[i][j] = axisA[i].dot( axisB[j] );
				rotationMatrixAbs[i][j] = Math.abs( rotationMatrix[i][j] ) + this._epsilon;
			}
		}

		// test the three major axes of this OBB
		for(i = 0; i < 3; i++){
			
			vector.set( rotationMatrixAbs[i][0], rotationMatrixAbs[i][1], rotationMatrixAbs[i][2] );
			
			halfSizeA = this.halfSizes.getComponent( i );
			halfSizeB = obb.halfSizes.dot( vector );
			
			if ( Math.abs( translation.getComponent( i ) ) > halfSizeA + halfSizeB ){
				return false;
			}
		}
		
		
		// test the three major axes of other OBB
		for(i = 0; i < 3; i++){
			
			vector.set( rotationMatrixAbs[0][i], rotationMatrixAbs[1][i], rotationMatrixAbs[2][i] );
			
			halfSizeA = this.halfSizes.dot( vector );
			halfSizeB = obb.halfSizes.getComponent( i );
			
			vector.set( rotationMatrix[0][i], rotationMatrix[1][i], rotationMatrix[2][i] );
			t = translation.dot( vector );
			
			if ( Math.abs( t ) > halfSizeA + halfSizeB ){
				return false;
			}
		}
		
		// test the 9 different cross-axes

		// A.x <cross> B.x
		halfSizeA = this.halfSizes.y * rotationMatrixAbs[2][0] + this.halfSizes.z * rotationMatrixAbs[1][0];
		halfSizeB = obb.halfSizes.y  * rotationMatrixAbs[0][2] + obb.halfSizes.z  * rotationMatrixAbs[0][1];
		
		t = translation.z * rotationMatrix[1][0] - translation.y * rotationMatrix[2][0];
		
		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// A.x < cross> B.y
		halfSizeA = this.halfSizes.y * rotationMatrixAbs[2][1] + this.halfSizes.z * rotationMatrixAbs[1][1];
		halfSizeB = obb.halfSizes.x  * rotationMatrixAbs[0][2] + obb.halfSizes.z  * rotationMatrixAbs[0][0];
		
		t = translation.z * rotationMatrix[1][1] - translation.y * rotationMatrix[2][1];

		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// A.x <cross> B.z
		halfSizeA = this.halfSizes.y * rotationMatrixAbs[2][2] + this.halfSizes.z * rotationMatrixAbs[1][2];
		halfSizeB = obb.halfSizes.x  * rotationMatrixAbs[0][1] + obb.halfSizes.y  * rotationMatrixAbs[0][0];
		
		t = translation.z * rotationMatrix[1][2] - translation.y * rotationMatrix[2][2];

		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// A.y <cross> B.x
		halfSizeA = this.halfSizes.x * rotationMatrixAbs[2][0] + this.halfSizes.z * rotationMatrixAbs[0][0];
		halfSizeB = obb.halfSizes.y  * rotationMatrixAbs[1][2] + obb.halfSizes.z  * rotationMatrixAbs[1][1];
		
		t = translation.x * rotationMatrix[2][0] - translation.z * rotationMatrix[0][0];

		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// A.y <cross> B.y
		halfSizeA = this.halfSizes.x * rotationMatrixAbs[2][1] + this.halfSizes.z * rotationMatrixAbs[0][1];
		halfSizeB = obb.halfSizes.x  * rotationMatrixAbs[1][2] + obb.halfSizes.z  * rotationMatrixAbs[1][0];
		
		t = translation.x * rotationMatrix[2][1] - translation.z * rotationMatrix[0][1];
	
		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// A.y <cross> B.z
		halfSizeA = this.halfSizes.x * rotationMatrixAbs[2][2] + this.halfSizes.z * rotationMatrixAbs[0][2];
		halfSizeB = obb.halfSizes.x  * rotationMatrixAbs[1][1] + obb.halfSizes.y  * rotationMatrixAbs[1][0];
		
		t = translation.x * rotationMatrix[2][2] - translation.z * rotationMatrix[0][2];
		
		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// A.z <cross> B.x
		halfSizeA = this.halfSizes.x * rotationMatrixAbs[1][0] + this.halfSizes.y * rotationMatrixAbs[0][0];
		halfSizeB = obb.halfSizes.y  * rotationMatrixAbs[2][2] + obb.halfSizes.z * rotationMatrixAbs[2][1];
		
		t = translation.y * rotationMatrix[0][0] - translation.x * rotationMatrix[1][0];
		
		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// A.z <cross> B.y
		halfSizeA = this.halfSizes.x * rotationMatrixAbs[1][1] + this.halfSizes.y * rotationMatrixAbs[0][1];
		halfSizeB = obb.halfSizes.x  * rotationMatrixAbs[2][2] + obb.halfSizes.z * rotationMatrixAbs[2][0];
		
		t = translation.y * rotationMatrix[0][1] - translation.x * rotationMatrix[1][1];

		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// A.z <cross> B.z
		halfSizeA = this.halfSizes.x * rotationMatrixAbs[1][2] + this.halfSizes.y * rotationMatrixAbs[0][2];
		halfSizeB = obb.halfSizes.x  * rotationMatrixAbs[2][1] + obb.halfSizes.y * rotationMatrixAbs[2][0];

		t = translation.y * rotationMatrix[0][2] - translation.x * rotationMatrix[1][2];
		
		if ( Math.abs( t ) > halfSizeA + halfSizeB ){
			return false;
		}
		
		// no separating axis exists, so the two OBB don't intersect
		return true;
	};
	
} ( ) );

module.exports = OBB;