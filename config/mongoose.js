var config = require('./config'),
    mongoose = require('mongoose');
var mongooseConnection = mongoose.connect(config.db);

module.exports = function() {
    var db = mongooseConnection;
    require('../app/models/digging.server.model');
    return db;
};
