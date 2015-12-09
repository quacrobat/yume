/**
 * @file Prototype for defining an animation for a single property.
 * 
 * @author Human Interactive
 */

"use strict";

var logger = require( "../core/Logger" );

/**
 * Creates an animation.
 * 
 * @constructor
 * 
 * @param {object} options - The parameter for the animation.
 */
function Animation( options ) {

	Object.defineProperties( this, {
		
		// the animation only works with object properties
		object : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the animated property
		property : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the duration of the animation
		duration : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the start value of the animation
		start : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the end value of the animation
		end : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// this will delay the animation by the given time
		delayTime : {
			value : 0,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// if set to true, it specifies that the animation will start over
		// again, every time it is finished
		loop : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the easing function
		easing : {
			value : undefined,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// executed when the animation is started ( the play method is called ).
		// in looped animations, it is called just once
		onStartCallback : {
			value : undefined,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// executed when the animation is updated
		onUpdateCallback : {
			value : undefined,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// executed when the animation is completed
		onCompleteCallback : {
			value : undefined,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// executed when the animation is stopped
		onStopCallback : {
			value : undefined,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// indicates if the animation is active
		isPlaying : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// internal timestamp value
		_startTime : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	// set options
	for ( var property in options )
	{
		if ( this.hasOwnProperty( property ) === true )
		{
			this[ property ] = options[ property ];
		}
		else
		{
			logger.warn( "WARN: Animation: Object created with wrong options. Property '%s' is not a member of Animation.", property );
		}
	}
}

/**
 * Updates the animation.
 * 
 * @param {number} time - The update time.
 * 
 * @returns {boolean} Is the animation finished?
 */
Animation.prototype.update = function( time ) {

	var index, elapsed, value, temp;
	var isFinished = false;

	// if the startTime is greater than the current time,
	// we will skip the update. this is important for delayed
	// start time.
	if ( time < this._startTime )
	{
		return isFinished;
	}

	// calculate elapsed time. the final value of "elapsed"
	// will always be inside the range of [0, 1].
	elapsed = ( time - this._startTime ) / this.duration;
	elapsed = elapsed > 1 ? 1 : elapsed;

	// execute easing function
	if ( typeof this.easing === "function" )
	{
		value = this.easing( elapsed );
	}
	else
	{
		throw "ERROR: Animation: No easing function assigned.";
	}

	// check, if the object has the specified property
	if ( this.object.hasOwnProperty( this.property ) === true )
	{
		// calculate and assign new value
		this.object[ this.property ] = this.start + ( this.end - this.start ) * value;
	}

	// execute callback
	if ( typeof this.onUpdateCallback === "function" )
	{
		this.onUpdateCallback();
	}

	// check finish
	if ( elapsed === 1 )
	{
		// check if the animation should be played in an endless loop
		if ( this.loop === true )
		{
			// switch start and end values
			temp = this.start;
			this.start = this.end;
			this.end = temp;

			// set new start time
			this._startTime = time + this.delayTime;
		}
		else
		{
			// execute callback
			if ( typeof this.onCompleteCallback === "function" )
			{
				this.onCompleteCallback();
			}

			isFinished = true;
		}
	}

	return isFinished;

};

/**
 * Plays the animation.
 * 
 * @param {number} time - The starting time.
 */
Animation.prototype.play = function( time ) {

	this.isPlaying = true;

	this._startTime = time !== undefined ? time : global.performance.now();
	this._startTime += this.delayTime;

	// execute callback
	if ( typeof this.onStartCallback === "function" )
	{
		this.onStartCallback();
	}
};

/**
 * Stops the animation.
 */
Animation.prototype.stop = function() {

	if ( this.isPlaying === true )
	{
		this.isPlaying = false;
	}

	// execute callback
	if ( typeof this.onStopCallback === "function" )
	{
		this.onStopCallback();
	}
};

module.exports = Animation;