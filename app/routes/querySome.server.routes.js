var allDocs = require('../../app/controllers/querySome.server.controller');

module.exports = function(app) {
    app.route('/DiggingIntoData/some*').get(allDocs.some);
};