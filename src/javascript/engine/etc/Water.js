/**
 * @file This file creates a realistic and expensive water effect. The material
 * is real-time reflective & refractive, it calculates a distortion and flow of
 * the water surface and implements a basic fresnel and lighting equation.
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
		// speed of the water motions
		waterSpeed : {
			value : 0.03,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the color of the water
		waterColor : {
			value : new THREE.Color(),
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
		// a cycle of a flow map phase
		cycle : {
			value : 0.15,
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
		},
		// half cycle of a flow map phase
		_halfCycle : {
			value : 0,
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
 * @param {number} delta - The delta time value.
 */
Water.prototype.update = function( delta ) {

	// the water should not render itself
	this.material.visible = false;

	// update reflection and refraction
	this._reflector.update();
	this._refractor.update();

	// make material visible again
	this.material.visible = true;

	// update water properties
	this.material.uniforms.waterColor.value = this.waterColor;
	this.material.uniforms.waterReflectivity.value = this.waterReflectivity;

	// update light properties
	this.material.uniforms.lightDirection.value = this.lightDirection;
	this.material.uniforms.lightColor.value = this.lightColor;
	this.material.uniforms.shininess.value = this.shininess;

	// update water flow properties
	this.material.uniforms.flowMapOffset0.value += this.waterSpeed * delta;
	this.material.uniforms.flowMapOffset1.value += this.waterSpeed * delta;

	// reset properties if necessary
	if ( this.material.uniforms.flowMapOffset0.value >= this.cycle )
	{
		this.material.uniforms.flowMapOffset0.value = 0;

		// if the delta value is high, "flowMapOffset1" must not set to zero
		// but to its initial value to avoid a "reset" effect
		if ( this.material.uniforms.flowMapOffset1.value >= this.cycle )
		{
			this.material.uniforms.flowMapOffset1.value = this._halfCycle;

			return;
		}
	}

	if ( this.material.uniforms.flowMapOffset1.value >= this.cycle )
	{
		this.material.uniforms.flowMapOffset1.value = 0;
	}
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
	
	// calculate half cycle
	this._halfCycle = this.cycle * 0.5;
	
	// load flow and noise map
	var flowMap = new THREE.TextureLoader().load( "/assets/textures/Water_1_M_Flow.jpg" );
	var noiseMap = new THREE.TextureLoader().load( "/assets/textures/Water_1_M_Noise.jpg" );
	
	// load normal maps
	var normalMap0 = new THREE.TextureLoader().load( "/assets/textures/Water_1_M_Normal.jpg" );
	normalMap0.wrapS = normalMap0.wrapT = THREE.RepeatWrapping;
	
	var normalMap1 = new THREE.TextureLoader().load( "/assets/textures/Water_2_M_Normal.jpg" );
	normalMap1.wrapS = normalMap1.wrapT = THREE.RepeatWrapping;
		
	// set reflection and refraction map
	this.material.uniforms.reflectionMap.value = this._reflector._reflectionMap;
	this.material.uniforms.refractionMap.value = this._refractor._refractionMap;

	// set texture matrices for projective texture mapping
	this.material.uniforms.textureMatrixReflection.value = this._reflector._textureMatrix;
	this.material.uniforms.textureMatrixRefraction.value = this._refractor._textureMatrix;
	
	// set flow, noise and normal map to uniforms
	this.material.uniforms.flowMap.value = flowMap;
	this.material.uniforms.noiseMap.value = noiseMap;
	this.material.uniforms.normalMap0.value = normalMap0;
	this.material.uniforms.normalMap1.value = normalMap1;

	// set the amount of segments of the water. this value determines, how often
	// normal maps are repeated
	this.material.uniforms.segments.value = this.segments;
	
	// set default values for water flow
	this.material.uniforms.flowMapOffset0.value = 0;
	this.material.uniforms.flowMapOffset1.value = this._halfCycle;
	this.material.uniforms.halfCycle.value = this._halfCycle;
	
	// no auto-update for water
	this.matrixAutoUpdate = false;
};

module.exports = Water;