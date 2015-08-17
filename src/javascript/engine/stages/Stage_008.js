"use strict";

var THREE = require("three");

var StageBase = require("../core/StageBase");
var JSONLoader = require("../etc/JSONLoader");
var Easing = require("../animation/Easing");

var self;

function Stage(){
	
	StageBase.call(this, "008");
	
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
	
	// add materials and geometry
	var groundGeometry = new THREE.Geometry().fromBufferGeometry(new THREE.PlaneBufferGeometry(200, 100, 20, 10));
	var groundMaterial = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors});
	
	// add ground down
	var groundDown = new THREE.Mesh(groundGeometry, groundMaterial);
	groundDown.matrixAutoUpdate = false;
	groundDown.position.set(0, 0, -50);
	groundDown.rotation.x = -0.5 * Math.PI;
	groundDown.updateMatrix();
	groundDown.receiveShadow = true;
	this.controls.addGround(groundDown);
	this.scene.add(groundDown);
	
	// add ground up	
	var groundUp = new THREE.Mesh(groundGeometry, groundMaterial);
	groundUp.matrixAutoUpdate = false;
	groundUp.position.set(0, 7.5, 68);
	groundUp.rotation.x = -0.5 * Math.PI;
	groundUp.updateMatrix();
	groundUp.receiveShadow = true;
	this.controls.addGround(groundUp);
	this.scene.add(groundUp);
	
	// color faces
	colorFaces(groundGeometry);
	
	// add sign
	var signLoader = new JSONLoader();
	signLoader.load("assets/models/sign.json", function(geometry, materials) {
		
		self.settingsManager.adjustMaterials(materials, self.renderer);
		
		var sign = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
		sign.position.set(0, 27.5, 75);
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
	
	// add stairs
	var stairsLoader = new JSONLoader();
	stairsLoader.load("assets/models/stairs.json",  function(geometry, materials) {
		
		self.settingsManager.adjustMaterials(materials, self.renderer);
		
		materials[0].color = new THREE.Color(0x6083c2).convertGammaToLinear();
		materials[1].color = new THREE.Color(0x455066).convertGammaToLinear();
			
		var stairs = new THREE.Mesh(geometry,  new THREE.MeshFaceMaterial(materials));
		stairs.receiveShadow = true;
		self.scene.add(stairs);
	});
	
	// add invisible ramp
	var rampGeometry = new THREE.PlaneBufferGeometry(200, 25, 1, 1);
	var rampMaterial = new THREE.MeshBasicMaterial();
	
	var ramp = new THREE.Mesh(rampGeometry, rampMaterial);
	ramp.matrixAutoUpdate = false;
	ramp.position.set(0, 2.8, 6.4);
	ramp.rotation.x = 1.378 * Math.PI;
	ramp.updateMatrix();
	ramp.visible = false;
	this.controls.addGround(ramp);
	this.scene.add(ramp);
	
	// add trigger for scene change
	var stageTrigger = this.actionManager.createTrigger("Change Stage", 15, function(){
		
		self._changeStage("009", true);
	});
	stageTrigger.position.set(0, 7.5, 75);
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

module.exports = Stage;