"use strict";

var THREE = require("three");
var TWEEN = require("tween.js");

var Stage = require("../core/Stage");
var JSONLoader = require("../etc/JSONLoader");

var self;

function Stage_005(){
	
	Stage.call(this);

	self = this;
}

Stage_005.prototype = Object.create(Stage.prototype);
Stage_005.prototype.constructor = Stage_005;

Stage_005.prototype.setup = function(){
	
	Stage.prototype.setup.call(this);
	
	// setup controls
	this.controls.setPosition(new THREE.Vector3(0, 0, -75));
	this.controls.setRotation(new THREE.Vector3(0, Math.PI, 0));
	
	// load texts
	this.textManager.load("005");
	
	// add ground
	var groundGeometry = new THREE.Geometry().fromBufferGeometry(new THREE.PlaneBufferGeometry(200, 200, 20, 20));
	var groundMaterial = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors});
	
	var ground = new THREE.Mesh(groundGeometry, groundMaterial);
	ground.matrixAutoUpdate = false;
	ground.rotation.x = -0.5 * Math.PI;
	ground.updateMatrix();
	ground.receiveShadow = true;
	this.controls.addGround(ground);
	this.scene.add(ground);
	
	// color faces
	colorFaces(groundGeometry);
	
	// add background music
	this.audioManager.setBackgroundMusic("music");
	
	// add sign
	var signLoader = new JSONLoader();
	signLoader.load("assets/models/sign.json",  function(geometry, materials) {
		
		self.settingsManager.adjustMaterials(materials, self.renderer);
		
		var sign = new THREE.Mesh(geometry,  new THREE.MeshFaceMaterial(materials));
		sign.position.set(0, 20, 75);
		sign.rotation.set(0, Math.PI * -0.5, 0);
		self.scene.add(sign);
		
		self.animationManager.createHoverAnimation(sign.position.y, 18, 23, 5000, TWEEN.Easing.Sinusoidal.InOut, function(){
			sign.position.y = this.x;
		}).start();
	});
	
	// add trigger for stage change
	var stageTrigger = this.actionManager.createTrigger("Change Stage", 15, function(){
		self._changeStage("006", true);
	});
	stageTrigger.position.set(0, 0, 75);
	this.scene.add(stageTrigger);

	// start rendering
	this._render();
};

Stage_005.prototype.start = function(){
	
	Stage.prototype.start.call(this);
	
	// start playing
	this.audioManager.playBackgroundMusic();
	
	// set information panel text
	this.userInterfaceManager.setInformationPanelText("InformationPanel.Text");
};

Stage_005.prototype.destroy = function(){
	
	Stage.prototype.destroy.call(this);
	
	// stop playing
	this.audioManager.stopBackgroundMusic();
};

Stage_005.prototype._render = function(){
	
	Stage.prototype._render.call(self);
};

//custom functions

function colorFaces(geometry){
	
	for (var i = 0; i < geometry.faces.length; i ++){
		
		if(i % 2 === 0){
			geometry.faces[i].color = new THREE.Color(0x6083c2);
		}else{
			geometry.faces[i].color = new THREE.Color(0x455066);
		}
	}
}

module.exports = Stage_005;