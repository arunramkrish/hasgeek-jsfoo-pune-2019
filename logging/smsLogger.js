var bunyan = require('bunyan');
var fs = require('fs');
var path = require('path');
var RotatingFileStream = require('bunyan-rotating-file-stream');

var config = require('../config/config.' + process.env.NODE_ENV);
var logConfig = config.logConfig.smsLog;
var logDirectory = path.join(__dirname + "/..", 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// create a rotating write stream
logConfig.path = path.join(logDirectory, logConfig.fname);

var logger = bunyan.createLogger({
    name: 'smsLogger',
    streams: [{
        "stream": new RotatingFileStream(logConfig)
    }
    ]
});

module.exports = logger;