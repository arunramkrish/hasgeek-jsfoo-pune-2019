var mongodbUtil = require('./MongodDbUtil');
var GridFSBucket = mongodbUtil.getMongodb().GridFSBucket;

function dropAttachment(fileId, callback) {
    var db = mongodbUtil.getDb();
    var grid = new GridFSBucket(db, {
        bucketName: 'fs'
    });
    try {
        grid.delete(mongodbUtil.ObjectID(fileId), function (err, result) {
            if (!err) {
                callback(null, { message: "Deleted Attachment successfully" });
            } else {
                callback(err, null);
            }
        });    
    } catch (e) {
        callback(e, null);
    }
}

function openAttachment(attachmentDetails, res, callback) {
    var db = mongodbUtil.getDb();
    var grid = new GridFSBucket(db, {
        bucketName: 'fs'
    });
    res.set('Content-Type', attachmentDetails.contentType);
    res.set('Content-Disposition', 'attachment; filename="' + encodeURI(attachmentDetails.originalname) + '"');
    grid.openDownloadStream(mongodbUtil.ObjectID(attachmentDetails.id)).pipe(res).on('error', function (error) {
        // res.status(500).send({ name: error.name, message: error.message });
        callback(error, null);
    }).
        on('finish', function () {
            // console.log('done!');
            // callback(null, res);
        });
}

function getAttachmentBuffer(attachmentDetails, callback) {
    var db = mongodbUtil.getDb();
    var grid = new GridFSBucket(db, {
        bucketName: 'fs'
    });
    // res.set('Content-Type', attachmentDetails.contentType);
    // res.set('Content-Disposition', 'attachment; filename="' + encodeURI(attachmentDetails.originalname) + '"');
    grid.openDownloadStream(mongodbUtil.ObjectID(attachmentDetails.id)).on("data", function (contentBuffer) {
        callback(null, contentBuffer)
    }).on('error', function (error) {
        callback(error, null);
    });
}

module.exports.openAttachment = openAttachment;
module.exports.dropAttachment = dropAttachment;
module.exports.getAttachmentBuffer = getAttachmentBuffer;
