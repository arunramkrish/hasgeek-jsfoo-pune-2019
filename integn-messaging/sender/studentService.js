var studentDao = require('../daos/studentDao');
var feedbackDao = require('../daos/feedbackDao');
var appLogger = require('../logging/appLogger');
var mailService = require('./mailService');
var smsService = require('./smsService');
var gridfsDao = require('../daos/gridfsDao');
var PdfGeneratorTC = require('./pdfGenerator/transferCertificate')
var exportExcel = require('../utilities/ExportReportToExcel');
var excelNadConfig = require('../config/excelConfigNAD');

var config = require('../config/config.' + process.env.NODE_ENV);
var emailConfig = config.emailConfig;

var studentProfileRules = require('./rules/studentProfileRules');

function getAllStudentlist(callback) {
    studentDao.getAll(callback);
}

function getStudentTCById(rollNumber, callback) {
    var criteria = { rollNumber: rollNumber };
    var fieldsRequired = ["rollNumber", "fullName", "tcNo", "tcDate"];
    filterStudents(criteria, fieldsRequired, function (filterErr, student) {
        if (!filterErr) {
            //delete student[0]["_id"];
            callback(null, student);
        }
        else {
            callback(filterErr, null);
        }
    });
}

function exportTcPdf(tcNos, callback) {
    console.log("tc nos" + JSON.stringify(tcNos));
    studentDao.getByQuery({ "tcDetails.tcNo": { $in: tcNos } }, null, function (err, students) {
        if (!err) {
            callback(null, students);
        }
        else {
            callback(err, null);
        }
    });
}

function issueTC(tcDetailsList, callback) {
    issueTCRecursively(tcDetailsList, 0, [], callback);

    function issueTCRecursively(tcDetailsList, currentIndex, tcNos, callback) {
        if (currentIndex >= tcDetailsList.length) {
            callback(null, tcNos);
            return;
        }

        var tcDetails = tcDetailsList[currentIndex];
        studentDao.issueTC(tcDetails.rollNumber, tcDetails, function (err, res) {
            if (err) {
                //TODO log
                callback(err, null);
                return;
            }
            tcNos.push(res);
            currentIndex++;
            issueTCRecursively(tcDetailsList, currentIndex, tcNos, callback);
        });
    }
}

function createStudent(studentDetails, callback) {
    studentDao.create(studentDetails, callback);
}

function getStudentById(rollNumber, callback) {
    studentDao.getById({ rollNumber: rollNumber }, callback);
}

function rollNumberChange(rollNumber, studentDetails, callback) {
    studentDao.update({ rollNumber: rollNumber }, studentDetails, callback);
}

function updateStudentSection(rollNumber, studentDetails, callback) {
    studentDao.update({ rollNumber: rollNumber }, studentDetails, getCallbackAfterProfileCompleteness(rollNumber, callback));
}

function updateStudentCoreDetails(rollNumber, studentDetails, callback) {
    studentDao.update({ rollNumber: rollNumber }, studentDetails, getCallbackAfterProfileCompleteness(rollNumber, callback));
}

function updateDebar(rollNumber, studentDetails, callback) {
    studentDao.update({ rollNumber: rollNumber }, studentDetails, callback);
}

function updateStatus(rollNumber, detailsToUpdate, detailsToPush, callback) {
    studentDao.updateAndPush({ rollNumber: rollNumber }, detailsToUpdate, detailsToPush, callback);
}

function addSectionItem(updateSectionReq, callback) {
    var rollNumber = updateSectionReq.rollNumber;
    var sectionName = updateSectionReq.sectionName;
    var detailsToUpdate = {};
    detailsToUpdate[sectionName] = updateSectionReq.detailsToUpdate;

    studentDao.updateArrayByQuery({ rollNumber: rollNumber }, detailsToUpdate, getCallbackAfterProfileCompleteness(rollNumber, callback));
}

