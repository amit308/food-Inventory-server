var mongoose = require('mongoose');
var util = require('util')
const config = require('./serverConfig');
const logger = require('./logger');
const grid = require('gridfs-stream');

var mongoDB = config.mongoUri;
var mongoDebug = config.mongoDebug;
mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open',()=>{
  const gridFs = grid(db.db, mongoose.mongo);
  gridFs.collection('uploads');
  global.gridFs = gridFs;
  logger.debug("connected to mongo");;
});

if(true){
  mongoose.set('debug', (collectionName, method, query, doc) => {
    logger.log(`MONGO SHELL>>>-- ${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}
module.exports = db;