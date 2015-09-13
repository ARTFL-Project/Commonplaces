/*eslint-env node, mocha */

"use strict";

exports.render = function(req, res) {
    res.render("index", {
        title: "Howdy World"
    });
};
