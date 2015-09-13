/*eslint-env node, mocha */

"use strict";

module.exports = function(app) {
    var index = require("../controllers/index.server.controller");
    app.get("/DiggingIntoData/", index.render);
};
