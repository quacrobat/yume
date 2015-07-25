/**
 * @file This shader transforms all colors to grayscale.
 * 
 * @author Human Interactive
 */

"use strict";

module.exports  = {

	uniforms: {

		"tDiffuse": {type: "t", value: null}

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main(){",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

		"void main() {",
		
			"vec4 texel = texture2D(tDiffuse, vUv);",
		    "float grayScale = dot(texel.xyz, vec3(0.299, 0.587, 0.114));",
	        "gl_FragColor = vec4(grayScale, grayScale, grayScale, 1.0);",

		"}"

	].join("\n")
};