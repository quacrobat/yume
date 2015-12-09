"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );
var JSONLoader = require( "../etc/JSONLoader" );
var utils = require( "../etc/Utils" );
var Easing = require( "../animation/Easing" );

var self;

function Stage() {

	StageBase.call( this, "009" );

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
	var groundMaterial = new THREE.MeshBasicMaterial( {
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

	// add sign
	var signLoader = new JSONLoader();
	signLoader.load( "assets/models/sign.json", function( geometry, materials ) {

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

	// create spheres for LOD switching
	var sphereOne = new THREE.Mesh( new THREE.SphereGeometry( 10, 25, 25 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.PRIMARY
	} ) );
	var sphereTwo = new THREE.Mesh( new THREE.SphereGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.PRIMARY
	} ) );
	var sphereThree = new THREE.Mesh( new THREE.SphereGeometry( 10, 6, 6 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.PRIMARY
	} ) );

	sphereOne.matrixAutoUpdate = false;
	sphereTwo.matrixAutoUpdate = false;
	sphereThree.matrixAutoUpdate = false;

	sphereOne.castShadow = true;
	sphereTwo.castShadow = true;
	sphereThree.castShadow = true;

	// create LOD instance
	var lod = this.performanceManager.createSmoothLOD( "sphere", 10 );
	lod.matrixAutoUpdate = false;
	lod.position.set( 0, 10, 0 );
	lod.updateMatrix();

	// add objects and distances
	lod.addLevel( sphereOne, 0 );
	lod.addLevel( sphereTwo, 60 );
	lod.addLevel( sphereThree, 100 );

	this.world.addObject3D( lod );

	// create circles to visualize the LOD distances
	showLODCircles( this.world );

	// light
	var ambientLight = new THREE.AmbientLight( 0x111111 );
	this.world.addObject3D( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( -100, 50, -100 );
	directionalLight.shadow.camera.left = -40;
	directionalLight.shadow.camera.right = 40;
	directionalLight.shadow.camera.top = 40;
	directionalLight.shadow.camera.bottom = -40;
	directionalLight.shadow.darkness = 0.5;
	this.settingsManager.adjustLight( directionalLight );
	this.world.addObject3D( directionalLight );

	// add trigger for stage change
	var stageTrigger = this.actionManager.createTrigger( "Change Stage", new THREE.Vector3( 0, 0, 75 ), 15, true, function() {

		self._changeStage( "010", true );	
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

// custom functions

function showLODCircles( world ) {

	var circleOne = new THREE.Mesh( new THREE.CircleGeometry( 60, 25 ), new THREE.MeshBasicMaterial( {
		wireframe : true
	} ) );
	var circleTwo = new THREE.Mesh( new THREE.CircleGeometry( 100, 25 ), new THREE.MeshBasicMaterial( {
		wireframe : true
	} ) );

	circleOne.rotation.set( utils.HALF_PI, 0, 0 );
	circleTwo.rotation.set( utils.HALF_PI, 0, 0 );

	world.addObject3D( circleOne );
	world.addObject3D( circleTwo );
}

module.exports = Stage;