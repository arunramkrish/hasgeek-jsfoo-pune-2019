var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var rfs = require('rotating-file-stream');

var config = require('../config/config.' + process.env.NODE_ENV);
var logConfig = config.logConfig.httpRequestLog;
var logDirectory = path.join(__dirname + "/..", 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// create a rotating write stream
var options = logConfig.rfsOptions;
options.path = logDirectory;
var logStream = rfs(logConfig.fname, options);

var logger = morgan(logConfig.format, {stream:logStream});

module.exports = logger;