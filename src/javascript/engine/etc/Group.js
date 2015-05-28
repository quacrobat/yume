/**
 * @file This prototype is used for grouping and
 * managing 3D-objects. 
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates a group.
 * 
 * @constructor
 * 
 * @param {string} id - The id of the group.
 * @param {function} showCallback - This method is executed, when all objects are shown.
 * @param {function} hideCallback - This method is executed, when all objects are hidden.
 */
function Group(id, showCallback, hideCallback) {

	Object.defineProperties(this, {
		id: {
			value: id,
			configurable: false,
			enumerable: true,
			writable: true
		},
		objects: {
			value : [],
			configurable: false,
			enumerable: false,
			writable: false
		},
		isActive: {
			value: true,
			configurable: false,
			enumerable: true,
			writable: true
		},
		_showCallback: {
			value: showCallback,
			configurable: false,
			enumerable: false,
			writable: true
		},
		_hideCallback: {
			value: hideCallback,
			configurable: false,
			enumerable: false,
			writable: true
		}
	});
}

/**
 * Adds an object to the group.
 * 
 * @param {THREE.Object3D} object - The 3D object to add.
 */
Group.prototype.add = function(object) {

	this.objects.push(object);
};

/**
 * Removes an object of the group.
 * 
 * @param {THREE.Object3D} object - The 3D object to remove.
 */
Group.prototype.remove = function(object) {

	var index = this.objects.indexOf(object);
	this.objects.splice(index, 1);
};

/**
 * Removes all objects of the group.
 */
Group.prototype.removeAll = function() {

	this.objects.length = 0;
};

/**
 * Shows all objects of the group and, if necessary, starts associated animations.
 */
Group.prototype.show = function() {
	
	if(this.isActive === false){
		for( var i = 0; i < this.objects.length; i++){
			this.objects[i].visible = true;
			
			if(this.objects[i].animation !== undefined){
				this.objects[i].animation.start();
			}
		}
		
		if(typeof this._showCallback === "function"){
			this._showCallback();
		}
		
		this.isActive = true;
	}
};

/**
 * Hides all objects of the group and, if necessary, stops associated animations.
 */
Group.prototype.hide = function() {
	
	if(this.isActive === true){
		for( var i = 0; i < this.objects.length; i++){
			this.objects[i].visible = false;
			
			if(this.objects[i].animation !== undefined){
				this.objects[i].animation.stop();
			}
		}
		
		if(typeof this._hideCallback === "function"){
			this._hideCallback();
		}
		
		this.isActive = false;
	}
};

module.exports = Group;