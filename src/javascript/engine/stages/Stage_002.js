"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );
var JSONLoader = require( "../etc/JSONLoader" );
var utils = require( "../etc/Utils" );
var Easing = require( "../animation/Easing" );

var self;

function Stage() {

	StageBase.call( this, "002" );

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
	var boxInteraction = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.BLUE_DARK
	} ) );
	boxInteraction.matrixAutoUpdate = false;
	boxInteraction.position.set( 50, 5, 0 );
	boxInteraction.castShadow = true;
	boxInteraction.updateMatrix();
	this.world.addObject3D( boxInteraction );

	this.actionManager.createInteractiveObject( boxInteraction, this.actionManager.COLLISIONTYPES.AABB, this.actionManager.RAYCASTPRECISION.FACE, "Label.Action", function() {

		// nothing happens here...
	} );

	// create first box with AABB collision detection
	var boxAABB = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.PRIMARY
	} ) );
	boxAABB.matrixAutoUpdate = false;
	boxAABB.position.set( 17, 15, 0 );
	boxAABB.castShadow = true;
	boxAABB.updateMatrix();
	this.world.addObject3D( boxAABB );

	this.actionManager.createActionObject( boxAABB, this.actionManager.COLLISIONTYPES.AABB );

	// create second box with OBB collision detection
	var boxOBB = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 20 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.PRIMARY
	} ) );
	boxOBB.matrixAutoUpdate = false;
	boxOBB.position.set( -17, 5, 0 );
	boxOBB.rotation.set( 0, Math.PI * 0.2, 0 );
	boxOBB.castShadow = true;
	boxOBB.updateMatrix();
	this.world.addObject3D( boxOBB );

	this.actionManager.createActionObject( boxOBB, this.actionManager.COLLISIONTYPES.OBB );

	// create plain object
	var boxPlain = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.BLUE_WHITE
	} ) );
	boxPlain.matrixAutoUpdate = false;
	boxPlain.position.set( -50, 5, 0 );
	boxPlain.castShadow = true;
	boxPlain.updateMatrix();
	this.world.addObject3D( boxPlain );

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

		self._changeStage( "003", true );	
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