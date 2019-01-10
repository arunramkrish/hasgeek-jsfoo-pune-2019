var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var config = require('../config/config.' + process.env.NODE_ENV);
var mongoConfig = config.dbConfig;
var url = mongoConfig.url;

function connect(callback) {
    MongoClient.connect(url, callback);
};

//Cache the mongodb connection
var dbCache = {};
connect(function (err, db) {
    if (!err) {
        console.log("Connection with mongodb successful");
        dbCache.db = db;
    } else {
        console.log("Error while connecting to Mongo DB " + err);
        dbCache = {};
    }
});

module.exports.getDb = function() {
    return dbCache.db;
}

module.exports.getMongodb = function() {
    return mongodb;    
}

module.exports.connect = connect;

module.exports.ObjectID = mongodb.ObjectID;
