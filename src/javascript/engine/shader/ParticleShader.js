/**
 * @file This shader will be used as a material for particles.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

module.exports = {

	defines : {

		// this activates size attenuation for particles. if you don't need
		// this, just delete this entry
		USE_SIZE_ATTENUATION : "",
		// this activates texture sampling. delete this constant if you don't
		// use a texture, otherwise you will get a black particle
		USE_TEXTURE : "",
	},

	uniforms : {

		// the texture of the particles
		"texture" : {
			type : "t",
			value : null
		},
		// the amount of size-scaling of a particle
		"scale" : {
			type : "f",
			value : 300
		}

	},

	vertexShader : [

		"uniform float scale;",
	
		// the size of a particle
		"attribute float size;",
		
		// the angle of a particle
		"attribute float angle;",
	
		// the color of a particle
		"attribute vec4 color;",
	
		// and it is used by the fragment shader
		"varying vec4 vColor;",
		
		// angle is only used by the fragment shader if there is a texture
		"#ifdef USE_TEXTURE",
		
			"varying float vAngle;",
			
		"#endif",
	
		"void main(){",

			// assign attributes to varyings
			"vColor = color;",
			
			"#ifdef USE_TEXTURE",
			
				"vAngle = angle;",
				
			"#endif",
			
			// calculate the position in eye/camera space
			"vec4 positionEye = modelViewMatrix * vec4( position, 1.0 );",
	
			// check symbolic constant to control size attenuation
			"#ifdef USE_SIZE_ATTENUATION",
	
				// to create a realistic effect we need to ensure that particles
				// receive a greater point size if they are close to the camera
				"gl_PointSize = size * ( scale / length( positionEye.xyz ) );",
	
			"#else",
	
				"gl_PointSize = size;",
	
			"#endif",
	
			"gl_Position = projectionMatrix * positionEye;",
	
		"}"

	].join( "\n" ),

	fragmentShader : [

		"uniform sampler2D texture;",
	
		"varying vec4 vColor;",
		
		"#ifdef USE_TEXTURE",
		
			"varying float vAngle;",
			
		"#endif",
	
		"void main() {",
		
			"vec4 color = vColor;",
					
			"#ifdef USE_TEXTURE",
			
				"float c = cos( vAngle );",	
				"float s = sin( vAngle );",
				
				// this will rotate the UV coordinate by the given angle. 
				// rotating the texture will look like rotating the entire particle
				"vec2 rotatedUV = vec2( c * ( gl_PointCoord.x - 0.5 ) + s * ( gl_PointCoord.y - 0.5 ) + 0.5, c * ( gl_PointCoord.y - 0.5 ) - s * ( gl_PointCoord.x - 0.5 ) + 0.5 );",

				"color *= texture2D( texture, rotatedUV );",
			
			"#endif",
	
			"gl_FragColor = color;",
	
		"}"

	].join( "\n" )
};