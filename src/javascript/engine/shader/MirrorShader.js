/**
 * @file This shader is used as a material for mirrors.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

module.exports = {

	uniforms : {

		// the color of the mirror
		"color" : {
			type : "c",
			value : null
		},
		
		// this texture contains the reflection of the mirror
		"texture" : {
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
			"vUv = textureMatrix * modelMatrix * vec4( position, 1.0 );",
	
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
	
		"}"

	].join( "\n" ),

	fragmentShader : [

		"uniform vec3 color;",
		
		"uniform sampler2D texture;",
		
		"varying vec4 vUv;",
		
		"float blendOverlay( in float base, in float blend ) {",
		
			"return ( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );",
			
		"}",
		
		"void main() {",
		
			"vec4 texel = texture2DProj( texture, vUv );",
			
			"gl_FragColor = vec4( blendOverlay( color.r, texel.r ), blendOverlay( color.g, texel.g ), blendOverlay( color.b, texel.b ), 1.0 );",
		
		"}"

	].join( "\n" )
};