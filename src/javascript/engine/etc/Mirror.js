/**
 * @file This prototype can be used to create a mirror 3D-object. The
 * implementation can use two variants to create reflection:
 * 
 * 1. Stencil Buffer: First, the logic renders the shape of the mirror to the
 * stencil and color buffer. Then all reflected objects are drawn with activated
 * stencil test and the rest of the stage is rendered normally. The invocation
 * of the mirror's update method must always happen AFTER the invocation of the
 * stage render method.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 9.3.1 Planar Reflections
 * 
 * 2. Projective Texture Mapping: This variant renders the reflection into a
 * texture map. This texture is then applied to the mirror via projective
 * texture mapping. The invocation of the mirror's update method must always
 * happen BEFORE the invocation of the stage render method.
 * 
 * see: http://www.futurenation.net/glbase/reflect.htm
 * 
 * When using this prototype, you must ensure that the autoClear property of
 * renderer is set to false and the stage clears the buffer manually.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var system = require( "../core/System" );
var MirrorShader = require( "../shader/MirrorShader" );

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
 * @param {boolean} useTexture - Controls the usage of a texture.
 */
function Mirror( width, height, renderer, camera, world, useTexture ) {

	THREE.Mesh.call( this );

	Object.defineProperties( this, {

		// this value can be used to add a little offset to the reflected
		// objects. it avoids render errors/ artifacts when working with the
		// stencil buffer
		offset : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		// this value can be used to tweak the clipping if projective texture
		// mapping is used
		clipBias : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// approximate resolution value of the render target
		resolution : {
			value : 2048,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// controls the type of mirror algorithm
		_useTexture : {
			value : useTexture || false,
			configurable : false,
			enumerable : false,
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
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// the render target for our texture
		_renderTarget : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this matrix is used in the shader to map the texture to our mirror
		// surface
		_textureMatrix : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
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
	
	// render section
	this._beforeRender();

	this._render();
	
	this._afterRender();

	// update helpers in dev mode
	if ( system.isDevModeActive === true )
	{
		this._updateHelpers();
	}
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

	if ( this._useTexture === true )
	{
		// geometry and material for our mirror
		this.geometry = new THREE.PlaneBufferGeometry( width, height, 1, 1 );
		
		this.material = new THREE.ShaderMaterial( {
			uniforms : THREE.UniformsUtils.clone( MirrorShader.uniforms ),
			vertexShader : MirrorShader.vertexShader,
			fragmentShader : MirrorShader.fragmentShader
		} );

		// the render target or texture for our mirror
		this._createRenderTarget( width, height );
		
		// create texture matrix
		this._textureMatrix = new THREE.Matrix4();

		// assign uniform data
		this.material.uniforms.texture.value = this._renderTarget;
		this.material.uniforms.textureMatrix.value = this._textureMatrix;
		
		// add mirror to world
		this._world.addObject3D( this );
	}
	else
	{
		// geometry and material for our mirror
		this.geometry = new THREE.PlaneBufferGeometry( width, height, 1, 1 );
		
		this.material = new THREE.MeshBasicMaterial( {
			color : this._renderer.getClearColor(),
			depthWrite : false
		} );
		
		// we need to store the mirror in a separate scene for rendering to the stencil buffer
		this._sceneMirror = new THREE.Scene();
		this._sceneMirror.add( this );
	}

	// prevent three.js to auto-update the camera
	this._mirrorCamera.matrixAutoUpdate = false;

	// add helpers in dev mode
	if ( system.isDevModeActive === true )
	{
		this._addHelpers();
	}
};

/**
 * Render method of the mirror.
 */
Mirror.prototype._render = function() {

	if ( this._useTexture === true )
	{
		// draw all reflected objects into the render target
		this._renderer.render( this._scene, this._mirrorCamera, this._renderTarget, true );
	}
	else
	{
		// draw all reflected objects to the framebuffer
		this._renderer.render( this._scene, this._mirrorCamera );
	}

};

/**
 * This method is called before rendering.
 */
Mirror.prototype._beforeRender = function() {

	this._updateMirrorCamera();

	if ( this._useTexture === true )
	{
		this._updateTextureMatrix();

		this._updateClipping();
	}
	else
	{
		this._updateStencilBuffer();
	}

	// flip face culling for reflected objects
	this._flipFaceCulling();

};

/**
 * This method is called after rendering.
 */
Mirror.prototype._afterRender = function() {

	var gl = this._renderer.getWebGLContext();
	var glState = this._renderer.getWebGLState();

	if ( this._useTexture === false )
	{
		// disable stencil test
		glState.disable( gl.STENCIL_TEST );
	}

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
	gl.stencilOp( gl.REPLACE, gl.KEEP, gl.REPLACE );

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

	// update matrices
	this._mirrorCamera.updateMatrixWorld( true );
	this._mirrorCamera.projectionMatrix.copy( this._camera.projectionMatrix );

	// this is only necessary if we render to a texture
	if ( this._useTexture === true )
	{
		this._mirrorCamera.matrixWorldInverse.getInverse( this._mirrorCamera.matrixWorld );
	}
};

/**
 * Updates helper objects.
 */
Mirror.prototype._updateHelpers = function() {

	this._cameraHelper.position.setFromMatrixPosition( this._mirrorCamera.matrix );
	this._directionHelper.setDirection( this._mirrorCamera.getWorldDirection() );
};

/**
 * Adds 3D helper objects for debugging.
 */
Mirror.prototype._addHelpers = function() {

	var helperGeometry = new THREE.BoxGeometry( 2, 2, 2 );
	var helperMaterial = new THREE.MeshBasicMaterial( {
		color : 0xffffff
	} );

	// create a simple mesh to visualize the position of the mirror camera
	this._cameraHelper = new THREE.Mesh( helperGeometry, helperMaterial );

	// create a arrow to visualize the orientation of the mirror camera
	this._directionHelper = new THREE.ArrowHelper( this._cameraHelper.getWorldDirection(), new THREE.Vector3(), 10 );

	// add helpers to world
	this._cameraHelper.add( this._directionHelper );
	this._world.addObject3D( this._cameraHelper );
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

/**
 * Creates the render target that is used to rendering the reflection into a
 * texture.
 */
Mirror.prototype._createRenderTarget = function( width, height ) {

	var resolution = new THREE.Vector2();
	var parameter = {
		format : THREE.RGBFormat,
		stencilBuffer : false
	};

	// we check the ratio of the dimensions and calculate an appropriate
	// resolution
	if ( width > height )
	{
		resolution.x = this.resolution;
		resolution.y = Math.floor( this.resolution * ( height / width ) );

	}
	else
	{
		resolution.x = Math.floor( this.resolution * ( width / height ) );
		resolution.y = this.resolution;
	}

	// create the render target
	this._renderTarget = new THREE.WebGLRenderTarget( resolution.x, resolution.y, parameter );
};

/**
 * This will update the texture matrix that is used for projective texture
 * mapping in the shader.
 * 
 * see: http://developer.download.nvidia.com/assets/gamedev/docs/projective_texture_mapping.pdf
 */
Mirror.prototype._updateTextureMatrix = function() {

	this._textureMatrix.set( 0.5, 0.0, 0.0, 0.5, 
							 0.0, 0.5, 0.0, 0.5, 
							 0.0, 0.0, 0.5, 0.5, 
							 0.0, 0.0, 0.0, 1.0 );

	this._textureMatrix.multiply( this._mirrorCamera.projectionMatrix );
	this._textureMatrix.multiply( this._mirrorCamera.matrixWorldInverse );
};

/**
 * This method creates an oblique view frustum for clipping.
 * 
 * see: Lengyel, Eric. “Oblique View Frustum Depth Projection and Clipping”.
 * Journal of Game Development, Vol. 1, No. 2 (2005), Charles River Media, pp.
 * 5–16.
 */
Mirror.prototype._updateClipping = ( function() {

	var clipPlane, clipVector, q;

	return function() {

		// shortcut
		var projectionMatrix = this._mirrorCamera.projectionMatrix;

		if ( clipPlane === undefined )
		{
			clipPlane = new THREE.Plane();
			clipVector = new THREE.Vector4();
			q = new THREE.Vector4();
		}

		// copy the reflection plane and apply the inverse world matrix of the
		// mirror camera
		clipPlane.copy( this._reflectionPlane );
		clipPlane.applyMatrix4( this._mirrorCamera.matrixWorldInverse );

		// we transfer the information of our plane to a four component vector
		clipVector.set( clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.constant );

		// calculate the clip-space corner point opposite the clipping plane and
		// transform it into camera space by multiplying it by the inverse of
		// the projection matrix
		q.x = ( Math.sign( clipVector.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
		q.y = ( Math.sign( clipVector.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
		q.z = - 1.0;
		q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

		// calculate the scaled plane vector
		clipVector.multiplyScalar( 2.0 / clipVector.dot( q ) );

		// replacing the third row of the projection matrix
		projectionMatrix.elements[ 2 ] = clipVector.x;
		projectionMatrix.elements[ 6 ] = clipVector.y;
		projectionMatrix.elements[ 10 ] = clipVector.z + 1.0 - this.clipBias;
		projectionMatrix.elements[ 14 ] = clipVector.w;
	};

}() );

module.exports = Mirror;