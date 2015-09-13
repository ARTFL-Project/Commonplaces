/*eslint-env node, mocha */

"use strict";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

var config = require("./config/config"),
    express = require("./config/express");

var app = express();

app.listen(config.port);

console.log(process.env.NODE_ENV + " server running at http://localhost:" + config.port);
