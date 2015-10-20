/**
 * @file Prototype for ui-element performance monitor. Only if the development
 * mode is active, this control is part of the UI.
 * 
 * see https://github.com/mrdoob/stats.js/
 * 
 * @author Human Interactive
 */

"use strict";

var UiElement = require( "./UiElement" );

var self;

/**
 * Creates the performance monitor.
 * 
 * @constructor
 */
function PerformanceMonitor() {

	UiElement.call( this );

	Object.defineProperties( this, {
		_$performanceMonitor : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$fps : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$fpsText : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$fpsGraph : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$ms : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$msText : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_$msGraph : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_mode : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );

	self = this;
}

PerformanceMonitor.prototype = Object.create( UiElement.prototype );
PerformanceMonitor.prototype.constructor = PerformanceMonitor;

/**
 * Initializes the control.
 */
PerformanceMonitor.prototype.init = function() {

	// root element
	this._$performanceMonitor = global.document.querySelector( "#performance-monitor" );

	// frames per seconds
	this._$fps = this._$performanceMonitor.querySelector( ".fps" );
	this._$fpsText = this._$fps.querySelector( ".text" );
	this._$fpsGraph = this._$fps.querySelector( ".graph" );
	this._generateBarChart( this._$fpsGraph );

	// frametime
	this._$ms = this._$performanceMonitor.querySelector( ".ms" );
	this._$msText = this._$ms.querySelector( ".text" );
	this._$msGraph = this._$ms.querySelector( ".graph" );
	this._generateBarChart( this._$msGraph );

	// event handler
	this._$performanceMonitor.addEventListener( "click", this._onSwitchMode );
};

/**
 * Updates the control.
 */
PerformanceMonitor.prototype.update = ( function() {

	var startTime = global.performance.now(), currentTime = 0, previousTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0;

	return function() {

		currentTime = global.performance.now();

		ms = currentTime - startTime;
		msMin = Math.min( msMin, ms );
		msMax = Math.max( msMax, ms );

		/* jslint bitwise: true */this._$msText.textContent = ( ms | 0 ) + " MS (" + ( msMin | 0 ) + "-" + ( msMax | 0 ) + ")";
		this._updateChart( this._$msGraph, Math.min( 30, 30 - ( ms / 200 ) * 30 ) );

		frames++;

		if ( currentTime > previousTime + 1000 )
		{

			fps = Math.round( ( frames * 1000 ) / ( currentTime - previousTime ) );
			fpsMin = Math.min( fpsMin, fps );
			fpsMax = Math.max( fpsMax, fps );

			this._$fpsText.textContent = fps + " FPS (" + fpsMin + "-" + fpsMax + ")";
			this._updateChart( this._$fpsGraph, Math.min( 30, 30 - ( fps / 100 ) * 30 ) );

			previousTime = currentTime;
			frames = 0;

		}

		startTime = currentTime;

	};

}() );

/**
 * Toggles the control.
 */
PerformanceMonitor.prototype.toggle = function() {

	if ( this._$performanceMonitor.style.display === "none" )
	{
		this._$performanceMonitor.style.display = "block";
	}
	else
	{
		this._$performanceMonitor.style.display = "none";
	}
};

/**
 * Generates the bar charts.
 * 
 * @param {object} $graph - The target graph object.
 */
PerformanceMonitor.prototype._generateBarChart = function( $graph ) {

	var element = null;

	while ( $graph.children.length < 74 )
	{

		element = global.document.createElement( "span" );
		element.className = "bar";
		$graph.appendChild( element );
	}
};

/**
 * Updates a graph.
 * 
 * @param {object} $graph - The target graph object.
 */
PerformanceMonitor.prototype._updateChart = function( $graph, value ) {

	var child = $graph.appendChild( $graph.firstChild );
	child.style.height = value + "px";

};

/**
 * Switches the mode of the performance monitor.
 */
PerformanceMonitor.prototype._onSwitchMode = function() {

	self._mode = ++self._mode % 2;

	switch ( self._mode )
	{
		case 0:
			self._$fps.style.display = "block";
			self._$ms.style.display = "none";
			break;

		case 1:
			self._$fps.style.display = "none";
			self._$ms.style.display = "block";
			break;
	}
};

module.exports = new PerformanceMonitor();