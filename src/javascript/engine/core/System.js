/**
 * @file This prototype holds core information about the engine. The runtime
 * behavior of the application depends crucially of this prototype.
 * 
 * @author Human Interactive
 */

"use strict";

/**
 * Creates the system instance.
 * 
 * @constructor
 */
function System() {

	Object.defineProperties( this, {
		// the name of the application
		name : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the version of the application
		version : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the locale (i18n) of the application
		locale : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// the URL to a content delivery network.
		// assets can be loaded from a different server than the application
		cdn : {
			value : null,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// indicates, if multiplayer components should be active
		isMultiplayerActive : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		},
		// indicates, if the development mode is active.
		// in production, this value should always be false to disable logging
		isDevModeActive : {
			value : false,
			configurable : false,
			enumerable : true,
			writable : true
		}
	} );
}

/**
 * Initialized the system with parameters from the back-end.
 * 
 * @param {object} parameter - Startup parameters of the system.
 */
System.prototype.init = function( parameter ) {
	
	this.name = parameter.name;
	this.version = parameter.version;
	this.locale = parameter.locale;
	this.cdn = parameter.cdn;
	
	this.isMultiplayerActive = !!parameter.isMultiplayerActive;
	this.isDevModeActive = !!parameter.isDevModeActive;
};

module.exports = new System();