var allDocs = require('../../app/controllers/queryAll.server.controller');

module.exports = function(app) {
    app.route('/DiggingIntoData/all').get(allDocs.list);
};