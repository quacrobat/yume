/**
 * @file This shader creates a 2D flame. Use it as a material along with
 * a view-oriented billboard to simulate candles or other fire effects. If you
 * have performance issues with this shader, use sprite animations instead.
 * 
 * @author Human Interactive
 */

"use strict";

module.exports = {
		
	defines: {
		NUM_OCTAVES: 5
	},

	uniforms : {

		// use this to control the motion speed of the flame
		"speed" : {
			type : "f",
			value : 0.3
		},
		// use this to control the disturbance of the flame. a higher value
		// means more scattering
		"scattering" : {
			type : "f",
			value : 1.0
		},
		// use this to control the sharpness of the flame's border
		"sharpness" : {
			type : "f",
			value : 64
		},
		// use this to control the general intensity of the flame. lower values
		// will dim the light
		"intensity" : {
			type : "f",
			value : 1.5
		},
		// the elapsed time
		"time" : {
			type : "f",
			value : 0.0
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

		"uniform float speed;",
		"uniform float scattering;",
		"uniform float sharpness;",
		"uniform float intensity;",
		"uniform float time;",
		
		"varying vec2 vUv;",
	                  
		"float random( in float x ) {",
		
		    "return fract( sin( x ) * 1e4 );",
		"}",
		
		"float random( in vec2 uv ) {",
		    
		    "return fract( 1e4 * sin( 17.0 * uv.x + uv.y * 0.1 ) * ( 0.1 + abs( sin( uv.y * 13.0 + uv.x ) ) ) );",
		"}",
		
		"float noise( in vec2 x ) {",
		    
		    "vec2 i = floor( x );",
		    "vec2 f = fract( x );",
		    
		    // these four points are used for interpolation in 2D
		    "float a = random( i );",
		    "float b = random( i + vec2( 1.0, 0.0 ) );",
		    "float c = random( i + vec2( 0.0, 1.0 ) );",
		    "float d = random( i + vec2( 1.0, 1.0 ) );",
		    
		    // cubic curve for interpolation
		    "vec2 u = f * f * ( 3.0 - 2.0 * f );",
		    
		    "return mix( a, b, u.x ) + ( c - a ) * u.y * ( 1.0 - u.x ) + ( d - b ) * u.x * u.y;",
		"}",
		
		"float fbm( in vec2 x ) {",
		    
		    "float v = 0.0;",
		    "float a = 0.5;",
		    
		    "vec2 shift = vec2( 100 );",
		    
		    // rotate to reduce axial bias
		    "mat2 rot = mat2( cos( 0.5 ), sin( 0.5 ), -sin( 0.5 ), cos( 0.5 ) );",
		    
		    "for ( int i = 0; i < NUM_OCTAVES; ++i ) {",
		        
		        // sum noise functions
		        "v += a * noise( x );",
		        "x = rot * x * 2.0 + shift;",
		        "a *= 0.5;",
		    "}",
		    
		    "return v;",
		"}",
		
		"void main(){",
			
		    "vec2 position = vUv;",
		    
		    // position the flame in the center of the screen
		    "position.x -= 0.5;",
		    "position.y -= 0.25;",
		    
		    // the default color of the background/border
		    "vec4 defaultColor = vec4( 0.5, 0.5, 0.5, 0.0 );",
		    
		    // this will calculate the motions and structure of the flame
		    "float n = fbm( vUv * scattering - vec2( 0.0, time * speed ) );",
		    
		    // this will compute the form of the flame
		    "float c = 1.0 - sharpness * pow( max( 0.0, length( position * vec2( 4.0 + position.y, 1.0 ) ) - n * max( 0.0, position.y + 0.25 ) ), 1.2 );",
		    "float c1 = n * c * ( 1.5 - pow( 1.2 * vUv.y, 4.0 ) );",
		    
		    // ensure the value is between zero and one
		    "c1 = clamp( c1, 0.0 ,1.0 );",
		    
		    // the color of the flame
		    "vec4 flameColor = vec4( 1.5 * c1, 1.5 * c1 * c1 * c1, c1 * c1 * c1 * c1 * c1 * c1, 1.0 );",
		    
		    // this will determine the final shape of the flame
		    "float a =  c * ( 1.0 - pow( vUv.y, intensity ) );",
		    
		    // mix the background and flame shape
		    "gl_FragColor = vec4( mix( defaultColor, flameColor, a ) );",
		    
		"}",

	].join( "\n" )
};