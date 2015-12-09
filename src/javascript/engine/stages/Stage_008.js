"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );
var JSONLoader = require( "../etc/JSONLoader" );
var utils = require( "../etc/Utils" );
var Easing = require( "../animation/Easing" );

var self;

function Stage() {

	StageBase.call( this, "008" );

	self = this;
}

Stage.prototype = Object.create( StageBase.prototype );
Stage.prototype.constructor = Stage;

Stage.prototype.setup = function() {

	StageBase.prototype.setup.call( this );

	// player setup
	this.world.player.position.set( 0, 0, -75 );
	this.world.player.setDirection( new THREE.Vector3( 0, 0, 1 ) );
	this.world.player.updateMatrixWorld();

	// load texts
	this.textManager.load( this.stageId );

	// add materials and geometry
	var groundGeometry = new THREE.Geometry().fromBufferGeometry( new THREE.PlaneBufferGeometry( 200, 100, 20, 10 ) );
	var groundMaterial = new THREE.MeshBasicMaterial( {
		vertexColors : THREE.FaceColors
	} );

	// add ground down
	var groundDown = new THREE.Mesh( groundGeometry, groundMaterial );
	groundDown.matrixAutoUpdate = false;
	groundDown.position.set( 0, 0, -50 );
	groundDown.rotation.x = - utils.HALF_PI;
	groundDown.updateMatrix();
	groundDown.receiveShadow = true;
	this.world.addGround( groundDown );

	// add ground up
	var groundUp = new THREE.Mesh( groundGeometry, groundMaterial );
	groundUp.matrixAutoUpdate = false;
	groundUp.position.set( 0, 7.5, 68 );
	groundUp.rotation.x = - utils.HALF_PI;
	groundUp.updateMatrix();
	groundUp.receiveShadow = true;
	this.world.addGround( groundUp );

	// color faces
	utils.colorFaces( groundGeometry, StageBase.COLORS.PRIMARY, StageBase.COLORS.BLUE_DARK );

	// add sign
	var signLoader = new JSONLoader();
	signLoader.load( "assets/models/sign.json", function( geometry, materials ) {

		self.settingsManager.adjustMaterials( materials, self.renderer );

		var sign = new THREE.Mesh( geometry, new THREE.MultiMaterial( materials ) );
		sign.position.set( 0, 27.5, 75 );
		sign.rotation.set( 0, - utils.HALF_PI, 0 );
		self.world.addObject3D( sign );

		self.animationManager.createBasicAnimation( {
			object : sign.position,
			property : "y",
			duration : 5000,
			start : sign.position.y,
			end : sign.position.y + 5,
			easing : Easing.Sinusoidal.InOut,
			loop : true
		} ).play();
	} );

	// add stairs
	var stairsLoader = new JSONLoader();
	stairsLoader.load( "assets/models/stairs.json", function( geometry, materials ) {

		self.settingsManager.adjustMaterials( materials, self.renderer );

		materials[ 0 ].color = StageBase.COLORS.PRIMARY;
		materials[ 1 ].color = StageBase.COLORS.BLUE_DARK;

		var stairs = new THREE.Mesh( geometry, new THREE.MultiMaterial( materials ) );
		stairs.receiveShadow = true;
		self.world.addObject3D( stairs );
	} );

	// add invisible ramp
	var rampGeometry = new THREE.PlaneBufferGeometry( 200, 25, 1, 1 );
	var rampMaterial = new THREE.MeshBasicMaterial( { visible: false } );

	var ramp = new THREE.Mesh( rampGeometry, rampMaterial );
	ramp.matrixAutoUpdate = false;
	ramp.position.set( 0, 2.8, 6.45 );
	ramp.rotation.x = 1.376 * Math.PI;
	ramp.updateMatrix();
	this.world.addGround( ramp );

	// add trigger for stage change
	var stageTrigger = this.actionManager.createTrigger( "Change Stage", new THREE.Vector3( 0, 7.5, 75 ), 15, true, function() {

		self._changeStage( "009", true );	
	} );

	// start rendering
	this._render();
};

Stage.prototype.start = function() {

	StageBase.prototype.start.call( this );

	// set information panel text
	this.userInterfaceManager.setInformationPanelText( "InformationPanel.Text" );
};

Stage.prototype.destroy = function() {

	StageBase.prototype.destroy.call( this );
};

Stage.prototype._render = function() {

	StageBase.prototype._render.call( self );
};

module.exports = Stage;