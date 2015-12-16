/**
 * @file This prototype can be used to create a reflector. The
 * implementation can use two variants to create reflection:
 * 
 * 1. Stencil Buffer: First, the logic renders the shape of the reflector to the
 * stencil and color buffer. Then all reflected objects are drawn with activated
 * stencil test and the rest of the stage is rendered normally. The invocation
 * of the reflector's update method must always happen AFTER the invocation of the
 * stage render method.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 9.3.1 Planar Reflections
 * 
 * 2. Projective Texture Mapping: This variant renders the reflection into a
 * texture map. This texture is then applied to the reflector via projective
 * texture mapping. The invocation of the reflector's update method must always
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
var ReflectorShader = require( "../shader/ReflectorShader" );

/**
 * Creates a reflector.
 * 
 * @constructor
 * @augments THREE.Mesh
 * 
 * @param {Renderer} renderer - The renderer object.
 * @param {Camera} camera - The camera object.
 * @param {World} world - The world object.
 * @param {object} options - The options of the reflector.
 */
function Reflector( renderer, camera, world, options ) {

	THREE.Mesh.call( this );

	Object.defineProperties( this, {

		// the width of the reflector
		width : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the height of the reflector
		height : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this value can be used to add a little offset to the reflected
		// objects. it avoids render errors/ artifacts when working with the
		// stencil buffer
		offset : {
			value : new THREE.Vector3(),
			configurable : false,
			enumerable : true,
			writable : true
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
		// controls the type of reflector algorithm
		useTexture : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
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
		// the reflection plane of the reflector. this plane will be used to build
		// the reflection matrix
		_reflectionPlane : {
			value : new THREE.Plane(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this will be used to transform the virtual camera to the correct
		// viewpoint of the reflector
		_reflectionMatrix : {
			value : new THREE.Matrix4(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the virtual camera. it represents the actual view of the reflector
		_reflectorCamera : {
			value : new THREE.PerspectiveCamera(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this scene holds all 3D objects that should reflect in the reflector
		_scene : {
			value : new THREE.Scene(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this special scene holds only the reflector for rendering to the
		// stencil buffer. three.js render method can't render single objects,
		// but just scenes
		_sceneReflector : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this texture contains the reflection of the reflector
		_reflectionMap : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this matrix is used to generate uv coordinates in the shader to map
		// the texture to the reflector's surface
		_textureMatrix : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this helper object visualizes the position of the virtual camera
		_cameraHelper : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this helper shows the view direction of the reflector's camera
		_directionHelper : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
	
	// transfer the options values to the object
	for ( var property in options )
	{
		if ( options.hasOwnProperty( property ) )
		{
			this[ property ] = options[ property ];
		}
	}

	this._init();
}

Reflector.prototype = Object.create( THREE.Mesh.prototype );
Reflector.prototype.constructor = Reflector;

/**
 * Update method of the reflector.
 */
Reflector.prototype.update = function() {
	
	this._beforeRender();

	this._render();
	
	this._afterRender();
};

/**
 * This overrides the standard three.js method. If this method is called, we
 * also want to update the reflection entities.
 */
Reflector.prototype.updateMatrix = function() {

	THREE.Mesh.prototype.updateMatrix.call( this );

	this.makeReflectionPlane();

	this.makeReflectionMatrix();
};

/**
 * Creates the reflection plane of the reflector.
 */
Reflector.prototype.makeReflectionPlane = ( function() {

	var normal, position, quaternion, scale;

	return function() {

		if ( normal === undefined )
		{
			normal = new THREE.Vector3();
			position = new THREE.Vector3();
			quaternion = new THREE.Quaternion();
			scale = new THREE.Vector3();
		}
		
		// ensure matrixWorld is up to date
		this.updateMatrixWorld( true );
		
		// then extract position and orientation 
		this.matrixWorld.decompose( position, quaternion, scale );
		
		// get the normal of the reflector/plane
		normal.set( 0, 0, 1 ).applyQuaternion( quaternion ).normalize();
		
		// optional: tweak the normal to avoid render artifacts ( stencil buffer )
		normal.add( this.offset ).normalize();

		// calculate reflection plane
		this._reflectionPlane.setFromNormalAndCoplanarPoint( normal, this.position );
	};

}() );

/**
 * Creates the reflection matrix of the reflector.
 * 
 * see: 3D Math Primer for Graphics and Game Development (Second Edition),
 * Chapter 5.4 Reflection, 3D matrix to reflect about an arbitrary plane
 */
Reflector.prototype.makeReflectionMatrix = function() {

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
 * Initializes the reflector.
 */
Reflector.prototype._init = function() {
	
	// geometry and material for our reflector
	this.geometry = new THREE.PlaneBufferGeometry( this.width, this.height, 1, 1 );
	
	// prevent three.js to auto-update the camera
	this._reflectorCamera.matrixAutoUpdate = false;

	// check the usage of a texture. if set to true, we render the reflection to
	// a texture and use this in a custom shader material
	if ( this.useTexture === true )
	{
		this.material = new THREE.ShaderMaterial( {
			uniforms : THREE.UniformsUtils.clone( ReflectorShader.uniforms ),
			vertexShader : ReflectorShader.vertexShader,
			fragmentShader : ReflectorShader.fragmentShader
		} );

		// create a render target for the reflection texture
		this._reflectionMap = this._createRenderTarget();

		// create texture matrix
		this._textureMatrix = new THREE.Matrix4();

		// assign uniform data
		this.material.uniforms.reflectionMap.value = this._reflectionMap;
		this.material.uniforms.textureMatrix.value = this._textureMatrix;

		// add reflector to world
		this._world.addObject3D( this );
	}
	else
	{
		// we only see reflected objects within the reflector if we disable
		// writing to the depth buffer
		this.material = new THREE.MeshBasicMaterial( {
			color : this._renderer.getClearColor(),
			depthWrite : false
		} );

		// we need to store the reflector in a separate scene for rendering to
		// the stencil buffer
		this._sceneReflector = new THREE.Scene();
		this._sceneReflector.add( this );
	}

};

/**
 * Render method of the reflector.
 */
Reflector.prototype._render = function() {

	if ( this.useTexture === true )
	{
		// draw all reflected objects into the render target
		this._renderer.render( this._world.scene, this._reflectorCamera, this._reflectionMap, true );		
	}
	else
	{
		// draw all reflected objects to the framebuffer
		this._renderer.render( this._world.scene, this._reflectorCamera );
	}

};

/**
 * This method is called before rendering.
 */
Reflector.prototype._beforeRender = function() {

	this._updateReflectorCamera();

	if ( this.useTexture === true )
	{
		this._updateTextureMatrix();

		this._updateClipping( this._reflectionPlane, this._reflectorCamera );
		
		// the reflector should not draw itself to the texture
		this.material.visible = false;
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
Reflector.prototype._afterRender = function() {

	var gl = this._renderer.getWebGLContext();
	var glState = this._renderer.getWebGLState();

	if ( this.useTexture === true )
	{
		this.material.visible = true;
	}
	else
	{
		// disable stencil test
		glState.disable( gl.STENCIL_TEST );
	}

	// undo flip
	this._flipFaceCulling();
};

/**
 * This will update the stencil buffer. It ensures that the viewer sees
 * reflected objects only inside the reflector. So it's just a special form of
 * clipping.
 */
Reflector.prototype._updateStencilBuffer = function() {

	var gl = this._renderer.getWebGLContext();
	var glState = this._renderer.getWebGLState();

	// enable stencil test
	glState.enable( gl.STENCIL_TEST );
	gl.stencilFunc( gl.ALWAYS, 1, 0xff );
	gl.stencilOp( gl.REPLACE, gl.KEEP, gl.REPLACE );

	// draw reflector to stencil buffer
	this._renderer.render( this._sceneReflector, this._camera );

	// change stencil function and operation for testing
	gl.stencilFunc( gl.EQUAL, 1, 0xff );
	gl.stencilOp( gl.KEEP, gl.KEEP, gl.KEEP );
};

/**
 * This will update the reflector camera to the correct view position and
 * orientation.
 */
Reflector.prototype._updateReflectorCamera = function() {

	// we use our reflection matrix to flip the position and orientation of our
	// virtual camera
	this._reflectorCamera.matrix.copy( this._reflectionMatrix ).multiply( this._camera.matrixWorld );

	// update matrices
	this._reflectorCamera.updateMatrixWorld( true );
	this._reflectorCamera.projectionMatrix.copy( this._camera.projectionMatrix );

	// this is only necessary if we render to a texture
	if ( this.useTexture === true )
	{
		this._reflectorCamera.matrixWorldInverse.getInverse( this._reflectorCamera.matrixWorld );
	}
};

/**
 * Updates helper objects.
 */
Reflector.prototype._updateHelpers = function() {

	this._cameraHelper.position.setFromMatrixPosition( this._reflectorCamera.matrix );
	this._directionHelper.setDirection( this._reflectorCamera.getWorldDirection() );
};

/**
 * Adds 3D helper objects for debugging.
 */
Reflector.prototype._addHelpers = function() {

	var helperGeometry = new THREE.BoxGeometry( 2, 2, 2 );
	var helperMaterial = new THREE.MeshBasicMaterial( {
		color : 0xffffff
	} );

	// create a simple mesh to visualize the position of the reflector camera
	this._cameraHelper = new THREE.Mesh( helperGeometry, helperMaterial );

	// create a arrow to visualize the orientation of the reflector camera
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
Reflector.prototype._flipFaceCulling = function() {

	this._world.scene.traverseVisible( function( object ) {

		if ( object.material !== undefined && object.material.side !== THREE.DoubleSide )
		{
			object.material.side = ( object.material.side === THREE.FrontSide ) ? THREE.BackSide : THREE.FrontSide;
		}
	} );
};

/**
 * Creates the render target that is used to rendering the reflection into a
 * texture.
 */
Reflector.prototype._createRenderTarget = function() {

	var resolution = new THREE.Vector2();
	var parameter = {
		format : THREE.RGBFormat,
		stencilBuffer : false
	};

	// we check the ratio of the dimensions and calculate an appropriate
	// resolution
	if ( this.width > this.height )
	{
		resolution.x = this.resolution;
		resolution.y = Math.floor( this.resolution * ( this.height / this.width ) );

	}
	else
	{
		resolution.x = Math.floor( this.resolution * ( this.width / this.height ) );
		resolution.y = this.resolution;
	}

	// create the render target
	return new THREE.WebGLRenderTarget( resolution.x, resolution.y, parameter );
};

/**
 * This will update the texture matrix that is used for projective texture
 * mapping in the shader.
 * 
 * see: http://developer.download.nvidia.com/assets/gamedev/docs/projective_texture_mapping.pdf
 */
Reflector.prototype._updateTextureMatrix = function() {

	// this matrix does range mapping to [ 0, 1 ]
	this._textureMatrix.set( 0.5, 0.0, 0.0, 0.5, 
							 0.0, 0.5, 0.0, 0.5, 
							 0.0, 0.0, 0.5, 0.5, 
							 0.0, 0.0, 0.0, 1.0 );

	// we use Object Linear Texgen, so we need to multiply the texture matrix T
	// (matrix above) with the projection and view matrix of the virtual camera
	// and the model matrix of the 3D object (the reflector)
	this._textureMatrix.multiply( this._reflectorCamera.projectionMatrix );
	this._textureMatrix.multiply( this._reflectorCamera.matrixWorldInverse );
	this._textureMatrix.multiply( this.matrixWorld );
};

/**
 * This method creates an oblique view frustum for clipping.
 * 
 * see: Lengyel, Eric. “Oblique View Frustum Depth Projection and Clipping”.
 * Journal of Game Development, Vol. 1, No. 2 (2005), Charles River Media, pp.
 * 5–16.
 */
Reflector.prototype._updateClipping = ( function() {

	var clipPlane, clipVector, q;

	return function( clippingPlane, camera ) {

		// shortcut
		var projectionMatrix = camera.projectionMatrix;

		if ( clipPlane === undefined )
		{
			clipPlane = new THREE.Plane();
			clipVector = new THREE.Vector4();
			q = new THREE.Vector4();
		}

		// copy the reflection plane and apply the inverse world matrix of the
		// reflector camera
		clipPlane.copy( clippingPlane );
		clipPlane.applyMatrix4( camera.matrixWorldInverse );

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

module.exports = Reflector;