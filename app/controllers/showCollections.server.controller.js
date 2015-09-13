var db = require('mongoose');

exports.listCollections = function(req, res, next) {
	console.log(db)
	db.connection.collectionNames(function(error, names) {
		if (err) {
			return next(err);
		} else {
			req.json(names)
		}
	});
};