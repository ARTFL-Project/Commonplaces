var mergedAlignement = require('mongoose');

exports.list = function(req, res, next) {
    if (req.query.model === 'mergedNoFilter') {
		var db = mergedAlignement.model('mergedNoFilter');
	} else if (req.query.model === 'merged_trigrams_two') {
		var db = mergedAlignement.model('merged_trigrams_two');
	} else {
		var db = mergedAlignement.model('merged_alignment');
	}
    db.find({}, function(err, docs) {
        if (err) {
            return next(err);
        }
        else {
            res.json(docs);
        }
    });
};