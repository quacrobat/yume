/**
 * @file Interface for entire group-handling. This prototype is used in scenes
 * to access group-based logic and to create group-entities.
 * 
 * @author Human Interactive
 */

"use strict";

var Group = require("./Group");

/**
 * Creates the group manager.
 * 
 * @constructor
 */
function GroupManager() {

	Object.defineProperties(this, {
		_groups : {
			value : [],
			configurable: false,
			enumerable: false,
			writable: false
		}
	});
}

/**
 * Creates a group and stores it to the internal array.
 * 
 * @param {string} id - The id of the group.
 * @param {function} showCallback - This method is executed, when all objects are shown.
 * @param {function} hideCallback - This method is executed, when all objects are hidden.
 * 
 * @returns {Group} The new group.
 */
GroupManager.prototype.createGroup = function(id, showCallback, hideCallback) {
	
	var group = new Group(id, showCallback, hideCallback);
	this.addGroup(group);
	return group;
};

/**
 * Adds a single group object to the internal array.
 * 
 * @param {Group} group - The group object to be added.
 */
GroupManager.prototype.addGroup = function(group){
	
	this._groups.push(group);
};

/**
 * Removes a group from the internal array.
 * 
 * @param {Group} group - The group object to be removed.
 */
GroupManager.prototype.removeGroup = function(group) {

	var index = this._groups.indexOf(group);
	this._groups.splice(index, 1);
};

/**
 * Removes all group objects from the internal array.
 */
GroupManager.prototype.removeGroups = function() {

	this._groups.length = 0;
};

/**
 * Gets a group of the internal array.
 * 
 * @param {string} id - The id of the group.
 * 
 * @returns {Group} The group.
 */
GroupManager.prototype.get = function(id) {

	var group = null;
	
	for( var index = 0; index < this._groups.length; index++){
		if(this._groups[index].id === id){
			group =  this._groups[index];
			break;
		}
	}
	
	if(group === null){
		throw "ERROR: GroupManager: Group with ID " + id + " not existing.";
	}else{
		return group;
	}
};

/**
 * Shows all groups.
 */
GroupManager.prototype.showAllGroups = function() {
	
	for (var index = 0; index < this._groups.length; index++) {
		this._groups[index].show();
	}
};

/**
 * Hides all groups.
 */
GroupManager.prototype.hideAllGroups = function() {
		
	for (var index = 0; index < this._groups.length; index++) {
		this._groups[index].hide();
	}
};

module.exports = new GroupManager();