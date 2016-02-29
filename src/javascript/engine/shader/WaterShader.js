/**
 * @file This shader is used as a material for a water mesh.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

module.exports = {

	uniforms : {

		// this texture contains the reflection of the water
		"reflectionMap" : {
			type : "t",
			value : null
		},
		
		// this texture contains the refraction of the water
		"refractionMap" : {
			type : "t",
			value : null
		},
		
		// this texture contains the flow of the water
		"flowMap" : {
			type : "t",
			value : null
		},
		
		// this texture is used to create a more realistic water flow
		"noiseMap" : {
			type : "t",
			value : null
		},
		
		// this texture will be used to retrieve normals
		"normalMap0" : {
			type : "t",
			value : null
		},
		
		// this texture will be used to retrieve normals
		"normalMap1" : {
			type : "t",
			value : null
		},

		// this matrix is used for projective texture mapping
		"textureMatrixReflection" : {
			type : "m4",
			value : null
		},
		
		// this matrix is used for projective texture mapping
		"textureMatrixRefraction" : {
			type : "m4",
			value : null
		},

		// first offset of the flowmap
		"flowMapOffset0" : {
			type : "f",
			value : 0
		},
		
		// second offset of the flowmap
		"flowMapOffset1" : {
			type : "f",
			value : 0
		},
		
		// color of the water
		"waterColor" : {
			type : "c",
			value : null
		},
		
		// the reflectivity of the water
		"waterReflectivity" : {
			type : "f",
			value : 0.02
		},
		
		// the direction of the light
		"lightDirection" : {
			type : "v3",
			value : null
		},
		
		// the color of the light
		"lightColor" : {
			type : "c",
			value : null
		},
		
		// the shininess of the water
		"shininess" : {
			type : "f",
			value : 20.0
		},
		
		// the segments of the water
		"segments" : {
			type : "f",
			value : 1.0
		},
		
		// half cycle of a flow map phase
		"halfCycle" : {
			type : "f",
			value : 0.0
		}

	},

	vertexShader : [

		"uniform mat4 textureMatrixReflection;",
		"uniform mat4 textureMatrixRefraction;",
		
		"uniform float segments;",
	
		"varying vec4 vUvReflect;",
		"varying vec4 vUvRefract;",
		"varying vec3 vToEye;",
		"varying vec2 vUv;",
		"varying float vTexScale;",
	
		"void main() {",
		
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			
			// default uv coordinates
			"vUv = uv;",
			
			// used for scaling of normal maps
			"vTexScale = segments;",
			
			// uv coordinates for texture projection
			"vUvReflect = textureMatrixReflection * vec4( position, 1.0 );",
			"vUvRefract = textureMatrixRefraction * vec4( position, 1.0 );",
			
			// calculate toEye vector
			"vToEye = cameraPosition - worldPosition.xyz;",
	
			"gl_Position = projectionMatrix * viewMatrix * worldPosition;",
	
		"}"

	].join( "\n" ),

	fragmentShader : [

		"uniform sampler2D reflectionMap;",
		"uniform sampler2D refractionMap;",
		"uniform sampler2D flowMap;",
		"uniform sampler2D noiseMap;",
		"uniform sampler2D normalMap0;",
		"uniform sampler2D normalMap1;",
		
		"uniform vec3 lightDirection;",
		"uniform vec3 lightColor;",
		"uniform vec3 waterColor;",
		
		"uniform float flowMapOffset0;",
		"uniform float flowMapOffset1;",
		"uniform float waterReflectivity;",
		"uniform float shininess;",
		"uniform float halfCycle;",
		
		"varying vec4 vUvReflect;",
		"varying vec4 vUvRefract;",
		"varying vec3 vToEye;",
		"varying vec2 vUv;",
		"varying float vTexScale;",
	
		"void main() {",
		
			"vec3 toEye = normalize( vToEye );",
			
			// sample flow map
			"vec2 flow = texture2D( flowMap, vUv ).rg * 2.0 - 1.0;",
			"flow.r *= -1.0;",
			
			// sample noise map
			"float cycleOffset = texture2D( noiseMap, vUv ).r;",
			
			// calculate current phases
			"float phase0 = cycleOffset * 0.5 + flowMapOffset0;",
			"float phase1 = cycleOffset * 0.5 + flowMapOffset1;",
			
			// sample normal maps
			"vec4 normalColor0 = texture2D( normalMap0, ( vUv * vTexScale ) + flow * phase0 );",
			"vec4 normalColor1 = texture2D( normalMap1, ( vUv * vTexScale ) + flow * phase1 );",
			
			// linear interpolate to get the final normal color
			"float flowLerp = abs( halfCycle - flowMapOffset0 ) / halfCycle;",
			"vec4 normalColor = mix( normalColor0, normalColor1, flowLerp );",
			
			// determine the normal vector
			"vec3 normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );",
			
			// fresnel effect	
			"float theta = max( dot( toEye, normal ), 0.0 );",
			"float reflectance = waterReflectivity + ( 1.0 - waterReflectivity ) * pow( ( 1.0 - theta ), 5.0 );",
			
			// light calculation
			"vec3 reflectedLight = normalize( reflect( -lightDirection, normal ) );",
			"float specular = pow( max( dot( reflectedLight, toEye ), 0.0 ) , shininess );",
			"vec4 specularColor =  vec4( lightColor * specular, 0.0 );",
			
			// sample textures
			"vec3 uvReflect = vUvReflect.xyz / vUvReflect.w;",	
			"vec3 uvRefract = vUvRefract.xyz / vUvRefract.w;",
			
			"vec4 reflectColor = texture2D( reflectionMap, uvReflect.xy + uvReflect.z * normal.xz * 0.05 );",
			"vec4 refractColor = texture2D( refractionMap, uvRefract.xy + uvRefract.z * normal.xz * 0.05 );",

			// multiply water color with the mix of both textures. then add lighting
			"gl_FragColor = vec4( waterColor, 1.0 ) * mix( refractColor, reflectColor, reflectance ) + specularColor;",
			
		"}"

	].join( "\n" )
};