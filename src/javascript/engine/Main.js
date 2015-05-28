"use strict";

var Bootstrap = require("./core/Bootstrap");
var Utils = require("./etc/Utils");

global.window.onload = function(){
	
	// get startup parameter
	var parameters = JSON.parse(global.sessionStorage.getItem("parameters"));
	Utils.setRuntimeInformation(parameters);
	
	// run engine
	var bootstrap = new Bootstrap();
};