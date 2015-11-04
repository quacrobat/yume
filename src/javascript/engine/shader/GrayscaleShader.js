/**
 * @file This shader transforms all colors to grayscale. Used in
 * post-processing.
 * 
 * @author Human Interactive
 */

"use strict";

module.exports = {

	uniforms : {

		"tDiffuse" : {
			type : "t",
			value : null
		}

	},

	vertexShader : [

	"varying vec2 vUv;",

	"void main(){",

		"vUv = uv;",

		"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

	"}"

	].join( "\n" ),

	fragmentShader : [

	"uniform sampler2D tDiffuse;",

	"varying vec2 vUv;",

	"void main() {",

		// sample the texture
		"vec4 texelColor = texture2D( tDiffuse, vUv );",

		// NTSC conversion weights
		"float grayscale = dot( texelColor.rgb, vec3( 0.299, 0.587, 0.114 ) );",

		// apply grayscale to the each rgb channel
		"gl_FragColor = vec4( vec3( grayscale ), texelColor.a );",

	"}"

	].join( "\n" )
};