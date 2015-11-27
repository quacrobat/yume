/**
 * @file All helper and util functions are organized in this module.
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates an instance of utils.
 * 
 * @constructor
 */
function Utils() {

	Object.defineProperties( this, {
		TWO_PI : {
			value : Math.PI * 2,
			configurable : false,
			enumerable : true,
			writable : false
		},
		HALF_PI : {
			value : Math.PI * 0.5,
			configurable : false,
			enumerable : true,
			writable : false
		}
	} );
}

/**
 * This method colors the faces of a geometry with two colors in an alternating
 * way.
 * 
 * @param {THREE.Geometry} geometry - The geometry object.
 * @param {THREE.Color} color1 - The first color of the faces.
 * @param {THREE.Color} color2 - The second color of the faces.
 */
Utils.prototype.colorFaces = function( geometry, color1, color2 ) {

	var index;

	for ( index = 0; index < geometry.faces.length; index++ )
	{
		if ( index % 2 === 0 )
		{
			geometry.faces[ index ].color = color1;
		}
		else
		{
			geometry.faces[ index ].color = color2;
		}
	}

};

/**
 * Preloads images and executes a callback, when all work is done.
 * 
 * @param {object} images - An array with URLs of images.
 * @param {function} callback - This function is executed, when all images are
 * loaded.
 */
Utils.prototype.preloadImages = function( images, callback ) {

	var count = 0;

	var onLoad = function() {

		if ( ++count === images.length && typeof callback === "function" )
		{
			callback();
		}
	};

	var onError = function( e ) {

		throw "ERROR: Utils: Unable to preload image with URL: " + e.target.src;
	};

	for ( var i = 0; i < images.length; i++ )
	{
		var image = new global.Image();
		image.src = images[ i ];

		image.onload = onLoad;
		image.onerror = onError;
	}
};

module.exports = new Utils();