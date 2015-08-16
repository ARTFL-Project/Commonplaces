var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var mergeAlignment = new Schema({
    sourceauthor : {type : String, default: ''},
    number_of_matches: {type: Number, default: 0},
    sourceauthor: {type: String, default: ''},
    sourcematchsize: {type: String, default: '0'},
    sourcematchcontext: {type: String, default: ''},
    sourcematchdate: {type: String, default: ''},
    id: {type: Number, default: 0},
    target_alignment: {type: Array, default: [],
    _id: {type: Schema.Types.ObjectId}}
});

mongoose.model('merged_alignment', mergeAlignment);
mongoose.model('mergedNoFilter', mergeAlignment);
mongoose.model('merged_trigrams_two', mergeAlignment);