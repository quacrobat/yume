"use strict";

var THREE = require("three");
var TWEEN = require("tween.js");

var StageBase = require("../core/StageBase");
var JSONLoader = require("../etc/JSONLoader");

var self;

function Stage(){
	
	StageBase.call(this, "007");

	self = this;
}

Stage.prototype = Object.create(StageBase.prototype);
Stage.prototype.constructor = Stage;

Stage.prototype.setup = function(){
	
	StageBase.prototype.setup.call(this);
	
	// setup controls
	this.controls.setPosition(new THREE.Vector3(0, 0, -75));
	this.controls.setRotation(new THREE.Vector3(0, Math.PI, 0));
	
	// load texts
	this.textManager.load(this.stageId);
	
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
	
	// add objects
	var interactiveBoxBasic = new THREE.Mesh( new THREE.BoxGeometry(10, 10, 10) , new THREE.MeshLambertMaterial({color: 0x6083c2}));
	interactiveBoxBasic.position.set(20, 5, 0);
	interactiveBoxBasic.castShadow = true;
	this.scene.add(interactiveBoxBasic);
	
	var interactiveObject = this.actionManager.createInteraction("Label.BasicAnimation", interactiveBoxBasic, function(){
		
		interactiveObject.action.isActive = false;
		
		// create a basic animation, which animates a single value one-time
		self.animationManager.createBasicAnimation(interactiveBoxBasic.position.x, 50, 5000, TWEEN.Easing.Quartic.InOut, function(){
			interactiveBoxBasic.position.x = this.x;
		}).start();
	});
	
	var staticBoxHover = new THREE.Mesh( new THREE.BoxGeometry(10, 10, 10) , new THREE.MeshLambertMaterial({color: 0xf3f4f6}));
	staticBoxHover.position.set(-40, 8, 0);
	staticBoxHover.castShadow = true;
	this.scene.add(staticBoxHover);
	this.actionManager.createStatic(staticBoxHover);
	
	// create a hover animation, which animates a single value between a range
	this.animationManager.createHoverAnimation(staticBoxHover.position.y, 6, 8, 4000, TWEEN.Easing.Sinusoidal.InOut, function(){
		staticBoxHover.position.y = this.x;
	}).start();

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
	
	// add trigger for ending
	var stageTrigger = this.actionManager.createTrigger("Change Stage", 15, function(){
		
		self.userInterfaceManager.showModalDialog({
			headline: "Modal.Headline",
			button: "Modal.Button",
			content: "Modal.Content"
		});
		
		self.saveGameManager.remove();
	});
	stageTrigger.position.set(0, 0, 75);
	this.scene.add(stageTrigger);
	
	// light
	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(-100, 50, -100);
	light.shadowCameraLeft = -40;
	light.shadowCameraRight = 40;
	light.shadowCameraTop = 40;
	light.shadowCameraBottom = -40;
	this.settingsManager.adjustLight(light);
	this.scene.add(light);

	// start rendering
	this._render();
};

Stage.prototype.start = function(){
	
	StageBase.prototype.start.call(this);
	
	// set information panel text
	this.userInterfaceManager.setInformationPanelText("InformationPanel.Text");
};

Stage.prototype.destroy = function(){
	
	StageBase.prototype.destroy.call(this);
};

Stage.prototype._render = function(){
	
	StageBase.prototype._render.call(self);
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

module.exports = Stage;