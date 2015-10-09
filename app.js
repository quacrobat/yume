"use strict";

// module dependencies
var express = require( "express" );
var path = require( "path" );
var favicon = require( "serve-favicon" );
var logger = require( "morgan" );
var cookieParser = require( "cookie-parser" );
var bodyParser = require( "body-parser" );
var auth = require( "http-auth" );
var i18n = require( "i18n-2" );
var compress = require( "compression" );
var routes = require( "./routes/index" );
var metadata = require( "./package.json" );
var localization = require( "./src/javascript/backend/middleware/localization" );

// create app
var app = express();

// general config
app.set( "views", path.join( __dirname, "views" ) );
app.set( "view engine", "ejs" );

// prepare http basic auth
var basic = auth.basic( {
	realm : "YUME"
}, function( username, password, callback ) {

	callback( username === "username" && password === "password" );
} );

// authentication setup
if ( metadata.config.auth === true )
{
	app.use( auth.connect( basic ) );
}

// enable verbose logging in development
// can use in the templates via settings["verbose errors"]
if ( process.env.NODE_ENV === "development" )
{
	app.enable( "verbose errors" );
}

// middleware config
app.use( compress() );
app.use( favicon( path.join( __dirname, "public/assets/images/favicon.ico" ) ) );
app.use( logger( "dev" ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( {
	extended : false
} ) );
app.use( cookieParser() );
app.use( express.static( path.join( __dirname, "public" ), {
	maxAge : metadata.config.cache.duration,
	setHeaders : function( res, path ) {

		res.setHeader( "Access-Control-Allow-Origin", "*" );
	}
} ) );

// i18n
i18n.expressBind( app, {
	locales : [ "en", "de" ],
	directory : path.join( __dirname, "locales" )
} );
app.use( localization() );

// routes
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