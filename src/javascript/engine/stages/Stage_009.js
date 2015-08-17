"use strict";

var THREE = require("three");

var StageBase = require("../core/StageBase");
var JSONLoader = require("../etc/JSONLoader");
var Easing = require("../animation/Easing");

var self;

function Stage(){
	
	StageBase.call(this, "009");
	
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
	this.controls.addGround(ground);
	this.scene.add(ground);
	
	// color faces
	colorFaces(groundGeometry);
	
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
			startValue: sign.position.y,
			endValue: sign.position.y + 5,
			easingFunction: Easing.Sinusoidal.InOut
		}).start();
	});
	
	// create spheres for LOD switching
	var sphereOne = new THREE.Mesh(new THREE.SphereGeometry(10, 25, 25), new THREE.MeshLambertMaterial( { color: 0x6083c2} )); 
	var sphereTwo = new THREE.Mesh(new THREE.SphereGeometry(10, 10, 10), new THREE.MeshLambertMaterial( { color: 0x6083c2} ));
	var sphereThree = new THREE.Mesh(new THREE.SphereGeometry(10, 6, 6), new THREE.MeshLambertMaterial( { color: 0x6083c2} ));
	
	sphereOne.matrixAutoUpdate = false;
	sphereTwo.matrixAutoUpdate = false;
	sphereThree.matrixAutoUpdate = false;
	
	sphereOne.castShadow = true;
	sphereTwo.castShadow = true;
	sphereThree.castShadow = true;
	
	// create LOD instance
	var lod = this.performanceManager.createSmoothLOD("sphere", 10);
	lod.matrixAutoUpdate = false;
	lod.position.set(0,10,0);
	lod.updateMatrix();
	
	// add objects and distances
	lod.addLevel(sphereOne, 0);
	lod.addLevel(sphereTwo, 60);
	lod.addLevel(sphereThree, 100);
	
	this.scene.add(lod);
	
	// create circles to visualize the LOD distances
	showLODCircles(this.scene);
	
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

		self._changeStage("010", true);
	});
	stageTrigger.position.set(0, 0, 75);
	this.scene.add(stageTrigger);
	
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

function showLODCircles(scene){
	
	var circleOne =  new THREE.Mesh(new THREE.CircleGeometry(60, 25), new THREE.MeshBasicMaterial( { wireframe: true} ));
	var circleTwo =  new THREE.Mesh(new THREE.CircleGeometry(100, 25), new THREE.MeshBasicMaterial( { wireframe: true} ));
	
	circleOne.rotation.set(Math.PI * 0.5, 0, 0);
	circleTwo.rotation.set(Math.PI * 0.5, 0, 0);
	
	scene.add(circleOne);
	scene.add(circleTwo);
}

module.exports = Stage;