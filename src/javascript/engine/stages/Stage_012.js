"use strict";

var THREE = require( "three" );

var StageBase = require( "../core/StageBase" );
var JSONLoader = require( "../etc/JSONLoader" );
var utils = require( "../etc/Utils" );
var Easing = require( "../animation/Easing" );

var ParticleEffect = require( "../particle/ParticleEffect" );
var Interpolator = require( "../particle/operator/Interpolator" );
var SphereEmitter = require( "../particle/emitter/SphereEmitter" );

var self, particles;

function Stage() {

	StageBase.call( this, "012" );

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
	
	// particle texture
	var texture = new THREE.TextureLoader().load( "/assets/textures/Blossom_1_S.png" );
	
	// particle emitter
	var emitter = new SphereEmitter({
		origin: new THREE.Vector3( 0, 10, 0),
		defaultDirection: true
	});
	
	// particle effect
	particles = new ParticleEffect({
		numberOfParticles : 5000,
		emitter : emitter,
		texture : texture,
		rotateTexture: true,
		transparent: true,
		sortParticles: true
	});
	
	// color interpolator
	var colorInterpolator = new Interpolator();
	
	colorInterpolator.addValue( 0.0, new THREE.Color( 0xff0000 ) );
	colorInterpolator.addValue( 0.4, new THREE.Color( 0x00ff00 ) );
	colorInterpolator.addValue( 0.7, new THREE.Color( 0x0000ff ) );
	
	// add interpolator to particle effect
	particles.addInterpolatorToProperty( colorInterpolator, "color" );

	// add trigger for ending
	var stageTrigger = this.actionManager.createTrigger( "Change Stage", new THREE.Vector3( 0, 0, 75 ), 15, true, function() {

		self._changeStage( "013", true );
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
	
	particles.destroy();
};

Stage.prototype._render = function() {
	
	particles.update( self._delta );
	
	StageBase.prototype._render.call( self );
};

module.exports = Stage;