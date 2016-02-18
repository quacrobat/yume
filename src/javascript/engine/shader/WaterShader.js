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
		
		// this texture will be used to distort uv coordinates
		"dudvMap" : {
			type : "t",
			value : null
		},
		
		// this texture will be used to retrieve normals
		"normalMap" : {
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

		// elapsed time value
		"time" : {
			type : "f",
			value : 0.0
		},
				
		// strength of the waves
		"waveStrength" : {
			type : "f",
			value : 0.1
		},
		
		// speed of the waves
		"waveSpeed" : {
			type : "f",
			value : 0.03
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
	
		"void main() {",
		
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			
			// default uv coordinates. the segment uniform scales them, so
			// the normal and du/dv map are sampled more often
			"vUv = uv * segments;",
			
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
		"uniform sampler2D dudvMap;",
		"uniform sampler2D normalMap;",
		
		"uniform vec3 lightDirection;",
		"uniform vec3 lightColor;",
		"uniform vec3 waterColor;",
		
		"uniform float time;",
		"uniform float waveStrength;",
		"uniform float waveSpeed;",
		"uniform float waterReflectivity;",
		"uniform float shininess;",
		
		"varying vec4 vUvReflect;",
		"varying vec4 vUvRefract;",
		"varying vec3 vToEye;",
		"varying vec2 vUv;",
	
		"void main() {",
		
			"vec3 toEye = normalize( vToEye );",

			// distortion
			"vec2 distortedUv = texture2D( dudvMap, vec2( vUv.x + time * waveSpeed, vUv.y ) ).rg * waveStrength;",
			"distortedUv = vUv + vec2( distortedUv.x, distortedUv.y + time * waveSpeed );",
			"vec2 distortion = ( texture2D( dudvMap, distortedUv ).rg * 2.0 - 1.0 ) * waveStrength;",
			
			// distort uv coordiantes
			"vec4 reflectTexCoords = vec4( vUvReflect );",
			"reflectTexCoords.xy += distortion;",
			
			"vec4 refractTexCoords = vec4( vUvRefract );",
			"refractTexCoords.xy += distortion;",
			
			// sample textures
			"vec4 reflectColor = texture2DProj( reflectionMap, reflectTexCoords );",
			"vec4 refractColor = texture2DProj( refractionMap, refractTexCoords );",
			
			// calculate normal
			"vec4 normalColor  = texture2D( normalMap, distortedUv );",	
			"vec3 normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );",
			
			// fresnel effect	
			"float theta = max( dot( toEye, normal ), 0.0 );",
			"float reflectance = waterReflectivity + ( 1.0 - waterReflectivity ) * pow( ( 1.0 - theta ), 5.0 );",
			
			// light calculation
			"vec3 reflectedLight = normalize( reflect( -lightDirection, normal ) );",
			"float specular = pow( max( dot( reflectedLight, toEye ), 0.0 ) , shininess );",
			"vec4 specularColor =  vec4( lightColor * specular, 0.0 );",

			// multiply water color with the mix of both textures. then add lighting
			"gl_FragColor = vec4( waterColor, 1.0 ) * mix( refractColor, reflectColor, reflectance ) + specularColor;",
		
		"}"

	].join( "\n" )
};