"use strict";

module.exports = function setLocale(req){
	if(req.headers["accept-language"] === undefined){
		req.i18n.setLocale("en");
	}else{
		if(req.acceptsLanguages("de-DE", "de") !== false){
			req.i18n.setLocale("de");
		}else{
			req.i18n.setLocale("en");
		}
	}
};