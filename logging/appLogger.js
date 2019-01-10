var bunyan = require('bunyan');
var fs = require('fs');
var path = require('path');
var rfs = require('rotating-file-stream');

var config = require('../config/config.' + process.env.NODE_ENV);
var logConfig = config.logConfig.appLog;
var logDirectory = path.join(__dirname + "/..", 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// create a rotating write stream
var stream = logConfig.streamConfig;
stream.path = path.join(logDirectory, logConfig.streamConfig.fname);

var logger = bunyan.createLogger({
    name: 'appLogger',
    serializers: bunyan.stdSerializers,
    streams: [stream]
});

module.exports = logger;