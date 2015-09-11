/**
 * @file All entities that are part of the game logic
 * inherit from this prototype.
 * 
 * @author Human Interactive
 */

"use strict";

var nextValidId = 0;

function BaseGameEntity(){
		
	Object.defineProperties(this, {
		
		// every entity has a unique identifying number
		id: {
			value: nextValidId ++,
			configurable: false,
			enumerable: true,
			writable: true
		}
	});
}

/**
 * All entities must implement an update function.
 */
BaseGameEntity.prototype.update = function(){};

module.exports = BaseGameEntity;