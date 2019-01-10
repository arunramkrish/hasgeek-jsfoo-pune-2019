var appLogger = require('../logging/appLogger');
var config = require('../config/config.' + process.env.NODE_ENV);
var feeStructureService = require('./feeStructureService');
var studentAdmissionFeesDao = require('../daos/studentAdmissionFeesDao');
var eventGwAdapter = null;
if (config.amqpConfig.amqpEnabled) {
    eventGwAdapter = require('../integration/eventGwAdapter');
}

var moment = require('moment');
var number2Text = require('number2text');

if (eventGwAdapter) {
    eventGwAdapter.on("researchAdmission", function (err, recEventMessage) {
        if (!err && recEventMessage.message) {
            var newStudentRecord = recEventMessage.message;
            feeStructureService.getAdmissionsFeeStructureForStudent(newStudentRecord, "RESEARCH_ADMISSIONS_YEAR_1-2018", function (admErr, admStructRes) {
                copyFeesFields(newStudentRecord, admStructRes);
                delete newStudentRecord._id;
                studentAdmissionFeesDao.create(newStudentRecord, function (err, res) {
                    if (!err) {
                        console.log("Reserarch student added successfully " + res);
                    } else {
                        console.log("Error while adding research student " + res);
                    }
                });
            });
        }
    });    
}

function copyFeesFields(newStudentRecord, admStructRes) {
    Object.keys(admStructRes).forEach(function (key) {
        if (key == "_id") {
            return;
        }
        newStudentRecord[key] = admStructRes[key];
    });
}
