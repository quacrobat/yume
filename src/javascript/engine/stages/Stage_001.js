"use strict";

var THREE = require("three");

var StageBase = require("../core/StageBase");
var JSONLoader = require("../etc/JSONLoader");
var Easing = require("../animation/Easing");

var Vehicle = require("../game/Vehicle");
var MovingEntity = require("../game/MovingEntity");

var self;

var vehicle, shapeVehicle, target, shapeTarget;

function Stage(){
	
	StageBase.call(this, "001");
	
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
			start: sign.position.y,
			end: sign.position.y + 5,
			easing: Easing.Sinusoidal.InOut
		}).play();
	});
	
	// add trigger for stage change
	var stageTrigger = this.actionManager.createTrigger("Change Stage", 15, function(){
		self._changeStage("002", true);
	});
	stageTrigger.position.set(0, 0, 75);
	this.scene.add(stageTrigger);
	
	var staticBoxOne = new THREE.Mesh( new THREE.BoxGeometry(5, 5, 5) , new THREE.MeshBasicMaterial({color: 0x6083c2}));
	staticBoxOne.matrixAutoUpdate = false;
	staticBoxOne.position.set(0, 20, -20);
	staticBoxOne.castShadow = true;
	staticBoxOne.updateMatrix();
	this.scene.add(staticBoxOne);
	
	this.actionManager.createStatic(staticBoxOne, this.actionManager.COLLISIONTYPES.AABB );
	
	var staticBoxTwo = new THREE.Mesh( new THREE.BoxGeometry(5, 5, 5) , new THREE.MeshBasicMaterial({color: 0x6083c2}));
	staticBoxTwo.matrixAutoUpdate = false;
	staticBoxTwo.position.set(0, 20, 20);
	staticBoxTwo.castShadow = true;
	staticBoxTwo.updateMatrix();
	this.scene.add(staticBoxTwo);
	
	this.actionManager.createStatic(staticBoxTwo, this.actionManager.COLLISIONTYPES.AABB );
	
	// ai
	target = new Vehicle( new THREE.Vector3( 5, 0, 5 ), 1, 10 );
	target.position.set(0, 20, 0);
	target.geometry = new THREE.BoxGeometry(1, 1, 1);
	target.material = new THREE.MeshBasicMaterial({color: 0x6083c2});
	this.scene.add(target);
	
	vehicle = new Vehicle( new THREE.Vector3(), 1, 10 );
	vehicle.position.set( 0, 20, 30);
	vehicle.geometry = new THREE.CylinderGeometry(5, 5, 5);
	vehicle.material = new THREE.MeshBasicMaterial({color: 0x455066});
	this.scene.add(vehicle);
	
	vehicle.steering.path.isLoop = true;

	vehicle.steering.followPathOn();
	vehicle.steering.obstacleAvoidanceOn();

	vehicle.steering.path.addWaypoint( new THREE.Vector3(  40, 20,  20 ));
	vehicle.steering.path.addWaypoint( new THREE.Vector3(  40, 20, -20 ));
	vehicle.steering.path.addWaypoint( new THREE.Vector3( -40, 20, -20 ));
	vehicle.steering.path.addWaypoint( new THREE.Vector3( -40, 20,  20 ));
	
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

var step = 0;

Stage.prototype._render = function(){
	
	step += 0.005;
	
	target.position.x = Math.cos( step ) * 40;
	target.position.z = Math.sin( step ) * 40;
	
	vehicle.update( self._delta );
	
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