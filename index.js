const config = require('./config/serverConfig');
const app = require('./config/express');
const logger = require('./config/logger');
const db = require('./config/mongo')
const http = require('http');

if (!module.parent) {
	
    /*let server = app.listen(process.env.PORT || config.port);
    logger.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
    require('./config/socket').configure(app, server);*/
	
	let server = http.createServer(app);
	require('./config/socket').configure(app, server);
	server.listen(process.env.PORT || config.port);
    logger.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
	
}

module.exports = app;
