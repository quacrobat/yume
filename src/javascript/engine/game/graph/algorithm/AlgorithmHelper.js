/**
 * @file Some useful functions you can use with algorithms.
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates a algorithm helper.
 * 
 * @constructor
 */
function AlgorithmHelper() {

}

/**
 * Updates an entry in the queue.
 * 
 * @param {object} queue - The queue object.
 * @param {number} index - The index of the node to update.
 * @param {number} cost - The new cost value.
 */
AlgorithmHelper.prototype.updateEntryInQueue = function( queue, index, cost ) {

	for ( var i = 0; i < queue.length; i++ )
	{
		if ( queue[ i ].nodeIndex === index )
		{
			// update entry
			queue[ i ].cost = cost;

			// because the cost is less than it was previously, the queue
			// must be re-sorted to account for this
			queue.sort( this.sortQueueByCost );

			return;
		}
	}
};

/**
 * Compare function for queue.
 * 
 * @param {object} a - The first object to compare.
 * @param {object} b - The second object to compare.
 * 
 * @returns {number} Indicates, if the objects are greater, smaller or equal.
 */
AlgorithmHelper.prototype.sortQueueByCost = function( a, b ) {
	
	if ( a.cost > b.cost )
	{
		return 1;
	}
	
	if ( a.cost < b.cost )
	{
		return -1;
	}
	
	// a must be equal to b
	return 0;
};

module.exports = new AlgorithmHelper();