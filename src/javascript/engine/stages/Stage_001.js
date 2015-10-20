"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );

var self, soccerGame;

function Stage() {

	StageBase.call( this, "001" );

	self = this;
}

Stage.prototype = Object.create( StageBase.prototype );
Stage.prototype.constructor = Stage;

Stage.prototype.setup = function() {

	StageBase.prototype.setup.call( this );

	// camera
	this.camera.position.set( 0, 40, 60 );
	this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

	// create soccer game
	soccerGame = this.entityManager.createSoccerGame( new THREE.Vector2( 80, 40 ) );
	this.world.addObject3D( soccerGame.object3D );
	
	// add event handler
	global.document.addEventListener( "keydown", onKeyDown );

	// start rendering
	this._render();
};

Stage.prototype.start = function() {

	StageBase.prototype.start.call( this );
};

Stage.prototype.destroy = function() {

	StageBase.prototype.destroy.call( this );
	
	// remove event handler
	global.document.removeEventListener( "keydown", onKeyDown );
};

Stage.prototype._render = function() {
	
	StageBase.prototype._render.call( self );
};

function onKeyDown( event ) {

	switch ( event.keyCode )
	{
		case 80:
			// p
			soccerGame.isPaused = !soccerGame.isPaused;
			break;
	}
}

module.exports = Stage;