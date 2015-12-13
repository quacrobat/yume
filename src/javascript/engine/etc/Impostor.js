/**
 * @file This prototype handles all stuff for impostors. An impostor is a
 * billboard that is created on the fly by rendering a complex object from the
 * current viewpoint into an image texture, which is mapped on the billboard.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 10.7.1, Impostors
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );
/**
 * Creates an impostor.
 * 
 * @constructor
 * 
 * @param {string} id - The id of the impostor.
 * @param {THREE.Object3D} sourceObject - The source 3D object of the impostor.
 * @param {number} resolution - The resolution of the rendered texture.
 * @param {number} angle - This value can be used to auto-generation the impostor.
 */
function Impostor( id, sourceObject, resolution, angle ) {

	Object.defineProperties( this, {
		idImpostor : {
			value : id,
			configurable : false,
			enumerable : true,
			writable : false
		},
		billboard : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		sourceObject : {
			value : sourceObject,
			configurable : false,
			enumerable : true,
			writable : false
		},
		resolution : {
			value : resolution || 128,
			configurable : false,
			enumerable : true,
			writable : true
		},
		angle : {
			value : angle || 30,
			configurable : false,
			enumerable : true,
			writable : true
		},
		_renderTarget : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		_boundingBox : {
			value : new THREE.Box3(),
			configurable : false,
			enumerable : false,
			writable : true
		},
		_boundingRectangle : {
			value : new THREE.Box2(),
			configurable : false,
			enumerable : false,
			writable : true
		},
		_depth : {
			value : Infinity,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_scene : {
			value : new THREE.Scene(),
			configurable : false,
			enumerable : false,
			writable : true
		},
		_camera : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_lastDirection : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// create render target
	this._renderTarget = new THREE.WebGLRenderTarget( this.resolution, this.resolution, {
		format : THREE.RGBAFormat,
		stencilBuffer : false
	} );

	// create the billboard
	this._createBillboard();
}

/**
 * Generates the impostor.
 * 
 * @param {Renderer} renderer - The renderer object.
 * @param {Camera} camera - The camera object.
 * @param {object} lights - The lights of the stage.
 */
Impostor.prototype.generate = function( renderer, camera, lights ) {

	// the matrices of the camera get transformed, so it's necessary to clone it
	this._camera = camera.clone();
	
	this._computeBoundingBox();

	this._computeViewMatrix();

	this._computeBoundingRectangle();

	this._computePosition();

	this._updateGeometry();

	this._computeProjectionMatrix();

	this._prepareScene( lights );

	this._render( renderer );
};

/**
 * Updates the model matrix of an impostor. The impostor is handled like a
 * viewpoint-oriented, axis-aligned billboard.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 10.6.2, World-Oriented Billboards
 * 
 * @param {THREE.Vector3} cameraPosition - The position of the camera.
 * 
 */
Impostor.prototype.update = ( function() {

	var xAxis = new THREE.Vector3(); // right
	var yAxis = new THREE.Vector3( 0, 1, 0 ); // up
	var zAxis = new THREE.Vector3(); // front

	return function( cameraPosition ) {

		// first, compute zAxis
		zAxis.subVectors( cameraPosition, this.billboard.position );
		
		// this will ensure, that the impostor rotates correctly around the axis
		zAxis.y = 0;
		zAxis.normalize();

		// compute the last axis with the cross product
		xAxis.crossVectors( yAxis, zAxis );

		// create new model matrix from basis vectors
		this.billboard.matrix.makeBasis( xAxis, yAxis, zAxis );

		// apply the position
		this.billboard.matrix.setPosition( this.billboard.position );

		// force world matrix to update
		this.billboard.matrixWorldNeedsUpdate = true;
		
	};

}() );

/**
 * Checks, if it's necessary to generate the impostor.
 * 
 * @param {THREE.Vector3} direction - The current direction from impostor to
 * camera.
 * 
 * @returns {boolean} Is a generation necessary?
 */
Impostor.prototype.isGenerationNeeded = function( currentDirection ) {

	var angle;

	// if "lastDirection" is null, we have nothing to compare. so we just save
	// the current direction in this step
	if ( this._lastDirection === null )
	{
		this._lastDirection.copy( currentDirection );

	}
	else
	{
		// compute the angle between current and last direction
		angle = Math.acos( this._lastDirection.dot( currentDirection ) );

		// convert radians to degrees
		angle *= ( 180 / Math.PI );

		// check against property
		if ( angle > this.angle * 0.5 )
		{
			// save the direction
			this._lastDirection = currentDirection.clone();

			// return true to trigger a generation
			return true;
		}
	}

	return false;

};

/**
 * Creates the billboard of the impostor.
 */
Impostor.prototype._createBillboard = function() {

	// create billboard geometry
	var billboardGeomtry = new THREE.BufferGeometry();
	
	// create buffers
	var positionBuffer = new Float32Array( 12 );
	var uvBuffer = new Float32Array( [ 0, 0, 0, 1, 1, 0, 1, 1 ] );
	var indexBuffer = new Uint16Array( [ 0, 2, 1, 2, 3, 1 ] );

	// add buffers to geometry
	billboardGeomtry.addAttribute( "position", new THREE.BufferAttribute( positionBuffer, 3 ) );
	billboardGeomtry.addAttribute( "uv", new THREE.BufferAttribute( uvBuffer, 2 ) );
	billboardGeomtry.setIndex( new THREE.BufferAttribute( indexBuffer, 1 ) );

	// create billboard material. the alpha value avoids
	// semi-transparent black borders at the billboard
	var billboardMaterial = new THREE.MeshBasicMaterial( {
		map : this._renderTarget,
		transparent : true,
		alphaTest : 0.9
	} );

	// create billboard
	this.billboard = new THREE.Mesh( billboardGeomtry, billboardMaterial );

	// the model matrix is calculated by the impostor so disable the automatic
	// update
	this.billboard.matrixAutoUpdate = false;
};

/**
 * Computes the axis-aligned bounding box of the object.
 */
Impostor.prototype._computeBoundingBox = function() {

	this._boundingBox.setFromObject( this.sourceObject );
};

/**
 * Prepares the camera for rendering.
 */
Impostor.prototype._computeViewMatrix = function() {

	// the camera should look at the center of the AABB
	this._camera.lookAt( this._boundingBox.center() );

	// compute new matrices
	this._camera.updateMatrix();
	this._camera.updateMatrixWorld();
	this._camera.matrixWorldInverse.getInverse( this._camera.matrixWorld );
};

/**
 * Computes the bounding rectangle of the impostor. This 2D bounding box is the
 * impostor in screen-space.
 */
Impostor.prototype._computeBoundingRectangle = function() {

	var points = [ new THREE.Vector3(), 
	               new THREE.Vector3(), 
	               new THREE.Vector3(), 
	               new THREE.Vector3(), 
	               new THREE.Vector3(), 
	               new THREE.Vector3(), 
	               new THREE.Vector3(), 
	               new THREE.Vector3() ];

	// calculate each point of the bounding box
	points[ 0 ].set( this._boundingBox.min.x, this._boundingBox.min.y, this._boundingBox.min.z );
	points[ 1 ].set( this._boundingBox.min.x, this._boundingBox.min.y, this._boundingBox.max.z );
	points[ 2 ].set( this._boundingBox.min.x, this._boundingBox.max.y, this._boundingBox.min.z );
	points[ 3 ].set( this._boundingBox.min.x, this._boundingBox.max.y, this._boundingBox.max.z );
	points[ 4 ].set( this._boundingBox.max.x, this._boundingBox.min.y, this._boundingBox.min.z );
	points[ 5 ].set( this._boundingBox.max.x, this._boundingBox.min.y, this._boundingBox.max.z );
	points[ 6 ].set( this._boundingBox.max.x, this._boundingBox.max.y, this._boundingBox.min.z );
	points[ 7 ].set( this._boundingBox.max.x, this._boundingBox.max.y, this._boundingBox.max.z );

	// reset values before calculating
	this._depth = Infinity;
	this._boundingRectangle.makeEmpty();

	// calculate the bounding rectangle and the minimum depth value
	for ( var index = 0; index < points.length; index++ )
	{
		// transform and project point from world to screen space
		points[ index ].project( this._camera );

		// compute the bounding rectangle in screen space
		this._boundingRectangle.expandByPoint( points[ index ] );

		// determine the minimum depth value
		this._depth = Math.min( this._depth, points[ index ].z );
	}
};

/**
 * Computes the position of the impostor. The center point of the bounding
 * rectangle in world space will provide the exact value.
 */
Impostor.prototype._computePosition = function() {

	// calculate center
	var centerScreenSpace = this._boundingRectangle.center();

	// use the center and the depth value to determine the new position of the
	// impostor in screen space
	var positionWorldSpace = new THREE.Vector3( centerScreenSpace.x, centerScreenSpace.y, this._depth );

	// unproject the vector to get world position
	this.billboard.position.copy( positionWorldSpace.unproject( this._camera ) );
};

/**
 * Updates the geometry of the impostor.
 */
Impostor.prototype._updateGeometry = ( function() {

	var translationMatrix = new THREE.Matrix4();
	var rotationMatrix = new THREE.Matrix4();

	// create point array
	var points = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];

	return function() {

		var index, positionBuffer;

		// shortcut to position buffer
		positionBuffer = this.billboard.geometry.attributes.position.array;

		// get the points of the bounding rectangle
		points[ 0 ].set( this._boundingRectangle.min.x, this._boundingRectangle.min.y, this._depth );
		points[ 1 ].set( this._boundingRectangle.min.x, this._boundingRectangle.max.y, this._depth );
		points[ 2 ].set( this._boundingRectangle.max.x, this._boundingRectangle.min.y, this._depth );
		points[ 3 ].set( this._boundingRectangle.max.x, this._boundingRectangle.max.y, this._depth );

		// set new position
		for ( index = 0; index < points.length; index++ )
		{
			// transform point from screen space to world space
			points[ index ].unproject( this._camera );

			// apply the position to the respective buffer
			positionBuffer[ index * 3 + 0 ] = points[ index ].x;
			positionBuffer[ index * 3 + 1 ] = points[ index ].y;
			positionBuffer[ index * 3 + 2 ] = points[ index ].z;
		}

		// we need to tell three.js to update the buffer
		this.billboard.geometry.attributes.position.needsUpdate = true;

		// prepare matrices
		translationMatrix.identity();
		rotationMatrix.identity();

		// reset the center of the geometry back to origin
		translationMatrix.makeTranslation( -this.billboard.position.x, -this.billboard.position.y, -this.billboard.position.z );

		// undo rotation of the view transform
		rotationMatrix.extractRotation( this._camera.matrixWorldInverse );

		// reset geometry
		this.billboard.geometry.applyMatrix( translationMatrix );
		this.billboard.geometry.applyMatrix( rotationMatrix );
	};

}() );

/**
 * Computes a projection matrix, that encloses the bounding rectangle of the
 * impostor.
 */
Impostor.prototype._computeProjectionMatrix = function() {

	// calculate frustum
	var frustumHeight = this._camera.near * Math.tan( THREE.Math.degToRad( this._camera.fov * 0.5 ) );
	var frustumWidth = frustumHeight * this._camera.aspect;

	// create new projection matrix via min/max values of the bounding rectangle
	this._camera.projectionMatrix.makeFrustum( frustumWidth  * this._boundingRectangle.min.x, 
											   frustumWidth  * this._boundingRectangle.max.x, 
											   frustumHeight * this._boundingRectangle.min.y, 
											   frustumHeight * this._boundingRectangle.max.y, 
											   this._camera.near, 
											   this._camera.far );
};

/**
 * Prepares the scene for rendering. This method ensures, that the actual object
 * and the entire lightning of the scene are part of the rendering.
 * 
 * @param {object} lights - The lights of the stage.
 */
Impostor.prototype._prepareScene = function( lights ) {

	// reset scene
	this._scene = new THREE.Scene();

	// clone object
	var object = this.sourceObject.clone();

	// ensure it's visible
	object.visible = true;

	// add to scene
	this._scene.add( object );

	// add all light sources
	Array.prototype.push.apply( this._scene.children, lights );
};

/**
 * Renders the scene to the render target.
 * 
 * @param {Renderer} renderer - The renderer object.
 */
Impostor.prototype._render = function( renderer ) {

	// save existing clear color and alpha
	var clearColor = renderer.getClearColor();
	var clearAlpha = renderer.getClearAlpha();

	// the following clear ensures that the rendered texture has transparency
	renderer.setClearColor( 0x000000, 0 );

	// render to target
	renderer.render( this._scene, this._camera, this._renderTarget, true );

	// restore clear values
	renderer.setClearColor( clearColor, clearAlpha );
};

module.exports = Impostor;