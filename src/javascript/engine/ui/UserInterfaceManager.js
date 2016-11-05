/**
 * @file Interface for entire ui-handling. This prototype is used in stages to
 * access ui-based logic and to create ui-entities.
 * 
 * @author Human Interactive
 */

"use strict";

var eventManager = require( "../messaging/EventManager" );
var TOPIC = require( "../messaging/Topic" );

var system = require( "../core/System" );

var developmentPanel = require( "./DevelopmentPanel" );
var performanceMonitor = require( "./PerformanceMonitor" );
var informationPanel = require( "./InformationPanel" );
var interactionLabel = require( "./InteractionLabel" );
var loadingScreen = require( "./LoadingScreen" );
var menu = require( "./Menu" );
var textScreen = require( "./TextScreen" );
var modalDialog = require( "./ModalDialog" );
var chat = require( "./Chat" );

var self;

/**
 * Creates the user interface manager.
 * 
 * @constructor
 */
function UserInterfaceManager() {

	self = this;
}

/**
 * Initializes the user interface manager.
 */
UserInterfaceManager.prototype.init = function() {

	// eventing
	this._initEventListener();

	// subscriptions
	this._initSubscriptions();

	// the setup of controls must always be done AFTER the setup of event
	// listener and subscriptions
	informationPanel.init();
	interactionLabel.init();
	loadingScreen.init();
	menu.init();
	textScreen.init();
	modalDialog.init();
	chat.init();

	// add development controls
	if ( system.isDevModeActive === true )
	{
		performanceMonitor.init();
		developmentPanel.init();
	}
	
};

/**
 * Updates the manager.
 */
UserInterfaceManager.prototype.update = function() {

	if ( system.isDevModeActive === true )
	{
		performanceMonitor.update();
	}
};

/**
 * Sets the text of the information panel.
 * 
 * @param {string} textKey - The text-content of the information panel.
 */
UserInterfaceManager.prototype.setInformationPanelText = function( textKey ) {

	informationPanel.setText( textKey );
};

/**
 * Shows the text screen.
 * 
 * @param {object} textObject - The conversation of the text screen.
 * @param {function} completeCallback - This function is executed, when all
 * texts are shown and the ui-element is going to hide.
 */
UserInterfaceManager.prototype.showTextScreen = function( textKeys, completeCallback ) {

	textScreen.show( textKeys, completeCallback );
};

/**
 * Hides the text screen.
 */
UserInterfaceManager.prototype.hideTextScreen = function() {

	textScreen.hide();
};

/**
 * Shows the modal dialog.
 * 
 * @param {object} textKeys - The texts to display.
 */
UserInterfaceManager.prototype.showModalDialog = function( textKeys ) {

	modalDialog.show( textKeys );
};

/**
 * Hides the modal dialog.
 */
UserInterfaceManager.prototype.hideModalDialog = function() {

	modalDialog.hide();
};

/**
 * Handles the press of the space-key.
 */
UserInterfaceManager.prototype.handleUiInteraction = function() {

	if ( textScreen.isActive === true )
	{
		textScreen.complete();
	}
	else if ( loadingScreen.isActive === true && loadingScreen.isReady === true )
	{
		eventManager.publish( TOPIC.STAGE.START, undefined );
		loadingScreen.hide();
	}
};

/**
 * Initializes event listeners for DOM events.
 */
UserInterfaceManager.prototype._initEventListener = function() {

	global.window.addEventListener( "contextmenu", this._onContextMenu );
	global.window.addEventListener( "keydown", this._onKeyDown );
	global.window.addEventListener( "resize", this._onResize );
};

/**
 * Initializes subscriptions
 */
UserInterfaceManager.prototype._initSubscriptions = function() {

	eventManager.subscribe( TOPIC.UI.MENU.SHOW, this._onShowMenu );
	eventManager.subscribe( TOPIC.UI.MENU.HIDE, this._onHideMenu );
	
	eventManager.subscribe( TOPIC.UI.INTERACTION_LABEL.SHOW, this._onShowInteractionLabel );
	eventManager.subscribe( TOPIC.UI.INTERACTION_LABEL.HIDE, this._onHideInteractionLabel );
	
	eventManager.subscribe( TOPIC.UI.LOADING_SCREEN.SHOW, this._onShowLoadingScreen );
	eventManager.subscribe( TOPIC.UI.LOADING_SCREEN.HIDE, this._onHideLoadingScreen );
	
	eventManager.subscribe( TOPIC.UI.PERFORMANCE.TOGGLE, this._onPerformanceMonitor );
};

/**
 * This method handles the context menu event.
 * 
 * @param {object} event - The event object.
 */
UserInterfaceManager.prototype._onContextMenu = function( event ) {

	// disable contextmenu
	event.preventDefault();
};

/**
 * This method handles the keydown event.
 * 
 * @param {object} event - Default event object.
 */
UserInterfaceManager.prototype._onKeyDown = function( event ) {

	switch ( event.keyCode )
	{
		// enter
		case 13:
			
			event.preventDefault();

			if ( textScreen.isActive === false && 
			     modalDialog.isActive === false && 
			     developmentPanel.isActive === false && 
			     menu.isActive === false && 
			     loadingScreen.isActive === false )
			{
				chat.toggle();
			}

			break;

		// space
		case 32:

			if ( chat.isActive === false )
			{
				// prevent scrolling
				event.preventDefault();

				// because pressing the space key can cause different actions,
				// the logic for this key handling is placed in a separate method
				self.handleUiInteraction();
			}

			break;
			
		// m
		case 77:
			
			if ( system.isDevModeActive === true && ( textScreen.isActive === false && 
													  modalDialog.isActive === false && 
													  chat.isActive === false && 
													  menu.isActive === false && 
													  loadingScreen.isActive === false ) )
			{
				developmentPanel.toggle();
			}
			
			break;
	}
};

/**
 * This method handles the resize event.
 * 
 * @param {object} event - The event object.
 */
UserInterfaceManager.prototype._onResize = function( event ) {

	eventManager.publish( TOPIC.APPLICATION.RESIZE, undefined );
};

/**
 * This method handles the "show" topic for the menu.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
UserInterfaceManager.prototype._onShowMenu = function( message, data ) {
	
	menu.show();
};

/**
 * This method handles the "hide" topic for the menu.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
UserInterfaceManager.prototype._onHideMenu = function( message, data ) {
	
	menu.hide();
};

/**
 * This method handles the "show" topic for the interaction label.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
UserInterfaceManager.prototype._onShowInteractionLabel = function( message, data ) {
	
	interactionLabel.show( data.textKey );
};

/**
 * This method handles the "hide" topic for the interaction label.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
UserInterfaceManager.prototype._onHideInteractionLabel = function( message, data ) {
	
	interactionLabel.hide();
};

/**
 * This method handles the "show" topic for the loading screen.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
UserInterfaceManager.prototype._onShowLoadingScreen = function( message, data ) {
	
	loadingScreen.show( data.callback );
};

/**
 * This method handles the "hide" topic for the loading screen.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
UserInterfaceManager.prototype._onHideLoadingScreen = function( message, data ) {
	
	loadingScreen.hide();
};

/**
 * This method handles the "toggle" topic for the performance monitor.
 * 
 * @param {string} message - The message topic of the subscription.
 * @param {object} data - The data of the message.
 */
UserInterfaceManager.prototype._onPerformanceMonitor = function( message, data ) {
	
	performanceMonitor.toggle();
};

module.exports = new UserInterfaceManager();