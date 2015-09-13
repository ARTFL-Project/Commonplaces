/*eslint-env node, mocha */

"use strict";

module.exports = function(app) {
	app.route("/DiggingIntoData/query*").get(function(req, res) {
		res.render("index");
	});
};
