var mergedAlignement = require('mongoose');

exports.some = function(req, res, next) {
	if (req.query.model === 'mergedNoFilter') {
		var db = mergedAlignement.model('mergedNoFilter');
	} else if (req.query.model === 'merged_trigrams_two') {
		var db = mergedAlignement.model('merged_trigrams_two');
	} else {
		var db = mergedAlignement.model('merged_alignment');
	}
	var queryParams = {}
	for (var i in req.query) {
		if (req.query[i] && i !== 'model' && i !== 'page') {
            queryParams[i] = new RegExp(req.query[i], 'i');
        }
	}
	console.log(queryParams)
	var getCount = db.find(queryParams).count();
	getCount.exec(function(countErr, count) {
		if (countErr) {
			console.log(countErr)
            return next(countErr);
		} else {
			if (req.query.page == 1) {
				var q = db.find(queryParams).limit(25);
			} else {
				var skipping = 25 * parseInt(req.query.page) || 25;
				console.log(skipping)
				var q = db.find(queryParams).skip(skipping).limit(25);
			}
			q.exec(function(err, docs) {
				if (err) {
					console.log(err)
					return next(err);
				}
				else {
					res.json({results: docs, count: count})
				}
			});
		}
	});
};
