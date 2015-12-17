/**
 * @file This prototype can be used to create a refractor. The logic renders
 * everything behind a clipping plane into a texture. The associated shader
 * program can implement different effects like distortions. Compared with the
 * reflector this prototype provides just one type of rendering.
 * 
 * 1. Projective Texture Mapping: This variant renders the refraction into a
 * texture map. This map is then applied to the refractor via projective texture
 * mapping. The invocation of the refractor's update method must always happen
 * BEFORE the invocation of the stage render method.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var RefractorShader = require( "../shader/RefractorShader" );

/**
 * Creates a refractor.
 * 
 * @constructor
 * @augments THREE.Mesh
 * 
 * @param {Renderer} renderer - The renderer object.
 * @param {Camera} camera - The camera object.
 * @param {World} world - The world object.
 * @param {object} options - The options of the refractor.
 */
function Refractor( renderer, camera, world, options ) {

	THREE.Mesh.call( this );

	Object.defineProperties( this, {

		// the width of the refractor
		width : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the height of the refractor
		height : {
			value : 0,
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
		// this will be used as a clipping plane
		_refractionPlane : {
			value : new THREE.Plane(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// the virtual camera. it represents the actual view of the refractor
		_refractorCamera : {
			value : new THREE.PerspectiveCamera(),
			configurable : false,
			enumerable : false,
			writable : false
		},
		// this texture contains the refraction
		_refractionMap : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// this matrix is used to generate uv coordinates in the shader to map
		// the texture to the refractor's surface
		_textureMatrix : {
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

Refractor.prototype = Object.create( THREE.Mesh.prototype );
Refractor.prototype.constructor = Refractor;

/**
 * Update method of the refractor.
 */
Refractor.prototype.update = function() {
	
	this._beforeRender();

	this._render();
	
	this._afterRender();
};

/**
 * This overrides the standard three.js method. If this method is called, we
 * also want to update the refraction plane.
 */
Refractor.prototype.updateMatrix = function() {

	THREE.Mesh.prototype.updateMatrix.call( this );

	this.makeRefractionPlane();
};

/**
 * Creates the clipping plane of the refractor.
 */
Refractor.prototype.makeRefractionPlane = ( function() {

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
		
		// get the normal of the refractor plane
		normal.set( 0, 0, 1 ).applyQuaternion( quaternion ).normalize();
		
		// flip the normal, because we want to cull everything above the plane
		normal.negate();
		
		// calculate refractor plane
		this._refractionPlane.setFromNormalAndCoplanarPoint( normal, this.position );
	};

}() );

/**
 * Initializes the refractor.
 */
Refractor.prototype._init = function() {
	
	// geometry of the refractor
	this.geometry = new THREE.PlaneBufferGeometry( this.width, this.height, 1, 1 );

	// custom shader material
	this.material = new THREE.ShaderMaterial( {
		uniforms : THREE.UniformsUtils.clone( RefractorShader.uniforms ),
		vertexShader : RefractorShader.vertexShader,
		fragmentShader : RefractorShader.fragmentShader
	} );
		
	// create a render target for the refraction texture
	this._createRenderTarget();
	
	// create texture matrix
	this._textureMatrix = new THREE.Matrix4();
	
	// assign uniform data
	this.material.uniforms.refractionMap.value = this._refractionMap;
	this.material.uniforms.textureMatrix.value = this._textureMatrix;
	
	// prevent auto-update of virtual camera
	this._refractorCamera.matrixAutoUpdate = false;
};

/**
 * Render method of the refractor.
 */
Refractor.prototype._render = function() {
	
	this._renderer.render( this._world.scene, this._refractorCamera, this._refractionMap, true );
};

/**
 * This method is called before rendering.
 */
Refractor.prototype._beforeRender = function() {
	
	// the refractor should not render itself
	this.material.visible = false;

	this._updateCamera();
	
	this._updateTextureMatrix();
	
	this._updateClipping();
};

/**
 * This method is called after rendering.
 */
Refractor.prototype._afterRender = function() {

	this.material.visible = true;
};


/**
 * This will update the virtual camera to the correct view position and
 * orientation.
 */
Refractor.prototype._updateCamera = function() {

	// we just copy the values of our camera to the virtual camera of the refractor
	this._refractorCamera.matrix.copy( this._camera.matrixWorld );
	this._refractorCamera.updateMatrixWorld( true );
	this._refractorCamera.projectionMatrix.copy( this._camera.projectionMatrix );
	this._refractorCamera.matrixWorldInverse.getInverse( this._refractorCamera.matrixWorld );
};

/**
 * Creates the render target that is used to rendering the refraction into a
 * texture.
 */
Refractor.prototype._createRenderTarget = function() {

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
	this._refractionMap = new THREE.WebGLRenderTarget( resolution.x, resolution.y, parameter );
};

/**
 * This will update the texture matrix that is used for projective texture
 * mapping in the shader.
 * 
 * see: http://developer.download.nvidia.com/assets/gamedev/docs/projective_texture_mapping.pdf
 */
Refractor.prototype._updateTextureMatrix = function() {

	// this matrix does range mapping to [ 0, 1 ]
	this._textureMatrix.set( 0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0 );

	// we use "Object Linear Texgen", so we need to multiply the texture matrix T
	// (matrix above) with the projection and view matrix of the virtual camera
	// and the model matrix of the 3D object (the refractor)
	this._textureMatrix.multiply( this._refractorCamera.projectionMatrix );
	this._textureMatrix.multiply( this._refractorCamera.matrixWorldInverse );
	this._textureMatrix.multiply( this.matrixWorld );
};

/**
 * This method creates an oblique view frustum for clipping.
 * 
 * see: Lengyel, Eric. “Oblique View Frustum Depth Projection and Clipping”.
 * Journal of Game Development, Vol. 1, No. 2 (2005), Charles River Media, pp.
 * 5–16.
 */
Refractor.prototype._updateClipping = ( function() {

	var clipPlane, clipVector, q;

	return function() {

		// shortcut
		var projectionMatrix = this._refractorCamera.projectionMatrix;

		if ( clipPlane === undefined )
		{
			clipPlane = new THREE.Plane();
			clipVector = new THREE.Vector4();
			q = new THREE.Vector4();
		}

		// copy the reflection plane and apply the inverse world matrix of the
		// refractor camera
		clipPlane.copy( this._refractionPlane );
		clipPlane.applyMatrix4( this._refractorCamera.matrixWorldInverse );

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

module.exports = Refractor;