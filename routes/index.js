var express = require("express");
var router = express.Router();
var setLocale = require("../src/javascript/backend/modules/I18N");

var appInfos = require("./../package.json");

/* GET home page. */
router.get("/", function(req, res) {
	setLocale(req);
	
	res.set("Cache-Control", "no-cache");
	res.render("index", {
		mode : process.env.NODE_ENV,
		locale : req.i18n.getLocale(),
		appInfos : appInfos,
		isMultiplayerActive : process.env.YUME_MULTIPLAYER
	});
});

module.exports = router;
