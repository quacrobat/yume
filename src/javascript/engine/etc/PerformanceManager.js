/**
 * @file Interface for performance handling. This prototype is used in scenes
 * to create e.g. LOD instances.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");

var LOD = require("./LOD");
var Impostor = require("./Impostor");

var camera = require("../core/Camera");
var scene = require("../core/Scene");
var renderer = require("../core/Renderer");

/**
 * Creates the performance manager.
 * 
 * @constructor
 */
function PerformanceManager() {

	Object.defineProperties(this, {
		_lods: {
			value : [],
			configurable: false,
			enumerable: false,
			writable: false
		},
		_impostors: {
			value : [],
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
}

/**
 * Creates a LOD instance with direct transitions and stores it to the internal array.
 * 
 * @param {string} id - The id of the LOD instance.
 * 
 * @returns {LOD} The new LOD instance.
 */
PerformanceManager.prototype.createDirectLOD = function(id) {
	
	var lod = new LOD(id, LOD.MODE.DIRECT, camera);
	this.addLOD(lod);
	return lod;
};

/**
 * Creates a LOD instance with smooth transitions and stores it to the internal array.
 * 
 * @param {string} id - The id of the LOD instance.
 * @param {number} threshold - The threshold where the blending is done.
 * 
 * @returns {LOD} The new LOD instance.
 */
PerformanceManager.prototype.createSmoothLOD = function(id, threshold) {
	
	var lod = new LOD(id, LOD.MODE.SMOOTH, camera, threshold);
	this.addLOD(lod);
	return lod;
};

/**
 * Creates an impostor instance and stores it to the internal array.
 * 
 * @param {string} id - The id of the impostor instance.
 * @param {THREE.Mesh} object - The source 3D object of the impostor.
 * @param {number} resolution - The resolution of the rendered texture.
 * 
 * @returns {Impostor} The new impostor instance.
 */
PerformanceManager.prototype.createImpostor = function(id, object, resolution) {
	
	var impostor = new Impostor(id, object, resolution);
	this.addImpostor(impostor);
	return impostor;
};

/**
 * Adds a single LOD instance to the internal array.
 * 
 * @param {LOD} lod - The LOD instance to be added.
 */
PerformanceManager.prototype.addLOD = function(lod){
	
	this._lods.push(lod);
};

/**
 * Adds a single impostor instance to the internal array.
 * 
 * @param {Impostor} impostor - The impostor instance to be added.
 */
PerformanceManager.prototype.addImpostor = function(impostor){
	
	this._impostors.push(impostor);
};

/**
 * Removes a LOD instance from the internal array.
 * 
 * @param {LOD} lod - The LOD instance to be removed.
 */
PerformanceManager.prototype.removeLOD = function(lod) {

	var index = this._lods.indexOf(lod);
	this._lods.splice(index, 1);
};

/**
 * Removes an impostor instance from the internal array.
 * 
 * @param {Impostor} impostor - The impostor instance to be removed.
 */
PerformanceManager.prototype.removeImpostor = function(impostor) {

	var index = this._impostors.indexOf(impostor);
	this._impostors.splice(index, 1);
};

/**
 * Removes all LOD instances from the internal array.
 */
PerformanceManager.prototype.removeLODs = function() {

	this._lods.length = 0;
};

/**
 * Removes all impostor instances from the internal array.
 */
PerformanceManager.prototype.removeImpostors = function() {

	this._impostors.length = 0;
};

/**
 * Gets a LOD instance of the internal array.
 * 
 * @param {string} id - The id of the LOD instance.
 * 
 * @returns {LOD} The LOD instance.
 */
PerformanceManager.prototype.getLOD = function(id) {

	var lod = null;
	
	for( var index = 0; index < this._lods.length; index++){
		if(this._lods[index].idLOD === id){
			lod =  this._lods[index];
			break;
		}
	}
	
	if(lod === null){
		throw "ERROR: PerformanceManager: LOD instance with ID " + id + " not existing.";
	}else{
		return lod;
	}
};

/**
 * Gets an impostor instance of the internal array.
 * 
 * @param {string} id - The id of the impostor instance.
 * 
 * @returns {Impostor} The impostor instance.
 */
PerformanceManager.prototype.getImpostor = function(id) {

	var impostor = null;
	
	for( var index = 0; index < this._impostors.length; index++){
		if(this._impostors[index].idImpostor === id){
			impostor =  this._impostors[index];
			break;
		}
	}
	
	if(impostor === null){
		throw "ERROR: PerformanceManager: Impostor instance with ID " + id + " not existing.";
	}else{
		return impostor;
	}
};

/**
 * Updates the performance manager.
 */
PerformanceManager.prototype.update = function(){
	
	this._updateLODs();
	
	this._updateImpostors();
};

/**
 * Generates all impostors.
 */
PerformanceManager.prototype.generateImpostors = function(){
	
	// clone camera object
	var impostorCamera = camera.clone();
	
	// set world position of the impostor camera
	var cameraWorldPosition = camera.getWorldPosition();
	impostorCamera.position.set(cameraWorldPosition.x, cameraWorldPosition.y, cameraWorldPosition.z);
	
	// create an array with the entire lighting of the actual scene
	var impostorLights = [];
	
	for(var index = 0; index < scene.children.length; index++){
		if(scene.children[index] instanceof THREE.Light){
			impostorLights.push(scene.children[index].clone());
		}
	}
	
	// generate each impostor
	for(index = 0; index < this._impostors.length; index++){
		this._impostors[index].generate(renderer, impostorCamera, impostorLights);
	}
};

/**
 * Updates all LOD instances.
 */
PerformanceManager.prototype._updateLODs = (function(){
	
	var index = 0;
	
	return function(){
		
		for(index = 0; index < this._lods.length; index++){
			
			this._lods[index].update();
		}
	};
	
}());

/**
 * Updates all LOD instances.
 */
PerformanceManager.prototype._updateImpostors = (function(){
	
	var index = 0;
	var cameraWorldPosition = new THREE.Vector3();
	
	return function(){
		
		// the camera world position is equal for each impostor
		cameraWorldPosition = camera.getWorldPosition();
		
		for(index = 0; index < this._impostors.length; index++){
			
			this._impostors[index].update(cameraWorldPosition);
		}
	};
	
}());

module.exports = new PerformanceManager();