"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );
var JSONLoader = require( "../etc/JSONLoader" );
var utils = require( "../etc/Utils" );
var Easing = require( "../animation/Easing" );

var self;

function Stage() {

	StageBase.call( this, "004" );

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

	// add ground
	var groundGeometry = new THREE.Geometry().fromBufferGeometry( new THREE.PlaneBufferGeometry( 200, 200, 20, 20 ) );
	var groundMaterial = new THREE.MeshLambertMaterial( {
		vertexColors : THREE.FaceColors
	} );

	var ground = new THREE.Mesh( groundGeometry, groundMaterial );
	ground.matrixAutoUpdate = false;
	ground.rotation.x = - utils.HALF_PI;
	ground.updateMatrix();
	ground.receiveShadow = true;
	this.world.addGround( ground );

	// color faces
	utils.colorFaces( groundGeometry, StageBase.COLORS.PRIMARY, StageBase.COLORS.BLUE_DARK );

	// create interactive box
	var boxTextScreen = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.BLUE_DARK
	} ) );
	boxTextScreen.matrixAutoUpdate = false;
	boxTextScreen.position.set( 20, 5, 0 );
	boxTextScreen.castShadow = true;
	boxTextScreen.updateMatrix();
	this.world.addObject3D( boxTextScreen );

	this.actionManager.createInteractiveObject( boxTextScreen, this.actionManager.COLLISIONTYPES.AABB, this.actionManager.RAYCASTPRECISION.FACE, "Label.TextScreen", function() {

		self.userInterfaceManager.showTextScreen( [ {
			name : "Name.Daniel",
			text : "TextScreen.Part1"
		}, {
			name : "Name.Peter",
			text : "TextScreen.Part2"
		}, {
			name : undefined,
			text : "TextScreen.Part3"
		} ] );
	} );

	// create interactive box
	var boxModal = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.PRIMARY
	} ) );
	boxModal.matrixAutoUpdate = false;
	boxModal.position.set( -20, 5, 0 );
	boxModal.castShadow = true;
	boxModal.updateMatrix();
	this.world.addObject3D( boxModal );

	this.actionManager.createInteractiveObject( boxModal, this.actionManager.COLLISIONTYPES.AABB, this.actionManager.RAYCASTPRECISION.FACE, "Label.Modal", function() {

		self.userInterfaceManager.showModalDialog( {
			headline : "Modal.Headline",
			button : "Modal.Button",
			content : "Modal.Content"
		} );
	} );

	// add sign
	var signLoader = new JSONLoader();
	signLoader.load( "/assets/models/sign.json", function( geometry, materials ) {

		self.settingsManager.adjustMaterials( materials, self.renderer );

		var sign = new THREE.Mesh( geometry, new THREE.MultiMaterial( materials ) );
		sign.position.set( 0, 20, 75 );
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

	// add trigger for stage change
	var stageTrigger = this.actionManager.createTrigger( "Change Stage", new THREE.Vector3( 0, 0, 75 ), 15, true, function() {

		self._changeStage( "005", true );	
	} );

	// light
	var ambientLight = new THREE.AmbientLight( 0x999999 );
	this.world.addObject3D( ambientLight );
	
	var directionalLight = new THREE.DirectionalLight( 0xcccccc );
	directionalLight.position.set( -100, 50, -100 );
	directionalLight.shadow.camera.left = -50;
	directionalLight.shadow.camera.right = 50;
	directionalLight.shadow.camera.top = 50;
	directionalLight.shadow.camera.bottom = -50;
	this.settingsManager.adjustLight( directionalLight );
	this.world.addObject3D( directionalLight );
	
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