"use strict";

var THREE = require("three");
var TWEEN = require("tween.js");

var Stage = require("../core/Stage");
var JSONLoader = require("../etc/JSONLoader");

var self, index = 0;

function Stage_003(){
	
	Stage.call(this);

	self = this;
}

Stage_003.prototype = Object.create(Stage.prototype);
Stage_003.prototype.constructor = Stage_003;

Stage_003.prototype.setup = function(){
	
	Stage.prototype.setup.call(this);
	
	// setup controls
	this.controls.setPosition(new THREE.Vector3(0, 0, -75));
	this.controls.setRotation(new THREE.Vector3(0, Math.PI, 0));
	
	// load texts
	this.textManager.load("003");
	
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
	
	// create interactive box
	var interactiveBox = new THREE.Mesh( new THREE.BoxGeometry(10, 10, 10) , new THREE.MeshLambertMaterial({color: 0x455066}));
	interactiveBox.matrixAutoUpdate = false;
	interactiveBox.position.set(20, 5, 0);
	interactiveBox.castShadow = true;
	interactiveBox.updateMatrix();
	this.scene.add(interactiveBox);

	this.actionManager.createInteraction("Label.Color", interactiveBox, function(){	
		colorMesh(interactiveBox);
	});	
	
	// add trigger for color change
	var colorTrigger = this.actionManager.createTrigger("Color Change", 10, function(){
		colorMesh(interactiveBox);
	});
	colorTrigger.position.set(-20, 0, 0);
	this.scene.add(colorTrigger);
	
	// visualize trigger with circle
	var triggerCircle = new THREE.Mesh(new THREE.CircleGeometry(10) , new THREE.MeshBasicMaterial({wireframe: true}));
	colorTrigger.add(triggerCircle);
	
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
		self._changeStage("004", true);
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

Stage_003.prototype.start = function(){
	
	Stage.prototype.start.call(this);
	
	// set information panel text
	this.userInterfaceManager.setInformationPanelText("InformationPanel.Text");
};

Stage_003.prototype.destroy = function(){
	
	Stage.prototype.destroy.call(this);
};

Stage_003.prototype._render = function(){
	
	Stage.prototype._render.call(self);
};

// custom functions

function colorFaces(geometry){
	
	for (var i = 0; i < geometry.faces.length; i ++){
		
		if(i % 2 === 0){
			geometry.faces[i].color = new THREE.Color(0x6083c2);
		}else{
			geometry.faces[i].color = new THREE.Color(0x455066);
		}
	}
}

function colorMesh(mesh){
	
	if(++index % 2 === 0){
		mesh.material.color = new THREE.Color(0x455066);
	}else{
		mesh.material.color = new THREE.Color(0xffffff);
	}	
}

module.exports = Stage_003;