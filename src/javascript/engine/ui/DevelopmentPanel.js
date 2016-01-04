/**
 * @file Prototype for ui-element development panel. This control is only
 * present in the UI if the development mode is active.
 * 
 * @author Human Interactive
 */

"use strict";

var UiElement = require( "./UiElement" );
var logger = require( "../core/Logger" );

var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var self, animationEndEvent;

/**
 * Creates the development panel.
 * 
 * @constructor
 * @augments UiElement
 */
function DevelopmentPanel() {

	UiElement.call( this );

	Object.defineProperties( this, {
		// the time delay interval in ms for a level item
		itemsDelayInterval : {
			value : 30,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// indicates, if the control is active
		isActive : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// an array with all DOM-levels of the panel
		_$levels : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// a reference to the breadcrumb navigation
		_$breadcrumbs : {
			value : null,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// an array of level objects. each level holds the info of its element
		// and its children
		_levels : {
			value : [],
			configurable : false,
			enumerable : false,
			writable : false
		},
		// index of current level
		_currentLevelIndex : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		// indicates, if the control is in an animation phase 
		_isAnimating : {
			value : false,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
	
	self = this;
}

DevelopmentPanel.prototype = Object.create( UiElement.prototype );
DevelopmentPanel.prototype.constructor = DevelopmentPanel;

/**
 * Initializes the control.
 */
DevelopmentPanel.prototype.init = function() {

	// get the root element of the panel
	this._$root = global.document.querySelector( "#development-panel" );
	this._$breadcrumbs = this._$root.querySelector( ".breadcrumbs" );
	
	// get the correct "animation end" event for this browser
	animationEndEvent = this._getAnimationEndEvent();

	// setup levels and events
	this._setupLevels();
	this._setupEvents();
	
	// add the initial breadcrumb
	this._addBreadcrumb( 0, true );
};

/**
 * Toggles the control.
 */
DevelopmentPanel.prototype.toggle = function() {

	if ( this.isActive === false )
	{
		this.show();
	}
	else
	{
		this.hide();
	}
};

/**
 * Shows the control.
 */
DevelopmentPanel.prototype.show = function() {

	// open panel
	this._$root.classList.add( "open" );
	
	// release pointer lock
	global.document.dispatchEvent( new global.Event( "releasePointer" ) );
	
	// set active flag
	this.isActive = true;
};

/**
 * Hides the control.
 */
DevelopmentPanel.prototype.hide = function() {

	// close panel
	this._$root.classList.remove( "open" );
	
	// lock pointer
	global.document.dispatchEvent( new global.Event( "lockPointer" ) );
	
	// set active flag
	this.isActive = false;
};

/**
 * Creates the level data structure.
 */
DevelopmentPanel.prototype._setupLevels = function(){
	
	var index, $level, $items;

	// "querySelectorAll" returns a "NodeList", but we want an array	
	Array.prototype.push.apply( this._$levels, this._$root.querySelectorAll( ".level" ) );

	// iterate over all DOM levels and create an array of level objects
	for ( index = 0; index < this._$levels.length; index++ )
	{
		// a reference to the own DOM element
		$level = this._$levels[ index ];
		
		// an array of all subsequent DOM levels
		$items = [];

		// fill the array with items 
		Array.prototype.push.apply( $items, $level.querySelectorAll( ".item" ) );

		// create an object and push it to the array
		this._levels.push( {
			$ : $level,
			$items : $items
		} );

		// set "current" class to level
		if ( index === this._currentLevelIndex )
		{
			$level.classList.add( "current" );
		}

	} // next DOM level
};

/**
 * Initializes the event handling for the control.
 */
DevelopmentPanel.prototype._setupEvents = function() {

	var index, $link, $links;

	$links = this._$root.querySelectorAll( ".link" );

	for ( index = 0; index < $links.length; index++ )
	{
		$link = $links[ index ];

		$link.addEventListener( "click", this._onItemClick );
		
	} // next link
};

/**
 * Opens the level for the given level index.
 * 
 * @param {number} nextLevelIndex - The index of the next sub level.
 * @param {string} subLevelName - The name of the next sub level.
 * @param {boolean} isBackNavigation - Indicates a back navigation.
 */
DevelopmentPanel.prototype._openLevel = function( nextLevelIndex, subLevelName, isBackNavigation ) {
	
	// if an other animation is currently running, we do nothing
	if( this._isAnimating === true ){
		return false;
	}
	
	// we start our animation and save this state
	this._isAnimating = true;
	
	// slide out the current level
	this._levelOut( isBackNavigation );
	
	// slide in the next level
	this._levelIn( nextLevelIndex, subLevelName, isBackNavigation );
};

/**
 * Slides out the current level.
 * 
 * @param {boolean} isBackNavigation - Indicates a back navigation.
 */
DevelopmentPanel.prototype._levelOut = function( isBackNavigation ) {

	var index, level, $item;

	// get the current level object
	level = this._levels[ this._currentLevelIndex ];

	// slide out current level items. first, set the delays for the items
	for ( index = 0; index < level.$items.length; index++ )
	{
		$item = level.$items[ index ];

		$item.style.WebkitAnimationDelay = $item.style.animationDelay = ( index * this.itemsDelayInterval ) + "ms";
	
	} // next level item

	// add the animation class
	if ( isBackNavigation === true )
	{
		level.$.classList.add( "animate-outToRight" );
	}
	else
	{
		level.$.classList.add( "animate-outToLeft" );
	}

};

/**
 * Slides in the next level.
 * 
 * @param {number} nextLevelIndex - The index of the next sub level.
 * @param {string} subLevelName - The name of the next sub level.
 * @param {boolean} isBackNavigation - Indicates a back navigation.
 */
DevelopmentPanel.prototype._levelIn = function( nextLevelIndex, subLevelName, isBackNavigation ) {

	var index, level, nextLevel, $item, numberOfItems;

	// get the current level object
	level = this._levels[ this._currentLevelIndex ];

	// get the object of the next level
	nextLevel = this._levels[ nextLevelIndex ];
	
	// save the name of this sub level
	nextLevel.name = subLevelName;

	// get the number of level items
	numberOfItems = nextLevel.$items.length;
	
	// this callback function is executed when the animation of the last level
	// item has ended
	var levelInCallback = function() {
		
		// set new current index
		self._currentLevelIndex = nextLevelIndex;

		// remove CSS classes from elements
		if ( isBackNavigation === true )
		{
			level.$.classList.remove( "animate-outToRight" );
			nextLevel.$.classList.remove( "animate-inFromLeft" );
		}
		else
		{
			level.$.classList.remove( "animate-outToLeft" );
			nextLevel.$.classList.remove( "animate-inFromRight" );
			
			// add breadcrumb
			self._addBreadcrumb( nextLevelIndex, false );
		}

		// set the "current" level CSS class
		level.$.classList.remove( "current" );
		nextLevel.$.classList.add( "current" );

		// animation ends so we can do the next animation
		self._isAnimating = false;
	};

	// slide in next level items
	for ( index = 0; index < numberOfItems; index++ )
	{
		$item = nextLevel.$items[ index ];

		$item.style.WebkitAnimationDelay = $item.style.animationDelay = ( index * this.itemsDelayInterval ) + "ms";

		// when we animate the last item, we need do some final work
		if ( index === ( numberOfItems - 1 ) )
		{
			this._onAnimationEnd( $item, levelInCallback );
		}

	} // next level item

	// add the animation class
	if ( isBackNavigation === true )
	{
		nextLevel.$.classList.add( "animate-inFromLeft" );
	}
	else
	{
		nextLevel.$.classList.add( "animate-inFromRight" );
	}
};

/**
 * Adds a breadcrumb for the given level index.
 * 
 * @param {number} nextLevelIndex - The index of the level.
 * @param {boolean} isFirstBreadcrumb - Indicates, if this is the first breadcrumb.
 */
DevelopmentPanel.prototype._addBreadcrumb = function( nextLevelIndex, isFirstBreadcrumb ) {

	var $breadCrumb, nextLevel;

	// get the next level object
	nextLevel = this._levels[ nextLevelIndex ];

	// if the "isFirstBreadcrumb" is set to true, it's not necessary to create a new element
	if ( isFirstBreadcrumb === true )
	{
		$breadCrumb = this._$breadcrumbs.querySelector( "a" );
	}
	else
	{
		// create the breadcrumb
		$breadCrumb = global.document.createElement( "a" );

		// set a reference from the breadcrumb to the corresponding level
		$breadCrumb.setAttribute( "data-subLevel", nextLevel.$.getAttribute( "data-level" ) );

		// set the name of the breadcrumb
		$breadCrumb.innerHTML = nextLevelIndex === 0 ? this.initialBreadcrumb : nextLevel.name;

		// append to DOM
		this._$breadcrumbs.appendChild( $breadCrumb );
	}

	// set listener for click event
	$breadCrumb.addEventListener( "click", this._onBreadcrumbClick );
};

/**
 * Gets the level index of the given navigation link.
 * 
 * @param {HTMLAnchorElement} link - The clicked navigation link.
 */
DevelopmentPanel.prototype._getLevelIndexOfItem = function( link ){
	
	var levelId, $level;
	
	// get the level id of the item (that's the target of the navigation)
	levelId = link.getAttribute( "data-subLevel" );
	
	// get the DOM element of the target level
	$level = this._$root.querySelector( "ul[ data-level='" + levelId + "']" );
	
	if ( levelId !== null && $level !== null ){
		
		return this._$levels.indexOf( $level );
	}
};

/**
 * This method sets the "animationEnd" callback function for the last level item.
 * 
 * @param {HTMLLIElement} item - The level item.
 * @param {function} callback - The callback function.
 */
DevelopmentPanel.prototype._onAnimationEnd = function( item, callback ){
	
	var onEndCallback = function( event ) {

		if ( event.target !== this )
		{
			return;
		}
		
		// remove the listener, so it runs only once
		this.removeEventListener( animationEndEvent, onEndCallback );

		// execute callback
		if ( typeof callback === "function" )
		{
			callback();
		}
	};

	item.addEventListener( animationEndEvent, onEndCallback );
};

/**
 * Click handler for a level navigation link.
 * 
 * @param {HTMLAnchorElement} link - The clicked link.
 */
DevelopmentPanel.prototype._executeAction = function( link ){
	
	var type, stageId;
	
	// get the type of the action
	type = link.getAttribute( "data-type" );
	
	switch( type ){
		
		case "stage": 
			
			stageId = link.getAttribute( "data-stageId" );
			
			// the stage ID must not be null
			logger.assert( stageId !== null, "DevelopmentPanel: No valid stage ID set in HTML source. Loading not possible." );
			
			// publish message to lock the controls
			eventManager.publish( TOPIC.CONTROLS.LOCK, {
				isLocked : true
			} );
			
			// publish message to trigger the change
			eventManager.publish( TOPIC.STAGE.CHANGE, {
				stageId : stageId,
				isSaveGame : true
			} );
			
			
			// hide the control when changing the stage
			this.hide();
			
			break;
			
		case "setting":
			
			break;
		
		default:
			
			throw "DevelopmentPanel: Invalid action type: " + type;
	}
};

/**
 * Click handler for a level navigation link.
 * 
 * @param {object} event - Default event object.
 */
DevelopmentPanel.prototype._onItemClick = function( event ) {

	var nextLevelIndex, levelName;

	// prevent default action of the event
	event.preventDefault();

	// now we try to retrieve the next level index for this link
	nextLevelIndex = self._getLevelIndexOfItem( event.target );

	// if the next level index is not undefined, there's a sub level
	if ( nextLevelIndex !== undefined )
	{
		// get the name of the level
		levelName = event.target.innerHTML;

		// open the level
		self._openLevel( nextLevelIndex, levelName, false );
	}
	else
	{
		self._executeAction( event.target );
	}
};

/**
 * Click handler for a breadcrumb.
 * 
 * @param {object} event - Default event object.
 */
DevelopmentPanel.prototype._onBreadcrumbClick = function( event ) {
	
	var nextLevelIndex, levelName;

	// prevent default action of the event
	event.preventDefault();

	// do nothing if this breadcrumb is the last one
	if ( event.target.nextSibling === null )
	{
		return false;
	}
	
	// now we try to retrieve the next level index for this link
	nextLevelIndex = self._getLevelIndexOfItem( event.target );
	
	// the next level index must not be undefined
	logger.assert( nextLevelIndex !== undefined, "DevelopmentPanel: No valid next level index set in breadcrumb." );
	
	// get the name of the level
	levelName = event.target.innerHTML;

	// open next level
	self._openLevel( nextLevelIndex, levelName, true );
	
	// remove breadcrumbs that are ahead
	while ( event.target.nextSibling !== null )
	{
		self._$breadcrumbs.removeChild( event.target.nextSibling );
	}
};

module.exports = new DevelopmentPanel();