function deleteSectionItem(rollNumber, sectionName, itemIndex, callback) {
    var criteria = { rollNumber: rollNumber };
    var itemToDelete = {};
    itemToDelete[sectionName] = {
        "itemIndex": itemIndex
    };

    studentDao.removeItemInArrayByQuery(criteria, itemToDelete, getCallbackAfterProfileCompleteness(rollNumber, callback));
}

function updateStudentSectionItem(rollNumber, sectionName, itemIndex, studentRecord, callback) {
    var criteria = { rollNumber: rollNumber };
    criteria[sectionName + ".itemIndex"] = itemIndex;

    var detailsToUpdate = {};
    detailsToUpdate[sectionName + ".$"] = studentRecord[sectionName];

    studentDao.update(criteria, detailsToUpdate, getCallbackAfterProfileCompleteness(rollNumber, callback));
}

/**
 * Called after updating student record with inputs given by user to recalculate and update % complete of student record
 * 
 * @param {*} rollNumber 
 * @param {*} callback 
 */
function getCallbackAfterProfileCompleteness(rollNumber, callback) {
    return fetchAndUpdateProfileCompleteness;

    /**
     * Following function will be called after update of student record.
     * @param {*} err If update was unsuccessful
     * @param {*} response Response of update to student record
     */
    function fetchAndUpdateProfileCompleteness(err, response) {
        if (err) {
            //error occurred while updating student record, so no need to calculate profile completeness
            callback(err, response);
            return;
        }

        //fetch the student record
        getStudentById(rollNumber, function (fetchErr, studentRecord) {
            if (fetchErr) {
                //error while fetching student to calculate profile completeness
                callback(new Error("Update was successful. But not able to calculate profile completeness"), response);
                return;
            }

            //update profile completeness within student record
            studentProfileRules.updateProfileCompleteness(studentRecord);

            //load only those attrs that needs to be updated in student record
            var completeness = { "profilePercentage": studentRecord.profilePercentage, "incompleteFields": studentRecord.incompleteFields };

            //update completeness in database
            studentDao.update({ rollNumber: rollNumber }, completeness, function (updPcntErr, updPcntRes) {
                if (!updPcntErr) {
                    callback(null, completeness);
                } else {
                    callback(new Error("Error while updating percent completeness in student record " + rollNumber), null);
                }
                return;
            });

        });
    }
}


function getStudentByRollNumber(rollNumber, fieldsRequired, callback) {
    var criteria = { rollNumber: rollNumber };
    filterStudents(criteria, fieldsRequired, function (filterErr, students) {
        if (!filterErr) {
            callback(null, students);
        }
        else {
            callback(filterErr, null);
        }
    });
}

function getStudentsDetailsByIdWithProjection(rollNumbers, fieldsRequired, callback) {
    var criteria = { rollNumber: { $in: rollNumbers } };
    filterStudents(criteria, fieldsRequired, function (filterErr, students) {
        if (!filterErr) {
            callback(null, students);
        }
        else {
            callback(filterErr, null);
        }
    });
}

function getTCByIdsWithProjection(groupRollNumbers, callback) {
    var criteria = { rollNumber: { $in: groupRollNumbers } };
    var fieldsRequired = ["rollNumber", "status", "tcDetails.tcReason", "tcDetails.conduct", "studentName", "studentGender", "dobStr", "fatherName", "religion", "branchName", "degreeName", "caste", "community", "studentNationality", "doj"];
    filterStudents(criteria, fieldsRequired, function (filterErr, students) {
        if (!filterErr) {
            //delete student[0]["_id"];
            callback(null, students);
        }
        else {
            callback(filterErr, null);
        }
    });
}


function getStudentDetailsByNameWithProjection(filterQuery, callback) {
    var criteria = filterQuery;
    var fieldsRequired = ["rollNumber", "studentName"];
    filterStudents(criteria, fieldsRequired, function (filterErr, student) {
        if (!filterErr) {
            //delete student[0]["_id"];
            callback(null, student);
        }
        else {
            callback(filterErr, null);
        }
    });
}

