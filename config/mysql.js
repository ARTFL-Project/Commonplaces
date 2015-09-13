var mysql = require('mysql2');
var pool  = mysql.createPool({
    connectionLimit : 50,
    host : 'localhost',
    user : 'root',
    password : '***REMOVED***',
    database : 'philologic'
});

exports.getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};