var mergedAlignement = require('mongoose').model('merged_alignment');

exports.some = function(req, res, next) {
	var queryParams = {}
	for (var i in req.query) {
		if (req.query[i]) {
            queryParams[i] = new RegExp('.*' + req.query[i] + '.*', 'i');
        }
	}
    mergedAlignement.find(queryParams, function(err, docs) {
        if (err) {
			console.log(err)
            return next(err);
        }
        else {
            res.json(docs);
        }
    });
};