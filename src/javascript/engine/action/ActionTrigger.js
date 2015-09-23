/**
 * @file The ActionTrigger is a static trigger for actions.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );
var utils = require( "../etc/Utils" );

/**
 * The constructor creates an internal mesh, which represents the trigger in
 * 3D-space. A player activates a trigger by entering in the corresponding
 * circle geometry.
 * 
 * @constructor
 * @augments THREE.Mesh
 * 
 * @param {number} radius - The radius of the trigger.
 * @param {Action} action - The action, that should be executed.
 */
function ActionTrigger( radius, action ) {

	THREE.Mesh.call( this );

	Object.defineProperties( this, {
		type : {
			value : "ActionTrigger",
			configurable : false,
			enumerable : true,
			writable : false
		},
		radius : {
			value : radius,
			configurable : false,
			enumerable : true,
			writable : true
		},
		action : {
			value : action,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );

	// by default, trigger is parallel to the floor
	this.rotation.x = -0.5 * Math.PI;

	// apply geometry
	this.geometry = new THREE.CircleGeometry( this.radius );

	// hide default material
	this.material.visible = false;

	// show wireframe only in dev mode
	if ( utils.isDevelopmentModeActive() === true )
	{
		this.material.visible = true;
		this.material.wireframe = true;
		this.material.color = new THREE.Color( 0xffffff );
	}
}

ActionTrigger.prototype = Object.create( THREE.Mesh.prototype );
ActionTrigger.prototype.constructor = ActionTrigger;

module.exports = ActionTrigger;