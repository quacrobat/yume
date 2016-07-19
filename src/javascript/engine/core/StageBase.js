/**
 * @file Basis prototype for all stages. It is used to provide specific stages a
 * set of managers and other common functionality.
 * 
 * @author Human Interactive
 */

"use strict";

var THREE = require( "three" );

var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var renderer = require( "./Renderer" );
var camera = require( "./Camera" );
var world = require( "./World" );
var system = require( "./System" );
var actionManager = require( "../action/ActionManager" );
var audioManager = require( "../audio/AudioManager" );
var animationManager = require( "../animation/AnimationManager" );
var entityManager = require( "../game/entity/EntityManager" );
var performanceManager = require( "../etc/PerformanceManager" );
var textManager = require( "../etc/TextManager" );
var saveGameManager = require( "../etc/SaveGameManager" );
var settingsManager = require( "../etc/SettingsManager" );
var userInterfaceManager = require( "../ui/UserInterfaceManager" );

/**
 * Creates a stage.
 * 
 * @constructor
 * 
 * @param {string} stageId - The ID of the stage.
 */
function StageBase( stageId ) {

	Object.defineProperties( this, {
		stageId : {
			value : stageId,
			configurable : false,
			enumerable : true,
			writable : true
		},
		renderer : {
			value : renderer,
			configurable : false,
			enumerable : true,
			writable : false
		},
		camera : {
			value : camera,
			configurable : false,
			enumerable : true,
			writable : false
		},
		world : {
			value : world,
			configurable : false,
			enumerable : true,
			writable : false
		},
		actionManager : {
			value : actionManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		animationManager : {
			value : animationManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		audioManager : {
			value : audioManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		entityManager : {
			value : entityManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		performanceManager : {
			value : performanceManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		saveGameManager : {
			value : saveGameManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		settingsManager : {
			value : settingsManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		textManager : {
			value : textManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		timeManager : {
			value : new THREE.Clock(),
			configurable : false,
			enumerable : true,
			writable : false
		},
		userInterfaceManager : {
			value : userInterfaceManager,
			configurable : false,
			enumerable : true,
			writable : false
		},
		_delta : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		},
		_renderId : {
			value : 0,
			configurable : false,
			enumerable : false,
			writable : true
		}
	} );
}

/**
 * This method is called, when the all requirements are fulfilled to setup the
 * stage. In dev-mode, additional helper objects are added.
 */
StageBase.prototype.setup = function() {

	if ( system.isDevModeActive === true )
	{
		this.world.addObject3D( new THREE.AxisHelper( 30 ) );
		this.world.addObject3D( new THREE.GridHelper( 200, 20 ) );
	}
};

/**
 * This method is called, when the stage is ready and started by the player.
 */
StageBase.prototype.start = function() {

	// publish message to release the controls
	eventManager.publish( TOPIC.CONTROLS.LOCK, {
		isLocked : false
	} );
};

/**
 * This method is called, when the stage is destroyed.
 */
StageBase.prototype.destroy = function() {

	// remove stage objects from all managers
	this.actionManager.removeActionObjects();

	this.actionManager.removeTriggers();

	this.animationManager.removeAnimations();

	this.animationManager.removeSprites();

	this.audioManager.removeAudiosStage();

	this.entityManager.removeEntities();

	this.performanceManager.removeLODs();

	this.performanceManager.removeImpostors();

	this.textManager.removeTexts();

	// clear world
	this.world.clear();

	// clear renderer
	this.renderer.clear();

	// stop render loop
	global.cancelAnimationFrame( this._renderId );
};

/**
 * Renders the stage.
 */
StageBase.prototype._render = function() {

	// get delta time value
	this._delta = this.timeManager.getDelta();
	
	// update entity manager
	this.entityManager.update( this._delta );
	
	// update managers
	this.actionManager.update( this.world.player );
	this.animationManager.update( this._delta );
	this.performanceManager.update();
	this.userInterfaceManager.update();

	// render frame
	this.renderer.render( this.world.scene, this.camera );

	// save render ID
	this._renderId = global.requestAnimationFrame( this._render );
};

/**
 * Changes the stage.
 * 
 * @param {string} stageId - The new stageId
 * @param {boolean} isSaveGame - Should the progress be saved?
 */
StageBase.prototype._changeStage = function( stageId, isSaveGame ) {

	// publish message to lock the controls
	eventManager.publish( TOPIC.CONTROLS.LOCK, {
		isLocked : true
	} );
	
	// publish message to trigger the change
	eventManager.publish( TOPIC.STAGE.CHANGE, {
		stageId : stageId,
		isSaveGame : isSaveGame
	} );
};

// frequently used colors
StageBase.COLORS = {
	PRIMARY    : new THREE.Color( 0x6083c2 ),
	SECONDARY  : new THREE.Color( 0x20252f ),
	BLUE_DARK  : new THREE.Color( 0x455066 ),
	BLUE_WHITE : new THREE.Color( 0xf3f4f6 )
};

module.exports = StageBase;