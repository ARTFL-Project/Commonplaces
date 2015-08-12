var mergedAlignement = require('mongoose').model('merged_alignment');

exports.list = function(req, res, next) {
    mergedAlignement.find({}, function(err, docs) {
        if (err) {
            return next(err);
        }
        else {
            res.json(docs);
        }
    });
};