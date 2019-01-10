var Client = require('node-rest-client').Client;
var config = require('../config/config.' + process.env.NODE_ENV);
var apiConfig = config.apiGatewayConfig;

function searchStudents(authHeader, filterQuery, projection, callback) {
    var client = new Client();
    var remoteUrl = apiConfig["sis"] + "/students/filter";

    // set content-type header and data as json in args parameter 
    var args = {
        data: { criteria: filterQuery, projection: projection },
        headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader
        }
    };
    // direct way 
    client.post(remoteUrl, args, function (data, response) {
        // parsed response body as js object 
        callback(null, data);
    }).on('error', function (e) {
        callback(e, null);
    }).end()
}

module.exports.searchStudents = searchStudents;