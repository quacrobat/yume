/**
 * @file Sets the correct locale value for each 
 * HTTP request.
 * 
 * @author Human Interactive
 */

"use strict";

module.exports = function() {
	
	return function(req, res, next) {
		
		if(req.headers["accept-language"] === undefined){
			req.i18n.setLocale("en");
		}else{
			if(req.acceptsLanguages("de-DE", "de") !== false){
				req.i18n.setLocale("de");
			}else{
				req.i18n.setLocale("en");
			}
		}
		
		next();
	};
};