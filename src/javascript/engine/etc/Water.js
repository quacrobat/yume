/**
 * @file This file creates a realistic and expensive water effect. The material
 * is real-time reflective & refractive, it calculates a distortion of the water
 * surface and implements a basic fresnel and lighting equation.
 * 
 * The shader needs a normal and du/dv map. The du/dv map is used to create
 * distortions and can be easily created with Photoshop from a normal map in
 * just two steps (see https://developer.valvesoftware.com/wiki/Du/dv_map).
 * 
 * 1. Open the normal map and invert the colors. 
 * 2. Go to Image > Adjustments > Brightness/Contrast. 
 * 		1. Check "Use Legacy" 
 * 		2. Set Brightness to -17 
 * 		3. Set Contrast to 100
 * 
 * Maybe you have to tweak the values to get a good result. It's important that
 * the du/dv map does not contain full black or white areas.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );
var Reflector = require( "./Reflector" );
var Refractor = require( "./Refractor" );

var WaterShader = require( "../shader/WaterShader" );

/**
 * Creates a water.
 * 
 * @constructor
 * @augments THREE.Mesh
 * 
 * @param {Renderer} renderer - The renderer object.
 * @param {Camera} camera - The camera object.
 * @param {World} world - The world object.
 * @param {object} options - The options of the reflector.
 */
function Water( renderer, camera, world, options ) {
	
	THREE.Mesh.call( this );
	
	Object.defineProperties( this, {

		// the width of the water mesh
		width : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the height of the water mesh
		height : {
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
		// strength of the waves
		waveStrength : {
			value : 0.1,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// speed of the waves
		waveSpeed : {
			value : 0.03,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the reflectivity of the water
		waterReflectivity : {
			value : 0.02,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the direction of the light
		lightDirection : {
			value : new THREE.Vector3( 0, 1, 0),
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the color of the light
		lightColor : {
			value : new THREE.Color(),
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the shininess of the water
		shininess : {
			value : 20,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the amount of segments of the water geometry
		segments : {
			value : 1,
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
		// a reference to a reflector
		_reflector : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// a reference to a refractor
		_refractor : {
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

Water.prototype = Object.create( THREE.Mesh.prototype );
Water.prototype.constructor = Water;

/**
 * Update method of the water.
 * 
 * @param {number} elapsedTime - The elapsed time.
 */
Water.prototype.update = function( elapsedTime ){
	
	// the water should not render itself
	this.material.visible = false;
	
	// update reflection and refraction
	this._reflector.update();
	this._refractor.update();
	
	// make material visible again
	this.material.visible = true;
	
	// update time uniform
	this.material.uniforms.time.value = elapsedTime;
	
	// update water properties
	this.material.uniforms.waveStrength.value = this.waveStrength;
	this.material.uniforms.waveSpeed.value = this.waveSpeed;
	this.material.uniforms.waterReflectivity.value = this.waterReflectivity;
	
	// update light properties
	this.material.uniforms.lightDirection.value = this.lightDirection;
	this.material.uniforms.lightColor.value = this.lightColor;
	this.material.uniforms.shininess.value = this.shininess;
};

/**
 * This overrides the standard three.js method. It ensures that other components
 * of the water have the same position and orientation.
 */
Water.prototype.updateMatrix = function() {

	THREE.Mesh.prototype.updateMatrix.call( this );
	
	// just copy the matrix
	this._reflector.matrix.copy( this.matrix );
	this._refractor.matrix.copy( this.matrix );
	
	// update entities for reflection and refraction
	this._reflector.makeReflectionPlane();	
	this._reflector.makeReflectionMatrix();
	
	this._refractor.makeRefractionPlane();
};

/**
 * Initializes the water.
 */
Water.prototype._init = function() {
	
	// geometry of the reflector
	this.geometry = new THREE.PlaneBufferGeometry( this.width, this.height, this.segments, this.segments );
	
	// custom shader material
	this.material = new THREE.ShaderMaterial( {
		uniforms : THREE.UniformsUtils.clone( WaterShader.uniforms ),
		vertexShader : WaterShader.vertexShader,
		fragmentShader : WaterShader.fragmentShader
	} );

	// create reflector
	this._reflector = new Reflector( this._renderer, this._camera, this._world, {
		width: this.width,
		height: this.height,
		resolution: this.resolution
	});
	
	// create refractor
	this._refractor = new Refractor( this._renderer, this._camera, this._world, {
		width: this.width,
		height: this.height,
		resolution: this.resolution
	});
	
	// load du/dv map
	var dudvMap = new THREE.TextureLoader().load( "/assets/textures/Water_1_M_DuDv.jpg" );
	dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;
	
	// load corresponding normal map (as mentioned before, normal and du/dv
	// map should always match)
	var normalMap = new THREE.TextureLoader().load( "/assets/textures/Water_1_M_Normal.jpg" );
	normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
		
	// set reflection and refraction map
	this.material.uniforms.reflectionMap.value = this._reflector._reflectionMap;
	this.material.uniforms.refractionMap.value = this._refractor._refractionMap;

	// set texture matrices for projective texture mapping
	this.material.uniforms.textureMatrixReflection.value = this._reflector._textureMatrix;
	this.material.uniforms.textureMatrixRefraction.value = this._refractor._textureMatrix;
	
	// set du/dv and normal map to uniforms
	this.material.uniforms.dudvMap.value = dudvMap;
	this.material.uniforms.normalMap.value = normalMap;

	// set the amount of segments of the water. this value determines, how often
	// the normal and du/dv map are repeated
	this.material.uniforms.segments.value = this.geometry.parameters.widthSegments;
	
	// no auto update for water
	this.matrixAutoUpdate = false;
	this._reflector.matrixAutoUpdate = false;
	this._refractor.matrixAutoUpdate = false;
};

module.exports = Water;