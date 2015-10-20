/**
 * @file This prototype manages all game entities.
 * 
 * @author Human Interactive
 */
"use strict";

var Vehicle = require( "./Vehicle" );

/**
 * Creates the entity manager.
 * 
 * @constructor
 */
function EntityManager() {

	Object.defineProperties( this, {

		entities : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		}

	} );
}

/**
 * Creates a vehicle, a moving entity that uses steering behaviors.
 * 
 * @param {THREE.Object3D} object3D - The 3D object of the entity.
 * @param {number} boundingRadius - The bounding radius of the entity.
 * @param {THREE.Vector3} velocity - The velocity of the agent.
 * @param {number} mass - The mass of the agent.
 * @param {number} maxSpeed - The maximum speed at which this entity may travel.
 * @param {number} maxForce - The maximum force this entity can produce to power itself (think rockets and thrust).
 * @param {number} maxTurnRate - The maximum rate (radians per second) at which this vehicle can rotate.
 * @param {number} numSamplesForSmoothing - How many samples the smoother will use to average the velocity.
 * 
 * @returns {Vehicle} The new vehicle.
 */
EntityManager.prototype.createVehicle = function( object3D, boundingRadius, velocity, mass, maxSpeed, maxForce, maxTurnRate, numSamplesForSmoothing ) {

	var vehicle = new Vehicle( this, object3D, boundingRadius, velocity, mass, maxSpeed, maxForce, maxTurnRate, numSamplesForSmoothing );
	this.addEntity( vehicle );
	return vehicle;
};

/**
 * Updates all entities.
 * 
 * @param {number} delta - The time delta value.
 */
EntityManager.prototype.update = function( delta ) {

	for ( var index = 0; index < this.entities.length; index++ )
	{
		this.entities[ index ].update( delta );
	}
};

/**
 * Gets an entity by its ID.
 * 
 * @param {number} id - The ID of the entity.
 * 
 * @returns {GameEntity} The entity.
 */
EntityManager.prototype.getEntity = function( id ) {

	var entity = null;

	for ( var index = 0; index < this.entities.length; index++ )
	{
		if ( this.entities[ index ].id === id )
		{
			entity = this.entities[ index ];

			break;
		}
	}

	if ( entity === null )
	{
		throw "ERROR: EntityManager: Entity with ID " + id + " not existing.";
	}
	else
	{
		return entity;
	}
};

/**
 * Adds a single entity to the internal array.
 * 
 * @param {GameEntity} entity - The entity to add.
 */
EntityManager.prototype.addEntity = function( entity ) {

	this.entities.push( entity );
};

/**
 * Removes a single entity from the internal array.
 * 
 * @param {GameEntity} entity - The entity to remove.
 */
EntityManager.prototype.removeEntity = function( entity ) {

	var index = this.entities.indexOf( entity );
	this.entities.splice( index, 1 );
};

/**
 * Removes all entities from the internal array.
 */
EntityManager.prototype.removeEntities = function() {

	this.entities.length = 0;
};

module.exports = new EntityManager();