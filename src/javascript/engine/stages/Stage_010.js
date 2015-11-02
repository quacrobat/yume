"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );
var JSONLoader = require( "../etc/JSONLoader" );
var Easing = require( "../animation/Easing" );

var self, box, sphere;

function Stage() {

	StageBase.call( this, "010" );

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

	// create first mesh for impostor demo
	sphere = new THREE.Mesh( new THREE.SphereGeometry( 10, 25, 25 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.PRIMARY
	} ) );
	sphere.matrixAutoUpdate = false;
	sphere.position.set( -20, 10, 0 );
	sphere.updateMatrix();
	sphere.visible = false;
	this.world.addObject3D( sphere );

	// create second mesh for impostor demo
	box = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 10 ), new THREE.MeshLambertMaterial( {
		color : StageBase.COLORS.PRIMARY
	} ) );
	box.matrixAutoUpdate = false;
	box.position.set( 20, 10, 0 );
	box.updateMatrix();
	box.visible = false;
	this.world.addObject3D( box );

	this.performanceManager.createImpostor( "sphere", sphere, 512 );
	this.performanceManager.createImpostor( "box", box, 512 );

	// add sign
	var signLoader = new JSONLoader();
	signLoader.load( "assets/models/sign.json", function( geometry, materials ) {

		self.settingsManager.adjustMaterials( materials, self.renderer );

		var sign = new THREE.Mesh( geometry, new THREE.MultiMaterial( materials ) );
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

	// add trigger for stage change
	var stageTrigger = this.actionManager.createTrigger( "Change Stage", new THREE.Vector3( 0, 0, 75 ), 15, true, function() {

		self._changeStage( "011", true );	
	} );
	
	// start rendering
	this._render();
};

Stage.prototype.start = function() {

	StageBase.prototype.start.call( this );

	// set information panel text
	this.userInterfaceManager.setInformationPanelText( "InformationPanel.Text" );
	
	// generate impostors
	this.performanceManager.generateImpostors();
	
	// add special event handler for demo
	global.document.addEventListener( "keydown", onKeyDown );
};

Stage.prototype.destroy = function() {

	StageBase.prototype.destroy.call( this );

	// remove special event handler for demo
	global.document.removeEventListener( "keydown", onKeyDown );
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

function onKeyDown( event ) {

	switch ( event.keyCode )
	{
		case 73:
			// i
			sphere.visible = !sphere.visible;
			box.visible = !box.visible;
			break;
		case 71:
			// g
			self.performanceManager.generateImpostors();
			break;
	}
}

module.exports = Stage;