var collections = require('../../app/controllers/showCollections.server.controller');

module.exports = function(app) {
    app.route('/DiggingIntoData/showCollections').get(collections.listCollections);
};