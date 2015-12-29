"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );
var JSONLoader = require( "../etc/JSONLoader" );
var utils = require( "../etc/Utils" );
var Easing = require( "../animation/Easing" );

var Water = require ( "../etc/Water" );

var self, water, box, sphere;

function Stage() {

	StageBase.call( this, "013" );

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
	
	// add trigger for ending
	var stageTrigger = this.actionManager.createTrigger( "Change Stage", new THREE.Vector3( 0, 0, 75 ), 15, true, function() {

		self.userInterfaceManager.showModalDialog( {
			headline : "Modal.Headline",
			button : "Modal.Button",
			content : "Modal.Content"
		} );

		self.saveGameManager.remove();	
	} );
	
	// add some moving objects to demonstrate the water effect
	box = new THREE.Mesh( new THREE.BoxGeometry( 5, 5, 5 ), new THREE.MeshBasicMaterial( {
		color : StageBase.COLORS.BLUE_DARK
	} ) );
	
	this.world.addObject3D( box );
	
	sphere = new THREE.Mesh( new THREE.SphereGeometry( 2.5, 10, 10 ), new THREE.MeshBasicMaterial( {
		color : StageBase.COLORS.BLUE_WHITE
	} ) );
	
	this.world.addObject3D( sphere );
	
	// create water 
	water = new Water( this.renderer, this.camera, this.world, {
		width: 200,
		height: 200,
		segments: 3,
		lightDirection: new THREE.Vector3( 0.7, 0.7, 0 )
	});
	
	water.position.set( 0, 1, 0 );
	water.rotation.set( Math.PI * -0.5, 0, 0 );
	water.updateMatrix();
	this.world.addObject3D( water );

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
	
	// update the water
	water.update( self.timeManager.elapsedTime );
	
	// animate the moving objects
	var step = self.timeManager.elapsedTime * 0.5;
	
	box.position.set( Math.cos( step  ) * 20, 10, Math.sin( step ) * 20 );
	sphere.position.set( Math.sin( step ) * 50, 10, Math.cos( step ) * 50 );
	
	StageBase.prototype._render.call( self );
};

module.exports = Stage;