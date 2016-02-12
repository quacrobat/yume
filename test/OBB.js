/**
 * @file Test file for "Oriented Bounding Box".
 * 
 * @author Human Interactive
 */

"use strict";

var assert = require( "assert" );
var THREE = require( "three" );
var OBB = require( "../src/javascript/engine/etc/OBB" );

describe( "OBB", function() {

	describe( "#setFromObject()", function() {

		it( "should generate an OBB from a mesh object", function() {

			var geoemtry = new THREE.BoxGeometry( 10, 10, 10 );
			var material = new THREE.MeshBasicMaterial();
			var mesh = new THREE.Mesh( geoemtry, material );

			mesh.rotation.set( 0, Math.PI, 0 );

			var obb = new OBB();
			obb.setFromObject( mesh );

			assert.equal( true, obb.position.equals( new THREE.Vector3( 0, 0, 0 ) ) );
			assert.equal( true, obb.halfSizes.equals( new THREE.Vector3( 5, 5, 5 ) ) );
			assert.equal( true, obb.basis.equals( new THREE.Matrix4().makeRotationY( Math.PI ) ) );

		} );

	} );

	describe( "#setFromAABB()", function() {

		it( "should generate an OBB from an axis-aligned bounding box", function() {

			var aabb = new THREE.Box3();
			aabb.setFromCenterAndSize( new THREE.Vector3(), new THREE.Vector3( 10, 10, 10 ) );

			var obb = new OBB();
			obb.setFromAABB( aabb );

			assert.equal( true, obb.position.equals( new THREE.Vector3( 0, 0, 0 ) ) );
			assert.equal( true, obb.halfSizes.equals( new THREE.Vector3( 5, 5, 5 ) ) );

		} );

	} );

	describe( "#setFromSphere()", function() {

		it( "should generate an OBB from a bounding sphere", function() {

			var sphere = new THREE.Sphere( new THREE.Vector3(), 5 );

			var obb = new OBB();
			obb.setFromSphere( sphere );

			assert.equal( true, obb.position.equals( new THREE.Vector3( 0, 0, 0 ) ) );
			assert.equal( true, obb.halfSizes.equals( new THREE.Vector3( 5, 5, 5 ) ) );

		} );

	} );

	describe( "#closestPoint()", function() {

		it( "should compute the closest point inside the OBB of a given point", function() {

			var point1 = new THREE.Vector3();
			var point2 = new THREE.Vector3( -10, -10, -10 );
			var point3 = new THREE.Vector3( 10, 10, 10 );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.closestPoint( point1 ).equals( new THREE.Vector3( 0, 0, 0 ) ) );
			assert.equal( true, obb.closestPoint( point2 ).equals( new THREE.Vector3( -5, -5, -5 ) ) );
			assert.equal( true, obb.closestPoint( point3 ).equals( new THREE.Vector3( 5, 5, 5 ) ) );

		} );

	} );

	describe( "#isPointContained()", function() {

		it( "should return true if a point is inside the OBB", function() {

			var point1 = new THREE.Vector3();
			var point2 = new THREE.Vector3( -10, -10, -10 );
			var point3 = new THREE.Vector3( 10, 10, 10 );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.isPointContained( point1 ) );
			assert.equal( false, obb.isPointContained( point2 ) );
			assert.equal( false, obb.isPointContained( point3 ) );

		} );

	} );

	describe( "#isAABBContained()", function() {

		it( "should return true if an AABB is fully inside the OBB", function() {

			var aabb1 = new THREE.Box3();
			var aabb2 = new THREE.Box3();
			var aabb3 = new THREE.Box3();
			aabb1.setFromCenterAndSize( new THREE.Vector3(), new THREE.Vector3( 2, 2, 2 ) );
			aabb2.setFromCenterAndSize( new THREE.Vector3(), new THREE.Vector3( 10, 10, 10 ) );
			aabb3.setFromCenterAndSize( new THREE.Vector3(), new THREE.Vector3( 12, 12, 12 ) );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.isAABBContained( aabb1 ) );
			assert.equal( true, obb.isAABBContained( aabb2 ) );
			assert.equal( false, obb.isAABBContained( aabb3 ) );

		} );

	} );

	describe( "#isLineContained()", function() {

		it( "should return true if a line is fully inside the OBB", function() {

			var line1 = new THREE.Line3( new THREE.Vector3( -2, -2, -2 ), new THREE.Vector3( 2, 2, 2 ) );
			var line2 = new THREE.Line3( new THREE.Vector3( -5, -5, -5 ), new THREE.Vector3( 5, 5, 5 ) );
			var line3 = new THREE.Line3( new THREE.Vector3( -7, -7, -7 ), new THREE.Vector3( 7, 7, 7 ) );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.isLineContained( line1 ) );
			assert.equal( true, obb.isLineContained( line2 ) );
			assert.equal( false, obb.isLineContained( line3 ) );

		} );

	} );

	describe( "#isTriangleContained()", function() {

		it( "should return true if a triangle is fully inside the OBB", function() {

			var triangle1 = new THREE.Triangle( new THREE.Vector3( 2, 2, 2 ), new THREE.Vector3( -2, 2, 2 ), new THREE.Vector3( 2, 2, -2 ) );
			var triangle2 = new THREE.Triangle( new THREE.Vector3( 7, 7, 7 ), new THREE.Vector3( -7, 7, 7 ), new THREE.Vector3( 7, 7, -7 ) );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.isTriangleContained( triangle1 ) );
			assert.equal( false, obb.isTriangleContained( triangle2 ) );

		} );

	} );

	describe( "#intersectsAABB()", function() {

		it( "should return true if there is an intersection between a given AABB and the OBB", function() {

			var aabb1 = new THREE.Box3();
			var aabb2 = new THREE.Box3();
			var aabb3 = new THREE.Box3();
			var aabb4 = new THREE.Box3();
			aabb1.setFromCenterAndSize( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 2, 2, 2 ) );
			aabb2.setFromCenterAndSize( new THREE.Vector3( 2, 2, 2 ), new THREE.Vector3( 2, 2, 2 ) );
			aabb3.setFromCenterAndSize( new THREE.Vector3( 6, 6, 6 ), new THREE.Vector3( 2, 2, 2 ) );
			aabb4.setFromCenterAndSize( new THREE.Vector3( 8, 8, 8 ), new THREE.Vector3( 2, 2, 2 ) );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.intersectsAABB( aabb1 ) );
			assert.equal( true, obb.intersectsAABB( aabb2 ) );
			assert.equal( true, obb.intersectsAABB( aabb3 ) );
			assert.equal( false, obb.intersectsAABB( aabb4 ) );

		} );

	} );

	describe( "#intersectsSphere()", function() {

		it( "should return true if there is an intersection between a given BS and the OBB", function() {

			var sphere1 = new THREE.Sphere( new THREE.Vector3( 0, 0, 0 ), 2 );
			var sphere2 = new THREE.Sphere( new THREE.Vector3( 2, 2, 2 ), 2 );
			var sphere3 = new THREE.Sphere( new THREE.Vector3( 6, 6, 6 ), 2 );
			var sphere4 = new THREE.Sphere( new THREE.Vector3( 8, 8, 8 ), 2 );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.intersectsSphere( sphere1 ) );
			assert.equal( true, obb.intersectsSphere( sphere2 ) );
			assert.equal( true, obb.intersectsSphere( sphere3 ) );
			assert.equal( false, obb.intersectsSphere( sphere4 ) );

		} );

	} );

	describe( "#intersectsOBB()", function() {

		it( "should return true if there is an intersection between a given OBB and the OBB", function() {

			var obb1 = new OBB( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 2, 2, 2 ) );
			var obb2 = new OBB( new THREE.Vector3( 2, 2, 2 ), new THREE.Vector3( 2, 2, 2 ) );
			var obb3 = new OBB( new THREE.Vector3( 6, 6, 6 ), new THREE.Vector3( 2, 2, 2 ) );
			var obb4 = new OBB( new THREE.Vector3( 8, 8, 8 ), new THREE.Vector3( 2, 2, 2 ) );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.intersectsOBB( obb1 ) );
			assert.equal( true, obb.intersectsOBB( obb2 ) );
			assert.equal( true, obb.intersectsOBB( obb3 ) );
			assert.equal( false, obb.intersectsOBB( obb4 ) );

		} );

	} );

	describe( "#intersectsPlane()", function() {

		it( "should return true if there is an intersection between a given plane and the OBB", function() {

			var plane1 = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0 );
			var plane2 = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 5 );
			var plane3 = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), -5 );
			var plane4 = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), -7 );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.intersectsPlane( plane1 ) );
			assert.equal( true, obb.intersectsPlane( plane2 ) );
			assert.equal( true, obb.intersectsPlane( plane3 ) );
			assert.equal( false, obb.intersectsPlane( plane4 ) );

		} );

	} );

	describe( "#intersectsRay()", function() {

		it( "should return true if there is an intersection between a given ray and the OBB", function() {

			var ray1 = new THREE.Ray( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 1, 0 ) );
			var ray2 = new THREE.Ray( new THREE.Vector3( 0, 0, 10 ), new THREE.Vector3( 0, 0, -1 ) );
			var ray3 = new THREE.Ray( new THREE.Vector3( 0, 10, 0 ), new THREE.Vector3( 0, -1, 0 ) );
			var ray4 = new THREE.Ray( new THREE.Vector3( 0, 10, 0 ), new THREE.Vector3( 0, 1, 0 ) );

			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			assert.equal( true, obb.intersectsRay( ray1 ) );
			assert.equal( true, obb.intersectsRay( ray2 ) );
			assert.equal( true, obb.intersectsRay( ray3 ) );
			assert.equal( false, obb.intersectsRay( ray4 ) );

		} );

	} );
	
	describe( "#size()", function() {

		it( "should return the double amount of the 'halfSizes' vector", function() {

			var halfSizes = new THREE.Vector3( 5, 5, 5 );
			var obb = new OBB( new THREE.Vector3(), halfSizes );

			assert.equal( true, obb.size().equals( halfSizes.multiplyScalar( 2 ) ) );

		} );

	} );

	describe( "#translate()", function() {

		it( "should translate the OBB by the given offset", function() {

			var offset = new THREE.Vector3( 2, 2, 2 );
			var obb = new OBB( new THREE.Vector3(), new THREE.Vector3( 5, 5, 5 ) );

			obb.translate( offset );

			assert.equal( true, obb.position.equals( offset ) );

		} );

	} );

	describe( "#copy()", function() {

		it( "should copy all values of an OBB to another OBB", function() {

			var obb1 = new OBB();
			var obb2 = new OBB( new THREE.Vector3( 2, 2, 2 ), new THREE.Vector3( 5, 5, 5 ) );

			obb1.copy( obb2 );

			assert.equal( true, obb1.position.equals( obb2.position ) );
			assert.equal( true, obb1.halfSizes.equals( obb2.halfSizes ) );
			assert.equal( true, obb1.basis.equals( obb2.basis ) );

		} );

	} );

	describe( "#clone()", function() {

		it( "should create a new instance with values from an existing OBB ", function() {

			var obb1 = new OBB( new THREE.Vector3( 2, 2, 2 ), new THREE.Vector3( 5, 5, 5 ) );
			var obb2 = obb1.clone();

			assert.equal( true, obb1.position.equals( obb2.position ) );
			assert.equal( true, obb1.halfSizes.equals( obb2.halfSizes ) );
			assert.equal( true, obb1.basis.equals( obb2.basis ) );

		} );

	} );

} );