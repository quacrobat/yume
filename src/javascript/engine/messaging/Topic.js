/**
 * @file This file contains all topics for publish & subscribe. YUME supports a
 * publish/subscribe messaging system with hierarchical addressing, so topics
 * can be organized in a hierarchy.
 * 
 * @author Human Interactive
 */
"use strict";

var TOPIC = {
	ACTION : {
		INTERACTION : "action.interaction"
	},
	APPLICATION : {
		START : "application.start",
		ERROR : {
			MUSIC : "application.error.music"
		},
		RESIZE : "application.resize"
	},
	CONTROLS : {
		CAPTURE : "controls.capture",
		LOCK : "controls.lock"
	},
	MULTIPLAYER : {
		CHAT : "multiplayer.chat",
		PLAYER : "multiplayer.player",
		MESSAGE : "multiplayer.message",
		STATUS : "multiplayer.status",
		UPDATE : "multiplayer.update"
	},
	STAGE : {
		CHANGE : "stage.change",
		LOADING : {
			PROGRESS : "stage.loading.progress",
			START : {
				ALL : "stage.loading.start",
				AUDIO : "stage.loading.start.audio",
				MUSIC : "stage.loading.start.music",
				OBJECT : "stage.loading.start.object",
				TEXT : "stage.loading.start.text"
			},
			COMPLETE : {
				ALL : "stage.loading.complete",
				AUDIO : "stage.loading.complete.audio",
				MUSIC : "stage.loading.complete.music",
				OBJECT : "stage.loading.complete.object",
				TEXT : "stage.loading.complete.text"
			}
		},
		READY : "stage.ready",
		START : "stage.start"
	}
};

module.exports = TOPIC;