function getStudentNationalityById(rollNumber, callback) {
    var criteria = { rollNumber: rollNumber };
    var fieldsRequired = ["rollNumber", "name", "degree", "stream", "nationality"];
    filterStudents(criteria, fieldsRequired, function (filterErr, student) {
        if (!filterErr) {
            //delete student[0]["_id"];
            callback(null, student);
        }
        else {
            callback(filterErr, null);
        }
    });
}

function filterStudents(criteria, projection, callback) {
    Object.keys(criteria).forEach(function (prop) {
        if (prop == "rollNumber" && criteria[prop]["$not"] && criteria[prop]["$not"].startsWith("/")) {
            criteria[prop]["$not"] = new RegExp(criteria[prop]["$not"].substring(1, criteria[prop]["$not"].length - 1));
        }
        if ((criteria[prop]) && (typeof criteria[prop] === "string") && (criteria[prop].startsWith("/"))) {
            criteria[prop] = new RegExp(criteria[prop].substring(1, criteria[prop].length - 1));
        }
    });
    studentDao.getByQuery(criteria, projection, callback);
}

function BOTfilterStudents(criteria, projection, callback) {
    Object.keys(criteria).forEach(function (prop) {
        if ((criteria[prop]) && (typeof criteria[prop] === "string") && (criteria[prop].startsWith("/"))) {
            criteria[prop] = new RegExp(criteria[prop].substring(1, criteria[prop].length - 1));
        }
    });
    studentDao.botDB(criteria, projection, callback);
}

function removeStudent(rollNumber, callback) {
    studentDao.remove(rollNumber, callback);
}

function sendConfCodeToEmail(emailDetails, callback) {
    var mailParams = [emailDetails.code];
    if ((!emailDetails.email) || (emailConfig.mockEmail)) {
        emailDetails.email = (emailConfig.mockEmail) ? emailConfig.mockEmail : "arun@psgsoftwaretechnologies.com";
    }
    appLogger.info("About to send email verification code to %s ", emailDetails.email);
    mailService.sendMail(emailDetails, "emailVerification", mailParams, function (emailError, emailResponse) {
        if (!emailError) {
            appLogger.info("Successfully sent email verification code to user %s. Status code: %s", emailDetails.email, emailResponse.statusCode);
            callback(null, emailDetails.email);
        } else {
            appLogger.error("Error sending email to %s Error Description details %s", emailDetails.email, JSON.stringify(emailError));
            callback(emailDetails.email, null);
        }
    });
}

function sendOTPtoMobile(otpDetails, callback) {
    smsService.sendMessage(otpDetails, callback);
}

function uploadDisplayPicture(rollNumber, displayPicture, callback) {
    studentDao.getById({ rollNumber: rollNumber }, function (err, student) {
        if (!err) {
            var completenessCallback = getCallbackAfterProfileCompleteness(rollNumber, callback);

            if (!student.displayPicture) {
                //displayPicture is being set for the first time
                studentDao.update({ rollNumber: rollNumber }, displayPicture, completenessCallback);
            }
            else {
                //display picture is already present, so delete the picture and reupdate student record
                gridfsDao.dropAttachment(student.displayPicture.id, function (attachErr, attachRes) {
                    if (!attachErr) {
                        studentDao.update({ rollNumber: rollNumber }, displayPicture, completenessCallback);
                    }
                });
            }
        } else {
            callback(err, null);
        }
    });
}

function uploadAttachment(rollNumber, sectionName, index, attachment, callback) {
    studentDao.getById({ rollNumber: rollNumber }, function (err, student) {
        if (!err) {
            if (!student.attachment) {
                studentDao.update({ rollNumber: rollNumber }, sectionName, index, attachment, callback);
            }
            else {
                gridfsDao.dropAttachment(student.attachment.id, function (attachErr, attachRes) {
                    if (!attachErr) {
                        studentDao.update({ rollNumber: rollNumber }, attachment, callback);
                    }
                });
            }
        }
    });
}

