/**
 * @file This shader transforms all colors to grayscale.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

module.exports  = {

	uniforms: {

		"tDiffuse": {type: "t", value: null},
		"direction": {type: "v2", value: new THREE.Vector2()},  // the direction of the blur: (1.0, 0.0) -> x-axis blur, (0.0, 1.0) -> y-axis blur
		"blur": {type: "f", value: 0.0},  // the amount to blur

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
		"uniform vec2 direction;",
		"uniform float blur;",

		"varying vec2 vUv;",

		"void main() {",
		
			"vec4 result = vec4(0.0);",  // the result color
				
		    "result += texture2D(tDiffuse, vec2(vUv.x - 4.0 * blur * direction.x, vUv.y - 4.0 * blur * direction.y)) * 0.0162162162;",
		    "result += texture2D(tDiffuse, vec2(vUv.x - 3.0 * blur * direction.x, vUv.y - 3.0 * blur * direction.y)) * 0.0540540541;",
		    "result += texture2D(tDiffuse, vec2(vUv.x - 2.0 * blur * direction.x, vUv.y - 2.0 * blur * direction.y)) * 0.1216216216;",
		    "result += texture2D(tDiffuse, vec2(vUv.x - 1.0 * blur * direction.x, vUv.y - 1.0 * blur * direction.y)) * 0.1945945946;",
		    
		    "result += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.2270270270;",
		    
		    "result += texture2D(tDiffuse, vec2(vUv.x + 1.0 * blur * direction.x, vUv.y + 1.0 * blur * direction.y)) * 0.1945945946;",
		    "result += texture2D(tDiffuse, vec2(vUv.x + 2.0 * blur * direction.x, vUv.y + 2.0 * blur * direction.y)) * 0.1216216216;",
		    "result += texture2D(tDiffuse, vec2(vUv.x + 3.0 * blur * direction.x, vUv.y + 3.0 * blur * direction.y)) * 0.0540540541;",
		    "result += texture2D(tDiffuse, vec2(vUv.x + 4.0 * blur * direction.x, vUv.y + 4.0 * blur * direction.y)) * 0.0162162162;",
		    
		    "gl_FragColor = result;",
		   	    
		"}"

	].join("\n")
};