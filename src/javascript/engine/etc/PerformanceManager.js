/**
 * @file Interface for performance handling. This prototype is used in scenes
 * to create e.g. LOD instances.
 * 
 * @author Human Interactive
 */

"use strict";

var LOD = require("./LOD");

/**
 * Creates the performance manager.
 * 
 * @constructor
 */
function PerformanceManager() {

	Object.defineProperties(this, {
		_lods : {
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
 * @param {Camera} camera - The camera object.
 * 
 * @returns {LOD} The new LOD instance.
 */
PerformanceManager.prototype.createDirectLOD = function(id, camera) {
	
	var lod = new LOD(id, LOD.MODE.DIRECT, camera);
	this.addLOD(lod);
	return lod;
};

/**
 * Creates a LOD instance with smooth transitions and stores it to the internal array.
 * 
 * @param {string} id - The id of the LOD instance.
 * @param {Camera} camera - The camera object.
 * @param {number} threshold - The threshold where the blending is done.
 * 
 * @returns {LOD} The new LOD instance.
 */
PerformanceManager.prototype.createSmoothLOD = function(id, camera, threshold) {
	
	var lod = new LOD(id, LOD.MODE.SMOOTH, camera, threshold);
	this.addLOD(lod);
	return lod;
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
 * Removes a LOD instance from the internal array.
 * 
 * @param {LOD} lod - The LOD instance to be removed.
 */
PerformanceManager.prototype.removeLOD = function(lod) {

	var index = this._lods.indexOf(lod);
	this._lods.splice(index, 1);
};

/**
 * Removes all LOD instances from the internal array.
 */
PerformanceManager.prototype.removeLODs = function() {

	this._lods.length = 0;
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
 * Updates the performance manager.
 */
PerformanceManager.prototype.update = function(){
	
	this._updateLODs();
	
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

module.exports = new PerformanceManager();