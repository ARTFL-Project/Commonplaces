var config = require('./config'),
    express = require('express'),
    bodyParser = require('body-parser');


module.exports = function() {
    var app = express();
	
	app.use(bodyParser.urlencoded({
        extended: true
    }));
	
	app.set('views', './app/views');
	app.set('view engine', 'ejs');
	
    require('../app/routes/index.server.routes.js')(app);
	require('../app/routes/queryAll.server.routes.js')(app);
	require('../app/routes/querySome.server.routes.js')(app);
    require('../app/routes/showCollections.server.routes.js')(app);
    
	
	app.use(express.static('./public'));
    return app;
};