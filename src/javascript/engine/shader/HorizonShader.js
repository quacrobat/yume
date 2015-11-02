/**
 * @file This shader creates a simple horizon. Use this shader as a material on
 * a sphere.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

module.exports = {

	uniforms : {

		"colorTop" : {
			type : "c",
			value : new THREE.Color( 0x000000 )
		},
		"colorBottom" : {
			type : "c",
			value : new THREE.Color( 0xff0000 )
		},
		// use this to change the vertical position of the horizon
		"offset" : {
			type : "f",
			value : 0
		},
		// use this to manipulate the gradient. value must be positive
		// high values: more bottom color
		// low values: more top color
		"exponent" : {
			type : "f",
			value : 0.6
		}

	},

	vertexShader : [

	"varying vec3 vWorldPosition;",

	"void main(){",

		// calculate the world position of the vertex. used in fragment shader to
		// determine the relative height and distance of the fragment to the horizon.
		"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

		"vWorldPosition = worldPosition.xyz;",

		"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

	"}"

	].join( "\n" ),

	fragmentShader : [
	                  
	"uniform vec3 colorTop;",
	"uniform vec3 colorBottom;",
	"uniform float offset;",
	"uniform float exponent;",

	"varying vec3 vWorldPosition;",

	"void main() {",

		// this indicates the relative height and distance of the current fragment to the horizon ( default: y = 0 plane ).
		// a negative value means full bottom color. a positive value means a gradient value from bottom to top color.
		"float h = normalize( vWorldPosition + offset ).y;",

		"gl_FragColor = vec4( mix( colorBottom, colorTop, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );",

	"}"

	].join( "\n" )
};