function openDisplayPicture(openAttachReq, res) {
    getStudentById(openAttachReq.rollNumber, function (err, student) {
        if (!err) {
            if (!student.displayPicture) {
                // callback(new Error("No display picture exist for given student roll number"), null);
                return;
            }
            var displayPictureDetails = {};
            if (student.displayPicture.originalname == openAttachReq.attachedFileName) {
                displayPictureDetails = student.displayPicture;
            }
            else {
                // callback(new Error("No matching attachments with give name"), null);
                return;
            }

            gridfsDao.openAttachment(displayPictureDetails, res);
        }
    });
}

function getStudentImageAsBuffer(student, callback) {
    if (student.displayPicture) {
        gridfsDao.getAttachmentBuffer(student.displayPicture, callback);
    } else {
        //dont process if no display picture for student
        callback(null, null);
    }
}

function openAttachment(openAttachReq, res) {
    getStudentById(openAttachReq.rollNumber, function (err, student) {
        if (!err) {
            var item;
            if (!student[openAttachReq.sectionName]) {
                // callback(new Error("No display picture exist for given student roll number"), null);
                return;
            }

            var item = student[openAttachReq.sectionName];
            if (student[openAttachReq.sectionName] instanceof Array) {
                for (var i = 0; i < student[openAttachReq.sectionName].length; i++) {
                    var sectionItem = student[openAttachReq.sectionName][i];
                    if (sectionItem.itemIndex == openAttachReq.index) {
                        item = sectionItem;
                        break;
                    }
                }
            }
            if (item) {
                var fileDetails = item[openAttachReq.fieldName].find(function (attachment) {
                    return (attachment.originalname == openAttachReq.fileName);
                });
                if (fileDetails) {
                    gridfsDao.openAttachment(fileDetails, res);
                }
                else {
                    return;
                }
            }
        }
    });
}

function deleteAttachment(deleteReq, callback) {
    getStudentById(deleteReq.rollNumber, function (err, student) {
        if (!err) {
            if (!student.displayPicture) {
                callback(new Error("No display picture exist for given student roll number"), null);
                return;
            }
            var displayPictureDetails = {};
            if (student.displayPicture.originalname == deleteReq.attachedFileName) {
                displayPictureDetails = student.displayPicture;
            }
            else {
                callback(new Error("No matching attachments with give name"), null);
                return;
            }
            studentDao.updateToUnset({ rollNumber: deleteReq.rollNumber, "displayPicture.id": displayPictureDetails.id }, { displayPicture: "" }, function (err, res) {
                if (!err) {
                    //delete attachment from gridfs
                    gridfsDao.dropAttachment(displayPictureDetails.id, function (attachErr, attachRes) {
                        callback(attachErr, attachRes);
                    });
                }
            });
        }
    });

}

function getDistinctValuesFromStudents(keyName, query, callback) {
    studentDao.getDistinctValues(keyName, query, callback)
}

function removeDirtyAttachmentsForStudent(files, callback) {
    var processedFiles = [];
    files.forEach(function (file) {
        gridfsDao.dropAttachment(file.id, function (attachErr, attachRes) {
            if (!attachErr) {
                processedFiles.push(file);
                if (processedFiles.length == files.length) {
                    callback(null, processedFiles);
                }
            }
        });
    })
}

function createStudentRecord(studentRecord, callback) {
    studentDao.create(studentRecord, callback);
}

