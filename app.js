const express = require( "express" );
const path = require( "path" );
const favicon = require( "serve-favicon" );
const logger = require( "morgan" );
const cookieParser = require( "cookie-parser" );
const bodyParser = require( "body-parser" );
const passport = require( "passport" );
const BasicStrategy = require( "passport-http" ).BasicStrategy;
const i18n = require( "i18n-2" );
const compression = require( "compression" );
const routes = require( "./routes/index" );
const metadata = require( "./package.json" );
const localization = require( "./src/javascript/backend/middleware/localization" );

// create app
const app = express();

// view engine setup
app.set( "views", path.join( __dirname, "views" ) );
app.set( "view engine", "ejs" );

// enable verbose logging in development mode
// settings["verbose errors"] can be used in templates to detect dev mode
if ( process.env.NODE_ENV === "development" )
{
	app.enable( "verbose errors" );
}

// middleware config
app.use( compression() );
app.use( favicon( path.join( __dirname, "public/assets/images/favicon.ico" ) ) );
app.use( logger( "dev" ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( {
	extended : false
} ) );
app.use( passport.initialize() );
app.use( cookieParser() );
app.use( express.static( path.join( __dirname, "public" ), {
	maxAge : metadata.config.cache.duration,
	setHeaders : function( res, path ) {
		res.setHeader( "Access-Control-Allow-Origin", "*" );	
	}
} ) );

// prepare http basic auth
passport.use( new BasicStrategy(
		
	function( username, password, done ) 
	{
		if ( username === "username" && password === "password" )
		{
			return done( null, username );
		}
		else
		{
			return done( null, false );
		}
	}
	
) );

// authentication setup
if ( metadata.config.auth === true )
{
	app.use( "/", passport.authenticate( "basic", { session: false } ) );
}

// i18n setup
i18n.expressBind( app, {
	locales : [ "en", "de" ],
	directory : path.join( __dirname, "locales" )
} );
app.use( localization() );

// routes setup
app.use( "/", routes );

// error handlers

// 404 Not found
app.use( function( req, res, next ) {

	res.status( 404 );
	res.render( "404", {
		url : req.url
	} );
	
} );

// 500 Internal Server Error
app.use( function( err, req, res, next ) {

	res.status( err.status || 500 );
	res.render( "500", {
		error : err
	} );
	
} );

module.exports = app;