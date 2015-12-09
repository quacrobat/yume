/**
 * @file This shader can be used for vertex displacement to create water or
 * fabric materials. It implements an exemplary diffuse lighting equation, which
 * uses ambient and directional lights.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

module.exports = {
		
	defines: {
		NUM_OCTAVES: 5
	},

	uniforms : THREE.UniformsUtils.merge( [ THREE.UniformsLib.lights, {
		"fTime" : {
			type : "f",
			value : 0
		}
	} ] ),

	lights : true, // use lights of stage in this shader

	vertexShader : [

	"uniform float fTime;",

	"varying vec3 vNormalWorld;",

	// 1D random function
	"float random( float x ) {", 
	
		"return fract( sin( x ) * 1e4 );",
		
	"}",

	// 3D value noise function
	"float noise( vec3 x ) {",

		"const vec3 step = vec3( 110, 241, 171 );",

		"vec3 i = floor( x );", 
		"vec3 f = fract( x );",

		"float n = dot( i, step );",

		"vec3 u = f * f * ( 3.0 - 2.0 * f );",

		"return mix( mix( mix( random( n + dot( step, vec3( 0, 0, 0 ) ) ), random( n + dot( step, vec3( 1, 0, 0 ) ) ), u.x ),", 
						 "mix( random( n + dot( step, vec3( 0, 1, 0 ) ) ), random( n + dot( step, vec3( 1, 1, 0 ) ) ), u.x ), u.y ),", 
					"mix( mix( random( n + dot( step, vec3( 0, 0, 1 ) ) ), random( n + dot( step, vec3( 1, 0, 1 ) ) ), u.x ),", 
						 "mix( random( n + dot( step, vec3( 0, 1, 1 ) ) ), random( n + dot( step, vec3( 1, 1, 1 ) ) ), u.x ), u.y ), u.z );", 
						 
	"}",

	// 3D fbm-noise function
	"float fbm( in vec3 x ) {",

		"float v = 0.0;", 
		"float a = 0.5;",

		"vec3 shift = vec3( 100 );",

		"for ( int i = 0; i < NUM_OCTAVES; ++i ) {",

			// sum noise functions
			"v += a * noise( x );", "x = x * 2.0 + shift;", "a *= 0.5;",
			
		"}",

		"return v;",

	"}",

	"void main(){",

		// calculate new vertex position (displacement)
		"vec3 newPosition = position + 10.0 * normal * fbm( position * 0.05 + 0.05 * fTime );",

		// calculate normal in world space
		"vNormalWorld = normalize( modelMatrix * vec4( normal, 0.0 ) ).xyz;",

		"gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );",

	"}"

	].join( "\n" ),

	fragmentShader : [

	"uniform vec3 ambientLightColor;", 
	"uniform vec3 directionalLightDirection[MAX_DIR_LIGHTS];", 
	"uniform vec3 directionalLightColor[MAX_DIR_LIGHTS];",

	"varying vec3 vNormalWorld;",

	"void main() {",

		"vec4 color = vec4( 0.0, 0.0, 1.0, 1.0 );", "vec3 diffuseLightColor = vec3( 0.0, 0.0, 0.0 );",

		// calculate for each directional light the diffuse light color
		"for( int l = 0; l < MAX_DIR_LIGHTS; l++ ) {",

			"diffuseLightColor += max( dot ( vNormalWorld, directionalLightDirection[ l ] ), 0.0 ) * directionalLightColor[ l ];",

		"}",

		"vec3 lightWeighting = ambientLightColor + diffuseLightColor;",

		"gl_FragColor = vec4( color.rgb * lightWeighting, color.a );",

	"}"

	].join( "\n" )
};