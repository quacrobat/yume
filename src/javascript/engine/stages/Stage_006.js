"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );
var JSONLoader = require( "../etc/JSONLoader" );
var Easing = require( "../animation/Easing" );

var self;

var audioFire, audioClock;

function Stage() {

	StageBase.call( this, "006" );

	self = this;
}

Stage.prototype = Object.create( StageBase.prototype );
Stage.prototype.constructor = Stage;

Stage.prototype.setup = function() {

	StageBase.prototype.setup.call( this );

	// player setup
	this.world.player.position.set( 0, 0, -75 );
	this.world.player.setDirection( new THREE.Vector3( 0, 0, 1 ) );

	// load texts
	this.textManager.load( this.stageId );

	// add ground
	var groundGeometry = new THREE.Geometry().fromBufferGeometry( new THREE.PlaneBufferGeometry( 200, 200, 20, 20 ) );
	var groundMaterial = new THREE.MeshBasicMaterial( {
		vertexColors : THREE.FaceColors
	} );

	var ground = new THREE.Mesh( groundGeometry, groundMaterial );
	ground.matrixAutoUpdate = false;
	ground.rotation.x = -0.5 * Math.PI;
	ground.updateMatrix();
	ground.receiveShadow = true;
	this.world.addGround( ground );

	// color faces
	colorFaces( groundGeometry );

	// add boxes
	var staticBoxFire = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color :StageBase.COLORS.PRIMARY
	} ) );
	staticBoxFire.matrixAutoUpdate = false;
	staticBoxFire.position.set( 40, 5, 0 );
	staticBoxFire.castShadow = true;
	staticBoxFire.updateMatrix();
	this.world.addObject3D( staticBoxFire );
	this.actionManager.createStatic( staticBoxFire, this.actionManager.COLLISIONTYPES.AABB );

	var staticBoxClock = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.BLUE_WHITE
	} ) );
	staticBoxClock.matrixAutoUpdate = false;
	staticBoxClock.position.set( -40, 5, 0 );
	staticBoxClock.castShadow = true;
	staticBoxClock.updateMatrix();
	this.world.addObject3D( staticBoxClock );
	this.actionManager.createStatic( staticBoxClock, this.actionManager.COLLISIONTYPES.AABB );

	var staticBoxWall = new THREE.Mesh( new THREE.BoxGeometry( 1, 20, 40 ), new THREE.MeshBasicMaterial( {
		wireframe : true
	} ) );
	staticBoxWall.matrixAutoUpdate = false;
	staticBoxWall.position.set( -5.5, 5, 0 );
	staticBoxWall.updateMatrix();
	staticBoxClock.add( staticBoxWall );
	this.actionManager.createStatic( staticBoxWall, this.actionManager.COLLISIONTYPES.AABB );

	// add dynamic sounds
	this.audioManager.createAudioBufferList( [ "fire", "clock" ], function( bufferList ) {

		audioFire = self.audioManager.createDynamicSound( "ambient.fire", bufferList[ 0 ], true );
		audioFire.setRefDistance( 20 );
		audioFire.setRolloffFactor( 1 );
		audioFire.setMaxDistance( 50 );

		audioClock = self.audioManager.createDynamicSound( "ambient.clock", bufferList[ 1 ], true );
		audioClock.setRefDistance( 20 );
		audioClock.setRolloffFactor( 1 );
		audioClock.setMaxDistance( 50 );
		audioClock.addDirection( 180, 0, 0 );
		audioClock.position.set( -5, 0, 0 );

		staticBoxFire.add( audioFire );
		staticBoxClock.add( audioClock );
	} ).load();

	// add sign
	var signLoader = new JSONLoader();
	signLoader.load( "assets/models/sign.json", function( geometry, materials ) {

		self.settingsManager.adjustMaterials( materials, self.renderer );

		var sign = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
		sign.position.set( 0, 20, 75 );
		sign.rotation.set( 0, Math.PI * -0.5, 0 );
		self.world.addObject3D( sign );

		self.animationManager.createHoverAnimation( {
			object : sign.position,
			property : "y",
			duration : 5000,
			start : sign.position.y,
			end : sign.position.y + 5,
			easing : Easing.Sinusoidal.InOut
		} ).play();
	} );

	// add trigger for stage change
	var stageTrigger = this.actionManager.createTrigger( "Change Stage", new THREE.Vector3( 0, 0, 75 ), 15, true, function() {

		self._changeStage( "007", true );	
	} );

	// light
	var ambientLight = new THREE.AmbientLight( 0x111111 );
	this.world.addObject3D( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( -100, 50, -100 );
	directionalLight.shadowCameraLeft = -40;
	directionalLight.shadowCameraRight = 40;
	directionalLight.shadowCameraTop = 40;
	directionalLight.shadowCameraBottom = -40;
	this.settingsManager.adjustLight( directionalLight );
	this.world.addObject3D( directionalLight );

	// start rendering
	this._render();
};

Stage.prototype.start = function() {

	StageBase.prototype.start.call( this );

	// start playing
	audioFire.play();
	audioClock.play();

	// set information panel text
	this.userInterfaceManager.setInformationPanelText( "InformationPanel.Text" );
};

Stage.prototype.destroy = function() {

	StageBase.prototype.destroy.call( this );

	// stop playing
	audioFire.stop();
	audioClock.stop();
};

Stage.prototype._render = function() {

	StageBase.prototype._render.call( self );
};

// custom functions

function colorFaces( geometry ) {

	for ( var i = 0; i < geometry.faces.length; i++ )
	{
		if ( i % 2 === 0 )
		{
			geometry.faces[ i ].color = StageBase.COLORS.PRIMARY;
		}
		else
		{
			geometry.faces[ i ].color = StageBase.COLORS.BLUE_DARK;
		}
	}
}

module.exports = Stage;