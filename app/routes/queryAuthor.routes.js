var query = require('../../app/controllers/queryAuthor.controller');

module.exports = function(app) {
    app.route('/DiggingIntoData/author').get(query.author);
};