function updateStudentsByRollNumber(rollNumbers, updateDetails, callback) {
    var query = { rollNumber: { $in: rollNumbers } };
    studentDao.updateMany(query, updateDetails, callback)
}
function getDatatableFromRecords(response) {
    if (!response) {
        return null;
    }

    var dataTable = [];

    response.forEach(function (record) {
        var data = {
            rollNumber: record.rollNumber,
            fullName: record.studentName,
            aadhaar: (record.identity && record.identity.studentAadhaarNumber) ? record.identity.studentAadhaarNumber : "N/A",
            contactNo: (record.studentContactNo) ? record.studentContactNo : "N/A",
            emailId: (record.studentEmail) ? record.studentEmail : "N/A",
            nationality: (record.basic && record.basic.nationality) ? record.basic.nationality : "N/A",
            pwd: (record.basic && record.basic.differentlyAbled) ? "YES" : "NO"
        }
        dataTable.push(data);
    });

    return dataTable;
}
function exportToExcelNAD(callback) {
    studentDao.getByQuery({ "status": { "$in": ["Active"] } }, ["rollNumber", "studentName", "identity.studentAadhaarNumber", "studentContactNo", "basic.nationality", "basic.differentlyAbled", "studentEmail"], function (err, res) {
        if (!err) {
            var dataTable = getDatatableFromRecords(res);
            if (dataTable != null) {
                exportExcel.exportToExcel(dataTable, excelNadConfig, function (err, wb) {
                    if (!err) {
                        callback(null, wb);
                    } else {
                        callback(err, null);
                    }
                });
            }
        }
    })
}

// GETTING STUDENTS FEEDBACKS
function getFeedbacks(callback) {
    feedbackDao.getAll(function (err, res) {
        if (!err) {
            callback(null, res);
        }
        else {
            callback(err, null);
        }
    });
}

function createFeedback(feedback, callback) {
    feedbackDao.create(feedback, function (err, res) {
        if (!err) {
            callback(null, res);
        }
        else {
            callback(err, null);
        }
    });
}

module.exports.exportToExcelNAD = exportToExcelNAD;
module.exports.getStudentsDetailsByIdWithProjection = getStudentsDetailsByIdWithProjection;
// module.exports.getStudentDetailsByIdWithProjection = getStudentDetailsByIdWithProjection;
module.exports.createStudent = createStudent;
module.exports.getAllStudentlist = getAllStudentlist;
module.exports.getStudentById = getStudentById;
module.exports.updateStudentSection = updateStudentSection;
module.exports.updateStudentCoreDetails = updateStudentCoreDetails;
module.exports.removeStudent = removeStudent;
module.exports.filterStudents = filterStudents;
module.exports.BOTfilterStudents = BOTfilterStudents;
module.exports.getStudentNationalityById = getStudentNationalityById;
module.exports.rollNumberChange = rollNumberChange;
module.exports.getStudentTCById = getStudentTCById;
module.exports.sendConfCodeToEmail = sendConfCodeToEmail;
module.exports.sendOTPtoMobile = sendOTPtoMobile;
module.exports.uploadDisplayPicture = uploadDisplayPicture;
module.exports.openDisplayPicture = openDisplayPicture;
module.exports.openAttachment = openAttachment;
module.exports.deleteAttachment = deleteAttachment;
module.exports.getStudentDetailsByNameWithProjection = getStudentDetailsByNameWithProjection;
module.exports.addSectionItem = addSectionItem;
module.exports.updateStudentSectionItem = updateStudentSectionItem;
module.exports.getDistinctValuesFromStudents = getDistinctValuesFromStudents;
module.exports.deleteSectionItem = deleteSectionItem;
module.exports.removeDirtyAttachmentsForStudent = removeDirtyAttachmentsForStudent;
module.exports.updateDebar = updateDebar;
module.exports.getTCByIdsWithProjection = getTCByIdsWithProjection;
module.exports.getStudentByRollNumber = getStudentByRollNumber;
module.exports.getStudentImageAsBuffer = getStudentImageAsBuffer;
module.exports.createStudentRecord = createStudentRecord;
module.exports.issueTC = issueTC;
module.exports.exportTcPdf = exportTcPdf;
module.exports.updateStudentsByRollNumber = updateStudentsByRollNumber;
module.exports.updateStatus = updateStatus;
//FEEDBACK API'S
module.exports.getFeedbacks = getFeedbacks;
module.exports.createFeedback = createFeedback;