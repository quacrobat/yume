/**
 * @file This prototype handles all stuff for impostors. An impostor
 * is a billboard that is created on the fly by rendering a complex
 * object from the current viewpoint into an image texture, which is mapped
 * on the billboard.
 * 
 * Note: This prototype is not ready for production use. There are still
 * some bugs when rendering the billboard texture.
 * 
 * see http://stackoverflow.com/questions/32135694/impostor-rendering-with-three-js
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 10.7.1, Impostors
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require("three");
/**
 * Creates an impostor.
 * 
 * @constructor 
 * @augments THREE.Mesh
 * 
 * @param {string} id - The id of the impostor.
 * @param {THREE.Object3D} sourceObject - The source 3D object of the impostor.
 * @param {number} resolution - The resolution of the rendered texture.
 */
function Impostor( id, sourceObject, resolution ) {
	
	Object.defineProperties(this, {
		type: {
			value: "Impostor",
			configurable: false,
			enumerable: true,
			writable: false
		},
		idImpostor: {
			value: id,
			configurable: false,
			enumerable: true,
			writable: false
		},
		mesh: {
			value: null,
			configurable: false,
			enumerable: true,
			writable: true
		},
		sourceObject: {
			value: sourceObject,
			configurable: false,
			enumerable: true,
			writable: false
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
		_boundingRectangle: {
			value: new THREE.Box2(),
			configurable: false,
			enumerable: false,
			writable: true
		},
		_depth: {
			value: Infinity,
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
	
	// assign the render target to the material. 
	// the alphaTest parameter avoids semi-transparent black borders of the billboard.
	this.material = new THREE.MeshBasicMaterial({map: this._renderTarget, transparent: true, alphaTest: 0.9}); 
}

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
	
	// create new mesh and apply impostor material
	this.mesh = new THREE.Mesh();
	this.mesh.material = this.material;
	
	// the model matrix is calculated by the impostor
	// so disable the automatic update
	this.mesh.matrixAutoUpdate = false;
};

/**
 * Generates the impostor.
 */
Impostor.prototype.generate = function(){

	this._computeBoundingBox();
	
	this._computeViewMatrix();
	
	this._computeBoundingRectangle();
	
	this._computePosition();
	
	this._computeGeometry();
	
	this._computeProjectionMatrix();
	
	this._prepareScene();
	
	this._render();
};

/**
 * Updates the model matrix of an impostor. The impostor is handled like a viewpoint-oriented, axis-aligned billboard.
 * 
 * see: Real-Time Rendering, Third Edition, Akenine-Möller/Haines/Hoffman
 * Chapter 10.6.2, World-Oriented Billboards
 * 
 * @param {THREE.Vector3} cameraWorldPosition - The world position of the camera.
 */
Impostor.prototype.update = (function(){
	
	var xAxis = new THREE.Vector3();		  // right
	var yAxis = new THREE.Vector3( 0, 1, 0 ); // up
	var zAxis = new THREE.Vector3();		  // front
	
	return function( cameraWorldPosition ){
		
		// first, compute zAxis 
		zAxis.subVectors( cameraWorldPosition, this.mesh.getWorldPosition() );
		zAxis.y = 0; // this will ensure, that the impostor rotates correctly around the axis
		zAxis.normalize();
		
		// compute the last axis with the cross product
		xAxis.crossVectors( yAxis, zAxis );
		
		// create new model matrix from basis vectors
		this.mesh.matrix.makeBasis( xAxis, yAxis, zAxis );
		
		// apply the position
		this.mesh.matrix.setPosition( this.mesh.position );
		
		// force world matrix to update
		this.mesh.matrixWorldNeedsUpdate = true;
	};
	
}());

/**
 * Computes the axis-aligned bounding box of the object.
 */
Impostor.prototype._computeBoundingBox = function(){

	this._boundingBox.setFromObject( this.sourceObject );
};

/**
 * Prepares the camera for rendering.
 */
Impostor.prototype._computeViewMatrix = function(){

	// the camera should look at the center of the AABB
	this._camera.lookAt( this._boundingBox.center() );
	
	// compute new matrices
	this._camera.updateMatrix();
	this._camera.updateMatrixWorld();
	this._camera.matrixWorldInverse.getInverse( this._camera.matrixWorld );
};

/**
 * Computes the bounding rectangle of the impostor.
 */
Impostor.prototype._computeBoundingRectangle = function(){

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
	
	// calculate each point of the bounding box
	points[0].set( this._boundingBox.min.x, this._boundingBox.min.y, this._boundingBox.min.z );
	points[1].set( this._boundingBox.min.x, this._boundingBox.min.y, this._boundingBox.max.z );
	points[2].set( this._boundingBox.min.x, this._boundingBox.max.y, this._boundingBox.min.z );
	points[3].set( this._boundingBox.min.x, this._boundingBox.max.y, this._boundingBox.max.z );
	points[4].set( this._boundingBox.max.x, this._boundingBox.min.y, this._boundingBox.min.z );
	points[5].set( this._boundingBox.max.x, this._boundingBox.min.y, this._boundingBox.max.z );
	points[6].set( this._boundingBox.max.x, this._boundingBox.max.y, this._boundingBox.min.z );
	points[7].set( this._boundingBox.max.x, this._boundingBox.max.y, this._boundingBox.max.z );
	
	// reset values before calculating
	this._depth = Infinity;
	this._boundingRectangle.makeEmpty();
	
	// calculate the bounding rectangle and the minimum depth value
	for( var index = 0; index < points.length; index++ ){
		
		// transform and project point from world to screen space
		points[index].project( this._camera );
		
		// compute the bounding rectangle in screen space
		this._boundingRectangle.expandByPoint( points[index] );
		
		// determine the minimum depth value
		this._depth = Math.min( this._depth, points[index].z );
	}
};

/**
 * Computes the position of the impostor. The center point of the bounding
 * rectangle will provide the exact value for this.
 */
Impostor.prototype._computePosition = function(){
	
	// calculate center
	var centerScreenSpace = this._boundingRectangle.center();
	
	// use the center and the depth value to determine the new position of the impostor in screen space
	var positionWorldSpace = new THREE.Vector3( centerScreenSpace.x, centerScreenSpace.y, this._depth );
	
	// unproject the vector to get world position
	this.mesh.position.copy( positionWorldSpace.unproject( this._camera ) );
};

/**
 * Computes the geometry of impostor. The method creates a simple plane geometry to
 * display the rendered texture.
 */
Impostor.prototype._computeGeometry = ( function(){
	
	var geometry, index;
	
	var transformationMatrix = new THREE.Matrix4();
	
	var points = [ 
	               new THREE.Vector3(),
		           new THREE.Vector3(),
		           new THREE.Vector3(),
		           new THREE.Vector3()
	];
	
	// faces for the plane
	var faces = [ new THREE.Face3( 0, 2, 1 ), new THREE.Face3( 2, 3, 1 ) ];
	
	// uvs for the plane
	var faceVertexUvsOne = [ new THREE.Vector2(0,0), new THREE.Vector2(1,0), new THREE.Vector2(0,1) ];
	var faceVertexUvsTwo = [ new THREE.Vector2(1,0), new THREE.Vector2(1,1), new THREE.Vector2(0,1) ];
	
	return function(){
		
		// create new geometry
		geometry = new THREE.Geometry();
		
		// get the points of the bounding rectangle
		points[0].set( this._boundingRectangle.min.x, this._boundingRectangle.min.y, this._depth );
		points[1].set( this._boundingRectangle.min.x, this._boundingRectangle.max.y, this._depth );
		points[2].set( this._boundingRectangle.max.x, this._boundingRectangle.min.y, this._depth );
		points[3].set( this._boundingRectangle.max.x, this._boundingRectangle.max.y, this._depth );
		
		// set vertices
		for( index = 0; index < points.length; index++ ){
			
			// transform point from screen space to world space
			points[index].unproject( this._camera );
			geometry.vertices.push( points[index]);
		}
		
		// set faces
		geometry.faces = faces;
		
		// set uvs
		geometry.faceVertexUvs[0].push( faceVertexUvsOne );
		geometry.faceVertexUvs[0].push( faceVertexUvsTwo );
		
		// prepare transformation matrix
		transformationMatrix.identity();
		
		// reset the center of the geometry back to origin
		transformationMatrix.makeTranslation( -this.mesh.position.x, -this.mesh.position.y, -this.mesh.position.z );
		
		// undo rotation of the view transform
		transformationMatrix.extractRotation( this._camera.matrixWorldInverse );
		
		// reset geometry
		geometry.applyMatrix( transformationMatrix );
		
		// create geometry
		this.mesh.geometry = geometry;
	
	};
	
} () );

/**
 * Computes a projection matrix, that encloses the bounding rectangle of the impostor.
 */
Impostor.prototype._computeProjectionMatrix = function(){
		
	// calculate frustum
	var frustumHeight = this._camera.near * Math.tan( THREE.Math.degToRad( this._camera.fov * 0.5 ) );
	var frustumWidth  = frustumHeight * this._camera.aspect;
	
	// create new projection matrix via min/max values of the bounding rectangle
	this._camera.projectionMatrix.makeFrustum(  
			frustumWidth  * this._boundingRectangle.min.x, 
		    frustumWidth  * this._boundingRectangle.max.x,  
		    frustumHeight * this._boundingRectangle.min.y,
		    frustumHeight * this._boundingRectangle.max.y, 
		    this._camera.near,
		    this._camera.far
		    );
};

/**
 * Prepares the scene for rendering. This method ensures, that the actual object and
 * the entire lightning of the scene are part of the rendering.
 */
Impostor.prototype._prepareScene = function(){
	
	// reset scene
	this._scene = new THREE.Scene();

	// clone object
	var object = this.sourceObject.clone();
	
	// ensure it's visible
	object.visible = true;

	// add to scene
	this._scene.add( object );
	
	// add all light source
	Array.prototype.push.apply( this._scene.children, this._lights );
};

/**
 * Renders the scene to the render target.
 */
Impostor.prototype._render = function(){
	
	// save existing clear color and alpha
	var clearColor = this._renderer.getClearColor();
	var clearAlpha = this._renderer.getClearAlpha();
	
	// the following clear color ensures
	// that the rendered texture has transparency
	this._renderer.setClearColor(0x000000, 0);
	
	// render to target
	this._renderer.render(this._scene, this._camera, this._renderTarget, true);
	
	// restore clear values
	this._renderer.setClearColor(clearColor, clearAlpha);
};

module.exports = Impostor;