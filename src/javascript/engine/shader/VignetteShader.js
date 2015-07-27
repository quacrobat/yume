/**
 * @file This shader creates a vignette effect.
 * 
 * @author Human Interactive
 */

"use strict";

module.exports  = {

	uniforms: {

		"tDiffuse": {type: "t", value: null},   
		"radius":   {type: "f", value: 0.75},	// radius of the vignette, where 0.5 results in a circle fitting the screen, between 0.0 and 1.0
		"strength": {type: "f", value: 0.8},  	// strength of the vignette, between 0.0 and 1.0
		"softness": {type: "f", value: 0.45}   	// softness of the vignette, between 0.0 and 1.0
		
	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main(){",

			"vUv = uv;",
			
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform sampler2D tDiffuse;",
		"uniform float radius;",
		"uniform float strength;",
		"uniform float softness;",

		"varying vec2 vUv;", 

		"void main() {",
		
			"vec4 texelColor = texture2D (tDiffuse, vUv );",  // sample the texture
			
		    "vec2 position = vUv - vec2(0.5);", // determine the position from center, rather than lower-left (the origin).
		    
		    "float length = length(position);",  // determine the vector length of the center position
		    
		    "float vignette = 1.0 - smoothstep( radius - softness, radius, length);",    // the vignette effect, using smoothstep
		    
	        "texelColor.rgb = mix( texelColor.rgb, texelColor.rgb * vignette, strength );",
	        
	        "gl_FragColor = texelColor;",

		"}"

	].join("\n")
};