/**
 * @file This shader is used as a material for reflectors.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

module.exports = {

	uniforms : {

		// this texture contains the reflection of the reflectors
		"reflectionMap" : {
			type : "t",
			value : null
		},
		
		// this matrix is used for projective texture mapping
		"textureMatrix" : {
			type : "m4",
			value : null
		}

	},

	vertexShader : [

		"uniform mat4 textureMatrix;",
	
		"varying vec4 vUv;",
	
		"void main() {",
	
			// uv coordinates for texture projection
			"vUv = textureMatrix * vec4( position, 1.0 );",
	
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
	
		"}"

	].join( "\n" ),

	fragmentShader : [

		"uniform sampler2D reflectionMap;",
		
		"varying vec4 vUv;",
		
		"void main() {",

			"gl_FragColor = texture2DProj( reflectionMap, vUv );",
		
		"}"

	].join( "\n" )
};