/**
 * @file Prototype to define, manage, and traverse a path defined by a series of
 * 3D vectors.
 * 
 * @author Human Interactive
 */
"use strict";

var THREE = require( "three" );

var logger = require( "../../core/Logger" );

/**
 * Creates a new path.
 * 
 * @constructor
 * 
 * @param {boolean} loop - Flag to indicate if the path should be looped.
 */
function Path( loop ) {

	Object.defineProperties( this, {
		loop : {
			value : loop || false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		_waypoints : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		_index : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
}

/**
 * Adds a waypoint to the end of the path.
 * 
 * @param {THREE.Vector3} waypoint - The waypoint to add.
 * 
 * @returns {Path} The reference to the instance.
 */
Path.prototype.addWaypoint = function( waypoint ) {

	this._waypoints.push( waypoint );

	return this;
};

/**
 * Clears the path.
 * 
 * @returns {Path} The reference to the instance.
 */
Path.prototype.clear = function() {

	this._waypoints.length = 0;

	return this;
};

/**
 * Returns true if the end of the array has been reached.
 * 
 * @returns {boolean} Is the end of the array reached.
 */
Path.prototype.isFinished = function() {

	return this.loop === true ? false : ( this._index === this._waypoints.length - 1 );
};

/**
 * Moves the index to the next waypoint in the array.
 * 
 * @returns {Path} The reference to the instance.
 */
Path.prototype.setNextWaypoint = function() {

	logger.assert( this._waypoints.length > 0, "Path: No waypoints are assigned to path object." );

	if ( ++this._index === this._waypoints.length )
	{
		if ( this.loop === true )
		{
			this._index = 0;
		}
		else
		{
			this._index--;
		}

	}

	return this;
};

/**
 * Returns the current waypoint.
 * 
 * @returns {THREE.Vector3} The current waypoint.
 */
Path.prototype.getCurrentWaypoint = function() {

	return this._waypoints[ this._index ];
};

/**
 * Creates a random path which is bound by a bounding box.
 * 
 * @param {number} Number of waypoints.
 * @param {THREE.Box3} This bounding box describes the area of points.
 * 
 * @returns {Path} The reference to the instance.
 */
Path.prototype.createRandomPath = function( numberOfWaypoints, boundingBox ) {

	// buffer some entities
	var radialDistance = new THREE.Vector3();
	var axis = new THREE.Vector3( 0, 1, 0 );
	var spacing = 2 * Math.PI / numberOfWaypoints;
	var center = boundingBox.getCenter();

	// clear existing waypoints
	this.clear();

	// create new waypoints
	for ( var index = 0; index < numberOfWaypoints; index++ )
	{
		var waypoint = new THREE.Vector3();

		// new random position on planar surface
		radialDistance.x = THREE.Math.randFloat( boundingBox.min.x * 0.2, boundingBox.min.x );
		radialDistance.y = 0;
		radialDistance.z = THREE.Math.randFloat( boundingBox.min.z * 0.2, boundingBox.min.z );

		waypoint.copy( radialDistance );

		// rotate around y-axis to better distribute the waypoints
		waypoint.applyAxisAngle( axis, spacing * index );

		// add center value
		waypoint.x += center.x;
		waypoint.y += center.y;
		waypoint.z += center.z;

		// add waypoint to array
		this.addWaypoint( waypoint );
	}

	return this;
};

module.exports = Path;