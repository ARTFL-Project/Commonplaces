exports.list = function(req, res, next) {
    var pool = req.db;
    pool.getConnection(function(err, connection) {
        console.log('hey', connection)
        connection.query( 'select * from commonlitlangext',  function(err, rows) {
            console.log('hye')
            if (err) {
                return next(err);
            } else {
                console.log( rows );
                res.json(rows)
            }
        });
        
        connection.release();
    });
};