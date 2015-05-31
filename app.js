"use strict";

var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var auth = require('http-auth');
var i18n = require("i18n-2");
var compress = require("compression");

var routes = require("./routes/index");
var metadata = require("./package.json");

var app = express();

// prepare http basic auth
var basic = auth.basic({realm: 'YUME'}, function(username, password, callback){
	callback(username === "username" && password === "password");
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// authentication setup
if(metadata.config.auth === true){
	app.use(auth.connect(basic));
}

app.use(favicon(__dirname + "/public/assets/images/favicon.ico"));
app.use(compress());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"), {
	maxAge: metadata.config.cache.duration,
	setHeaders: function (res, path) {
		  res.setHeader("Access-Control-Allow-Origin", "*");
	}
}));

// i18n
i18n.expressBind(app, {locales: ["en", "de"], directory: path.join(__dirname, "locales")});

// routes
app.use("/", routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});

module.exports = app;