var express = require( "express" );
var router = express.Router();

var metadata = require( "./../package.json" );

router.get( "/", function( req, res ) {

	// set no-cache for dynamic content
	res.set( "Cache-Control", "no-cache" );

	// the view will render some JavaScript, that saves this object
	// into the session storage. YUME will access this object to
	// configure its runtime behavior
	var parameter = {

		// the name of the application, extracted from package.json
		name : metadata.name,

		// the version of the application, // extracted from package.json
		version : metadata.version,

		// the locale depends on the language settings of the clients browser
		locale : req.i18n.getLocale(),

		// the URL of the CDN depends on the environment variables
		// (development/production)
		cdn : ( process.env.NODE_ENV === "development" ) ? metadata.config.cdn.development : metadata.config.cdn.production,

		// the development mode depends on the environment variables
		// (development/production)
		isDevModeActive : ( process.env.NODE_ENV === "development" ) ? true : false,

		// multiplayer settings extracted from package.json
		isMultiplayerActive : metadata.config.multiplayer.active
	};

	// render view
	res.render( "index", parameter );
} );

module.exports = router;
