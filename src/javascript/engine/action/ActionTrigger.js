/**
 * @file The ActionTrigger is a static trigger for actions.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var logger = require( "../core/Logger" );
var system = require( "../core/System" );

/**
 * The constructor creates an internal mesh, which represents the trigger in
 * 3D-space. A player activates a trigger by entering in the corresponding
 * circle geometry.
 * 
 * @constructor
 * 
 * @param {THREE.Vector3} position - The position of the trigger.
 * @param {number} radius - The radius of the trigger.
 * @param {boolean} isOnetime - Should the trigger run it's action just one time?
 * @param {Action} action - The action, that should be executed.
 */
function ActionTrigger( position, radius, isOnetime, action ) {

	Object.defineProperties( this, {
		boundingSphere : {
			value : new THREE.Sphere( position, radius ),
			configurable : false,
			enumerable : true,
			writable : false
		},
		action : {
			value : action,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// indicates, if the player is inside the trigger
		isInRadius : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// indicates, if the trigger is executed just one time
		isOnetime: {
			value : isOnetime|| false,
			configurable : false,
			enumerable : true,
			writable : true
		},
	} );
	
	// in dev mode provide a mesh to visualize the trigger
	if( system.isDevModeActive === true ){
		
		var geometry = new THREE.SphereBufferGeometry( radius, 10, 10 );
		var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } );
		
		this.object3D = new THREE.Mesh( geometry, material);
		this.object3D.position.copy( position );
	}
}

/**
 * The update method checks if the trigger should execute it's action.
 * 
 * @param {THREE.Box} boundingBox - The bounding volume to test.
 */
ActionTrigger.prototype.update = ( function() {

	var closestPoint = new THREE.Vector3();

	return function( boundingBox ) {

		// the action property must always be set
		if ( this.action !== undefined )
		{
			// only process if the action is active
			if ( this.action.isActive === true )
			{
				boundingBox.clampPoint( this.boundingSphere.center, closestPoint );

				// only process if the given bounding volume intersects with
				// the trigger
				if ( closestPoint.distanceToSquared( this.boundingSphere.center ) <= ( this.boundingSphere.radius * this.boundingSphere.radius ) )
				{
					// if the bounding volume is not already inside the trigger,
					// run the corresponding action
					if ( this.isInRadius === false )
					{
						// run the action
						this.action.run();

						this.isInRadius = true;

						logger.log( "INFO: ActionTrigger: Interaction with trigger. Action executed." );
						
						// if the "isOnetime" flag is set, deactivate the trigger action
						if ( this.isOnetime === true )
						{
							this.action.isActive = false;
						}
					}
				}
				else
				{
					// the bounding volume is not inside the trigger, so it's
					// ready to run it's action again
					this.isInRadius = false;
				}
			}
		}
		else
		{
			throw "ERROR: ActionTrigger: No action defined for trigger.";
		}

	};

}() );

/**
 * Returns the position of the trigger.
 * 
 * @returns {THREE.Vector3} The position of the trigger.
 */
ActionTrigger.prototype.getPosition = function(){
	
	return this.boundingSphere.center;
};

/**
 * Sets the position of the trigger. 
 * 
 * @param {THREE.Vector3} position - The position to set.
 */
ActionTrigger.prototype.setPosition = function( position ){
	
	this.boundingSphere.center.copy( position );
};

/**
 * Returns the radius of the trigger. 
 * 
 * @returns {number} The radius of the trigger.
 */
ActionTrigger.prototype.getRadius = function(){
	
	return this.boundingSphere.radius;
};

/**
 * Sets the radius of the trigger. 
 * 
 * @param {number} radius - The radius to set.
 */
ActionTrigger.prototype.setRadius = function( radius ){
	
	this.boundingSphere.radius.copy( radius );
};

module.exports = ActionTrigger;