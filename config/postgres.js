var pg = require('pg');
var conString = "postgres://postgres:***REMOVED***@localhost/philologic";

exports.connect = function(callback) {
    pg.connect(conString, function(err, client, done) {
        callback(err, client, done);
    });
};
