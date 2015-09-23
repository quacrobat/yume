"use strict";

var THREE = require("three");

var StageBase = require("../core/StageBase");
var JSONLoader = require("../etc/JSONLoader");
var Easing = require("../animation/Easing");

var self, box, sphere;

function Stage(){
	
	StageBase.call(this, "010");
	
	self = this;
}

Stage.prototype = Object.create(StageBase.prototype);
Stage.prototype.constructor = Stage;

Stage.prototype.setup = function(){
	
	StageBase.prototype.setup.call(this);
	
	// controls setup
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
	this.world.addGround(ground);
	this.scene.add(ground);
	
	// color faces
	colorFaces(groundGeometry);
	
	// create first mesh for impostor demo
	sphere = new THREE.Mesh( new THREE.SphereGeometry(10, 25, 25), new THREE.MeshLambertMaterial( { color: 0x6083c2 } ));
	sphere.matrixAutoUpdate = false;
	sphere.position.set(-20, 10, 0);
	sphere.updateMatrix();
	sphere.visible = false;
	this.scene.add( sphere );
	
	// create second mesh for impostor demo
	box = new THREE.Mesh( new THREE.BoxGeometry(10, 10, 10), new THREE.MeshLambertMaterial( { color: 0x6083c2 } ));
	box.matrixAutoUpdate = false;
	box.position.set(20, 10, 0);
	box.updateMatrix();
	box.visible = false;
	this.scene.add( box );
	
	this.performanceManager.createImpostor("sphere", sphere, 512);
	this.performanceManager.createImpostor("box", box, 512);
	
	// add sign
	var signLoader = new JSONLoader();
	signLoader.load("assets/models/sign.json",  function(geometry, materials) {
		
		self.settingsManager.adjustMaterials(materials, self.renderer);
		
		var sign = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
		sign.position.set(0, 20, 75);
		sign.rotation.set(0, Math.PI * -0.5, 0);
		self.scene.add(sign);
		
		self.animationManager.createHoverAnimation({
			object: sign.position,
			property: "y",
			duration: 5000,
			start: sign.position.y,
			end: sign.position.y + 5,
			easing: Easing.Sinusoidal.InOut
		}).play();
	});
	
	// light
	var ambientLight = new THREE.AmbientLight(0x111111);
	this.scene.add(ambientLight);
	
	var directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(-100, 50, -100);
	directionalLight.shadowCameraLeft = -40;
	directionalLight.shadowCameraRight = 40;
	directionalLight.shadowCameraTop = 40;
	directionalLight.shadowCameraBottom = -40;
	this.settingsManager.adjustLight(directionalLight);
	this.scene.add(directionalLight);
	
	// add trigger for ending
	var stageTrigger = this.actionManager.createTrigger("Change Stage", 15, function(){

		self._changeStage("011", true);
	});
	stageTrigger.position.set(0, 0, 75);
	this.scene.add(stageTrigger);
	
	// generate impostors
	this.performanceManager.generateImpostors();

	// start rendering
	this._render();
};

Stage.prototype.start = function(){
	
	StageBase.prototype.start.call(this);
	
	// set information panel text
	this.userInterfaceManager.setInformationPanelText("InformationPanel.Text");
	
	// add special event handler for demo
	global.document.addEventListener("keydown", onKeyDown);
};

Stage.prototype.destroy = function(){
	
	StageBase.prototype.destroy.call(this);
	
	// remove special event handler for demo
	global.document.removeEventListener("keydown", onKeyDown);
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

function onKeyDown(event){
	
	switch (event.keyCode) {
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