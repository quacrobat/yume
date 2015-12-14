/**
 * @file This prototype can be used to create a mirror 3D-object. The prototype
 * uses the stencil buffer and a reflection matrix to render the mirror.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 9.3.1 Planar Reflections
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var system = require( "../core/System" );

/**
 * Creates a mirror.
 * 
 * @constructor
 * @augments THREE.Mesh
 * 
 * @param {number} width - The width of the mirror.
 * @param {number} height - The height of the mirror.
 * @param {Renderer} renderer - The renderer object.
 * @param {Camera} camera - The camera object.
 * @param {World} world - The world object.
 */
function Mirror( width, height, renderer, camera, world ) {

	THREE.Mesh.call( this );

	Object.defineProperties( this, {

		// this value can be used to add a little offset to the reflected
		// objects. it avoids render errors/ artifacts
		offset : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// a reference to the renderer object
		_renderer : {
			value : renderer,
			configurable : false,
			enumerable : false,
			writable : false
		},
		// a reference to the camera object
		_camera : {
			value : camera,
			configurable : false,
			enumerable : false,
			writable : false
		},
		// a reference to the world object
		_world : {
			value : world,
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the reflection plane of the mirror. this plane will be used to build
		// the reflection matrix
		_reflectionPlane : {
			value : new THREE.Plane(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this will be used to transform the camera to the correct viewpoint of
		// the mirror
		_reflectionMatrix : {
			value : new THREE.Matrix4(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the camera object of the mirror. it represents the actual view of the
		// mirror
		_mirrorCamera : {
			value : new THREE.PerspectiveCamera(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this scene holds all 3D objects that should reflect in the mirror
		_scene : {
			value : new THREE.Scene(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this special scene holds only the mirror object. three.js render
		// method can't render single objects, but just scenes
		_sceneMirror : {
			value : new THREE.Scene(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this helper object visualizes the mirror camera position
		_cameraHelper : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this helper shows the view direction of the mirror camera
		_directionHelper : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	this._init( width, height );
}

Mirror.prototype = Object.create( THREE.Mesh.prototype );
Mirror.prototype.constructor = Mirror;

/**
 * Update method of the mirror.
 */
Mirror.prototype.update = function() {

	// only update reflection entities if necessary
	if ( this.matrixAutoUpdate === true )
	{
		this.makeReflectionPlane();
		
		this.makeReflectionMatrix();
	}
	
	this._render();
};

/**
 * This overrides the standard three.js method. If this method is called, we
 * also want to update the reflection entities.
 */
Mirror.prototype.updateMatrix = function() {

	THREE.Mesh.prototype.updateMatrix.call( this );

	this.makeReflectionPlane();

	this.makeReflectionMatrix();
};

/**
 * Adds a 3D object to the mirror's internal scene.
 * 
 * @param {THREE.Object3D} object3D - The 3D object to add.
 */
Mirror.prototype.addObject3D = function( object3D ) {

	// it is necessary to clone the object, because three.js can't handle
	// objects in two different scenes
	var objectMirror = object3D.clone();

	this._scene.add( objectMirror );

	// add an optional offset to each object to avoid potential artifacts
	objectMirror.position.add( this.offset );
	objectMirror.updateMatrix();

};

/**
 * Creates the reflection plane of the mirror.
 */
Mirror.prototype.makeReflectionPlane = ( function() {

	var normal, position, quaternion;

	return function() {

		if ( normal === undefined )
		{
			normal = new THREE.Vector3();
			position = new THREE.Vector3();
			quaternion = new THREE.Quaternion();
		}

		this.getWorldQuaternion( quaternion );
		this.getWorldPosition( position );

		// get the normal of the mirror/plane
		normal.set( 0, 0, 1 ).applyQuaternion( quaternion ).normalize();

		// calculate reflection plane
		this._reflectionPlane.setFromNormalAndCoplanarPoint( normal, this.position );
	};

}() );

/**
 * Creates the reflection matrix of the mirror.
 * 
 * see: 3D Math Primer for Graphics and Game Development (Second Edition),
 * Chapter 5.4 Reflection, 3D matrix to reflect about an arbitrary plane
 */
Mirror.prototype.makeReflectionMatrix = function() {

	// construct reflection matrix from reflection plane

	this._reflectionMatrix.elements[ 0 ] = -2 * this._reflectionPlane.normal.x * this._reflectionPlane.normal.x + 1;
	this._reflectionMatrix.elements[ 1 ] = -2 * this._reflectionPlane.normal.y * this._reflectionPlane.normal.x;
	this._reflectionMatrix.elements[ 2 ] = -2 * this._reflectionPlane.normal.z * this._reflectionPlane.normal.x;
	this._reflectionMatrix.elements[ 3 ] = 0;

	this._reflectionMatrix.elements[ 4 ] = -2 * this._reflectionPlane.normal.x * this._reflectionPlane.normal.y;
	this._reflectionMatrix.elements[ 5 ] = -2 * this._reflectionPlane.normal.y * this._reflectionPlane.normal.y + 1;
	this._reflectionMatrix.elements[ 6 ] = -2 * this._reflectionPlane.normal.z * this._reflectionPlane.normal.y;
	this._reflectionMatrix.elements[ 7 ] = 0;

	this._reflectionMatrix.elements[ 8 ] = -2 * this._reflectionPlane.normal.x * this._reflectionPlane.normal.z;
	this._reflectionMatrix.elements[ 9 ] = -2 * this._reflectionPlane.normal.y * this._reflectionPlane.normal.z;
	this._reflectionMatrix.elements[ 10 ] = -2 * this._reflectionPlane.normal.z * this._reflectionPlane.normal.z + 1;
	this._reflectionMatrix.elements[ 11 ] = 0;

	this._reflectionMatrix.elements[ 12 ] = -2 * this._reflectionPlane.normal.x * this._reflectionPlane.constant;
	this._reflectionMatrix.elements[ 13 ] = -2 * this._reflectionPlane.normal.y * this._reflectionPlane.constant;
	this._reflectionMatrix.elements[ 14 ] = -2 * this._reflectionPlane.normal.z * this._reflectionPlane.constant;
	this._reflectionMatrix.elements[ 15 ] = 1;
};

/**
 * Initializes the mirror.
 * 
 * @param {number} width - The width of the mirror.
 * @param {number} height - The height of the mirror.
 */
Mirror.prototype._init = function( width, height ) {

	// geometry and material for our mirror
	this.geometry = new THREE.PlaneBufferGeometry( width, height, 1, 1 );
	this.material = new THREE.MeshBasicMaterial( {
		color : this._renderer.getClearColor(),
		depthWrite : false
	} );
	
	// we need to store the mirror in a separate scene for rendering
	this._sceneMirror.add( this );

	// prevent three.js to auto-update the camera
	this._mirrorCamera.matrixAutoUpdate = false;

	// add helper objects in dev mode
	if ( system.isDevModeActive === true )
	{
		var helperGeometry = new THREE.BoxGeometry( 2, 2, 2 );
		var helperMaterial = new THREE.MeshBasicMaterial( {
			color : 0xffffff
		} );
		
		// create a simple mesh to visualize the position of  the mirror camera
		this._cameraHelper = new THREE.Mesh( helperGeometry, helperMaterial );

		// create a arrow to visualize the orientation of the mirror camera
		this._directionHelper = new THREE.ArrowHelper( this._cameraHelper.getWorldDirection(), new THREE.Vector3(), 10 );

		// add helpers to world
		this._cameraHelper.add( this._directionHelper );
		this._world.addObject3D( this._cameraHelper );
	}

};

/**
 * Render method of the mirror.
 */
Mirror.prototype._render = function() {

	this._beforeDrawing();
	
	// draw all reflected objects
	this._renderer.render( this._scene, this._mirrorCamera );
	
	this._afterDrawing();
	
};

/**
 * This method is called before rendering. It prepares the stencil buffer and
 * the mirror camera.
 */
Mirror.prototype._beforeDrawing = function() {

	this._updateStencilBuffer();

	this._updateMirrorCamera();
	
	// flip face culling for reflected objects
	this._flipFaceCulling();

};

/**
 * This method is called after rendering. It is used to reset the WebGL state.
 */
Mirror.prototype._afterDrawing = function() {

	var gl = this._renderer.getWebGLContext();
	var glState = this._renderer.getWebGLState();

	// disable stencil test
	glState.disable( gl.STENCIL_TEST );
	
	// undo flip
	this._flipFaceCulling();
};

/**
 * This will update the stencil buffer. It ensures that the viewer sees
 * reflected objects only inside the mirror. So it's just a special form of
 * clipping.
 */
Mirror.prototype._updateStencilBuffer = function() {

	var gl = this._renderer.getWebGLContext();
	var glState = this._renderer.getWebGLState();

	// enable stencil test
	glState.enable( gl.STENCIL_TEST );
	gl.stencilFunc( gl.ALWAYS, 1, 0xff );
	gl.stencilOp( gl.REPLACE, gl.REPLACE, gl.REPLACE );

	// draw mirror to stencil buffer
	this._renderer.render( this._sceneMirror, this._camera );

	// change stencil function and operation for testing
	gl.stencilFunc( gl.EQUAL, 1, 0xff );
	gl.stencilOp( gl.KEEP, gl.KEEP, gl.KEEP );
};

/**
 * This will update the mirror camera to the correct view position and
 * orientation.
 */
Mirror.prototype._updateMirrorCamera = function() {

	// we use our reflection matrix to flip the position and orientation of our
	// actual camera
	this._mirrorCamera.matrix.copy( this._reflectionMatrix ).multiply( this._camera.matrixWorld );

	// we need to tell three.js to update the world matrix
	this._mirrorCamera.matrixWorldNeedsUpdate = true;

	// the projection matrix is equal
	this._mirrorCamera.projectionMatrix.copy( this._camera.projectionMatrix );

	// update helper
	if ( system.isDevModeActive === true )
	{
		this._cameraHelper.position.setFromMatrixPosition( this._mirrorCamera.matrix );
		this._directionHelper.setDirection( this._mirrorCamera.getWorldDirection() );
	}
};

/**
 * This method controls the culling mode of objects. Because reflection reverses
 * the winding order, it is necessary to switch the culling mode for each
 * object.
 */
Mirror.prototype._flipFaceCulling = function() {

	this._scene.traverseVisible( function( object ) {

		if ( object.material !== undefined && object.material.side !== THREE.DoubleSide )
		{
			object.material.side = object.material.side === THREE.FrontSide ? THREE.BackSide : THREE.FrontSide;
		}
	} );
};

module.exports = Mirror;