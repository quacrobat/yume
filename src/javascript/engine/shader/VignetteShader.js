/**
 * @file This shader creates a vignette effect. Used in post-processing.
 * 
 * @author Human Interactive
 */

"use strict";

module.exports = {

	uniforms : {

		"tDiffuse" : {
			type : "t",
			value : null
		},
		// radius of the vignette, where 0.5 results in a circle fitting the
		// screen, between 0.0 and 1.0
		"radius" : {
			type : "f",
			value : 0.75
		},
		// strength of the vignette, between 0.0 and 1.0
		"strength" : {
			type : "f",
			value : 0.8
		},
		// softness of the vignette, between 0.0 and 1.0
		"softness" : {
			type : "f",
			value : 0.45
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
	"uniform float radius;",
	"uniform float strength;",
	"uniform float softness;",

	"varying vec2 vUv;",

	"void main() {",

		// sample the texture
		"vec4 texelColor = texture2D ( tDiffuse, vUv );",
		
		// determine the position from center, rather than lower-left (the origin)
		"vec2 position = vUv - vec2( 0.5 );",

		// determine the vector length of the center position
		"float length = length( position );",

		// the vignette effect, using smoothstep
		"float vignette = 1.0 - smoothstep( radius - softness, radius, length );",

		"texelColor.rgb = mix( texelColor.rgb, texelColor.rgb * vignette, strength );",

		"gl_FragColor = texelColor;",

	"}"

	].join( "\n" )
};