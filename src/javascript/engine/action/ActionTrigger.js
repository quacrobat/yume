/**
 * @file The ActionTrigger is a static trigger for actions.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require("three");
var utils = require("../etc/Utils");

/**
 * The constructor creates an internal mesh, which represents the trigger in 3D-space.
 * A player activates a trigger by entering in the corresponding circle geometry.
 * 
 * @constructor
 * @augments THREE.Mesh
 * 
 * @param {number} radius - The radius of the trigger.
 * @param {Action} action - The action, that should be executed.
 */
function ActionTrigger(radius, action) {

	THREE.Mesh.call(this);
	
	Object.defineProperties(this, {
		type: {
			value: "ActionTrigger",
			configurable: false,
			enumerable: true,
			writable: false
		},
		action: {
			value: action,
			configurable: false,
			enumerable: true,
			writable: true
		},
		geometry: {
			value: new THREE.CircleGeometry(radius),
			configurable: false,
			enumerable: true,
			writable: false
		},
		material: {
			value: new THREE.MeshBasicMaterial({wireframe: true}),
			configurable: false,
			enumerable: true,
			writable: false
		}
	});
	
	this.rotation.x = -0.5 * Math.PI;
	
	if(utils.isDevelopmentModeActive() === false){
		this.material.visible = false;
	}
}

ActionTrigger.prototype = Object.create(THREE.Mesh.prototype);
ActionTrigger.prototype.constructor = ActionTrigger;


module.exports = ActionTrigger;