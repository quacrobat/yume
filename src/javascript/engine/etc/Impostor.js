/**
 * @file This prototype handles all stuff for impostors. An impostor
 * is a billboard that is created on the fly by rendering a complex
 * object from the current viewpoint into an image texture, which is mapped
 * on the billboard.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 10.7.1, Impostors
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require("three");
/**
 * Creates a an impostor.
 * 
 * @constructor 
 * @augments THREE.Mesh
 * 
 * @param {string} id - The id of the impostor.
 * @param {THREE.Object3D} object - The source 3D object of the impostor.
 * @param {number} resolution - The resolution of the rendered texture.
 */
function Impostor(id, object, resolution) {
	
	THREE.Mesh.call(this);

	Object.defineProperties(this, {
		idImpostor: {
			value: id,
			configurable: false,
			enumerable: true,
			writable: false
		},
		object: {
			value: object,
			configurable: false,
			enumerable: true,
			writable: true
		},
		resolution: {
			value: resolution || 128,
			configurable: false,
			enumerable: true,
			writable: true
		},
		_renderTarget: {
			value: null,
			configurable: false,
			enumerable: true,
			writable: true
		},
		_boundingBox: {
			value: new THREE.Box3(),
			configurable: false,
			enumerable: false,
			writable: true
		},
		_scene: {
			value: new THREE.Scene(),
			configurable: false,
			enumerable: false,
			writable: true
		},
		_camera:  {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_lights:  {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_renderer: {
			value: null,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
	
	// create render target
	this._renderTarget = new THREE.WebGLRenderTarget( this.resolution, this.resolution, {format: THREE.RGBAFormat});
	
	// prevent automatic update of model matrix
	this.matrixAutoUpdate = false;
}

Impostor.prototype = Object.create(THREE.Mesh.prototype);
Impostor.prototype.constructor = Impostor;

/**
 * Prepares the generation of the impostor.
 * 
 * @param {Renderer} renderer - The renderer object.
 * @param {Camera} camera - The camera object.
 * @param {object} lights - The lights of the stage.
 */
Impostor.prototype.prepareGeneration = function(renderer, camera, lights){

	this._renderer = renderer;
	this._camera = camera;
	this._lights = lights;
};

/**
 * Generates the Impostor.
 */
Impostor.prototype.generate = function(){

	this._computeBoundingBox();
	
	this._prepareCamera();
	
	this._prepareProjectionMatrix();
	
	this._prepareScene();
	
	this._render();
	
	this._createImpostor();
	
	this._clear();
};

/**
 * Updates an impostor. The impostor is handled like a viewpoint-oriented, axis-aligned billboard.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 10.6.2, World-Oriented Billboards
 * 
 * @param {THREE.Vector3} cameraWorldPosition - The world position of the camera.
 */
Impostor.prototype.update = (function(){
	
	var front = new THREE.Vector3();
	var up = new THREE.Vector3(0, 1, 0);
	var right = new THREE.Vector3();
	
	return function(cameraWorldPosition){
		
		// compute "front" or "look" vector
		front.subVectors(cameraWorldPosition, this.getWorldPosition());
		front.y = 0; // this will ensure, that the impostor rotates correctly around the axis
		front.normalize();
		
		// compute vector "right" out of "up" and "front" vector
		right.crossVectors(up, front);
		
		// create new matrix from basis vectors
		// this overrides other transformations like scaling
		this.matrix.makeBasis(right, up, front);
		
		// set the position
		this.matrix.setPosition(this.position);
		
		// force world matrix to update
		this.matrixWorldNeedsUpdate = true;
	};
	
}());

/**
 * Computes the axis-aligned bounding box of the object.
 */
Impostor.prototype._computeBoundingBox = function(){

	this._boundingBox.setFromObject(this.object);
};

/**
 * Prepares the camera for rendering.
 */
Impostor.prototype._prepareCamera = function(){

	// the camera should look at the center of the AABB
	this._camera.lookAt(this._boundingBox.center());
	
	// compute new matrices
	this._camera.updateMatrix();
	this._camera.updateMatrixWorld();
	this._camera.matrixWorldInverse.getInverse(this._camera.matrixWorld);
};

/**
 * Prepares the projection matrix. First, the bounding rectangle of the projected
 * bounding box is calculated. This rectangle is used to create a new frustum, which encloses
 * the the bounding box as much as possible.
 */
Impostor.prototype._prepareProjectionMatrix = function(){

	var points = [
	              new THREE.Vector3(),
	              new THREE.Vector3(),
	              new THREE.Vector3(),
	              new THREE.Vector3(),
	              new THREE.Vector3(),
	              new THREE.Vector3(),
	              new THREE.Vector3(),
	              new THREE.Vector3()
	              ];
	
	var minX = 0, minY = 0, maxX = 0, maxY = 0;
	
	// calculate each point of the bounding box
	points[0].set( this._boundingBox.min.x, this._boundingBox.min.y, this._boundingBox.min.z );
	points[1].set( this._boundingBox.min.x, this._boundingBox.min.y, this._boundingBox.max.z );
	points[2].set( this._boundingBox.min.x, this._boundingBox.max.y, this._boundingBox.min.z );
	points[3].set( this._boundingBox.min.x, this._boundingBox.max.y, this._boundingBox.max.z );
	points[4].set( this._boundingBox.max.x, this._boundingBox.min.y, this._boundingBox.min.z );
	points[5].set( this._boundingBox.max.x, this._boundingBox.min.y, this._boundingBox.max.z );
	points[6].set( this._boundingBox.max.x, this._boundingBox.max.y, this._boundingBox.min.z );
	points[7].set( this._boundingBox.max.x, this._boundingBox.max.y, this._boundingBox.max.z );
	
	// transform and project each point to get clip coordinates
	points[0].applyMatrix4( this._camera.matrixWorldInverse ).applyProjection( this._camera.projectionMatrix );
	points[1].applyMatrix4( this._camera.matrixWorldInverse ).applyProjection( this._camera.projectionMatrix );
	points[2].applyMatrix4( this._camera.matrixWorldInverse ).applyProjection( this._camera.projectionMatrix );
	points[3].applyMatrix4( this._camera.matrixWorldInverse ).applyProjection( this._camera.projectionMatrix );
	points[4].applyMatrix4( this._camera.matrixWorldInverse ).applyProjection( this._camera.projectionMatrix );
	points[5].applyMatrix4( this._camera.matrixWorldInverse ).applyProjection( this._camera.projectionMatrix );
	points[6].applyMatrix4( this._camera.matrixWorldInverse ).applyProjection( this._camera.projectionMatrix );
	points[7].applyMatrix4( this._camera.matrixWorldInverse ).applyProjection( this._camera.projectionMatrix );
	
	// determine min/max values of x and y coordinate
	for(var index = 0; index < points.length; index++){
		
		minX = Math.min(minX, points[index].x);
		minY = Math.min(minY, points[index].y);
		
		maxX = Math.max(maxX, points[index].x);
		maxY = Math.max(maxY, points[index].y);
	}
	
	// create new projection matrix
	var projectionMatrix = new THREE.Matrix4();
	
	// calculate new frustum
	var frustumHeight = this._camera.near * Math.tan( THREE.Math.degToRad( this._camera.fov * 0.5 ) );
	var frustumWidth = frustumHeight * ( global.window.innerWidth / global.window.innerHeight );
	
	projectionMatrix.makeFrustum( frustumWidth * minX, 
								  frustumWidth * maxX,  
								  frustumHeight * minY, 
								  frustumHeight * maxY, 
								  this._camera.near, 
								  this._camera.far );
	
	// assign new matrix
	this._camera.projectionMatrix = projectionMatrix;
};

/**
 * Prepares the scene for rendering. This method ensures, that the actual object and
 * the entire lightning of the scene is part of the rendering.
 */
Impostor.prototype._prepareScene = function(){

	// add object
	this.object = this.object.clone();
	
	// ensure its visible
	this.object.visible = true;

	// add to scene
	this._scene.add(this.object);
	
	// add all light source
	Array.prototype.push.apply(this._scene.children, this._lights);
};

/**
 * Renders the scene to a render target (texture).
 */
Impostor.prototype._render = function(){
	
	// save existing clear color and alpha
	var clearColor = this._renderer.getClearColor();
	var clearAlpha = this._renderer.getClearAlpha();
	
	// clear renderer so the image will have transparency
	this._renderer.setClearColor(0x000000, 0);
	
	// render to target
	this._renderer.render(this._scene, this._camera, this._renderTarget, true);
	
	// restore clear values
	this._renderer.setClearColor(clearColor, clearAlpha);
};

/**
 * Creates the impostor.
 */
Impostor.prototype._createImpostor = function(){
	
	// calculate the dimensions of the gemoetry
	var width =  this._boundingBox.max.x - this._boundingBox.min.x;
	var height = this._boundingBox.max.y - this._boundingBox.min.y;

	// assign geometry and material
	this.geometry = new THREE.PlaneBufferGeometry(width, height);
	
	// the alphaTest value avoids semi-transparent black borders
	this.material = new THREE.MeshBasicMaterial({map: this._renderTarget, transparent: true, alphaTest: 0.9}); 
};

/**
 * Clears objects for impostor generating.
 */
Impostor.prototype._clear = function(){

	// reset scene
	this._scene = new THREE.Scene();
};

module.exports = Impostor;