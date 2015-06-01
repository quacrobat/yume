var express = require("express");
var router = express.Router();

var metadata = require("./../package.json");

router.get("/", function(req, res) {

	// set no-cache for dynamic content
	res.set("Cache-Control", "no-cache");
	
	// render view
	res.render("index", {
		mode : process.env.NODE_ENV,
		locale : req.i18n.getLocale(),
		metadata : metadata
	});
});

module.exports = router;
