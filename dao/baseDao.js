var mongodb = require('./MongodDbUtil');

function create(record, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.insert(record, function (err, result) {
        if (!err) {
            callback(null, result.ops[0]);
        } else {
            callback(err, null);
        }
    });
}

function createMany(records, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.insertMany(records, function (err, result) {
        if (!err) {
            callback(null, result.ops[0]);
        } else {
            callback(err, null);
        }
    });
}

function getAll(callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.find({}).toArray(function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });
}

function getById(query, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.findOne({_id:mongodb.ObjectID(query)}, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function getOneByQuery(query, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.findOne(query, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function getByQuery(query, projection, callback) {
    if (typeof projection == "function") {
        callback = projection;
        projection = null;
    }
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());

    var cursor;
    if (projection) {
        var projectionObj = {};
        projection.forEach(function(p) {
            projectionObj[p] = 1;
        });
        cursor = coll.find(query, projectionObj);
    } else {
        cursor = coll.find(query);
        
    }
    
    cursor.toArray(function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function getAndSortByQuery(query, projection, sortCriteria, callback) {
    if (typeof projection == "function") {
        callback = projection;
        projection = null;
    }
    if (typeof sortCriteria == "function") {
        callback = sortCriteria;
        sortCriteria = null;
    }

    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());

    var cursor;
    if (projection) {
        var projectionObj = {};
        projection.forEach(function (p) {
            projectionObj[p] = 1;
        });
        cursor = coll.find(query, projectionObj);
    } else {
        cursor = coll.find(query);

    }

    if (sortCriteria) {
        cursor.sort(sortCriteria);
    }

    cursor.toArray(function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function update(id, detailsToUpdate, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.update({_id:mongodb.ObjectID(id)}, { $set: detailsToUpdate }, {multi:false}, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function updateToSetQuery(query, detailsToUpdate, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.update(query, { $set: detailsToUpdate }, {multi:false}, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function updateToUnset(query, detailsToUpdate, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.update(query, { $unset: detailsToUpdate }, {multi:false}, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function updateArrayById(id, elementsToPush, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());

    coll.update({_id: mongodb.ObjectID(id)}, { $push: elementsToPush }, { multi: false }, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });
}


function updateArrayByQuery(query, elementsToPush, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());

    coll.update(query, { $push: elementsToPush }, { multi: false }, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });
}

function removeItemInArrayByQuery(query, elementToDelete, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());

    coll.update(query, { $pull: elementToDelete }, { multi: false }, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });
}

function updateById(id, detailsToUpdate, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());

    var deletedId;
    if (detailsToUpdate._id) {
        deletedId = detailsToUpdate._id;
        delete detailsToUpdate._id;
    }

    coll.update({_id: mongodb.ObjectID(id)}, { $set: detailsToUpdate }, {multi:false}, function (err, result) {
        if (deletedId) {
            detailsToUpdate._id = deletedId;
        }
        
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function updateMany(query, detailsToUpdate, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.updateMany(query, { $set: detailsToUpdate }, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });

}

function remove(id, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.remove({_id: mongodb.ObjectID(id)} , function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });
}

function removeByQuery(query, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.remove(query, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });
}

function getMongoDb() {
    return mongodb;
}

function bulkWrite(bulk, callback) {
    var db = mongodb.getDb();

    var coll = db.collection(this.getCollectionName());

    coll.bulkWrite(bulk, function (err, result) {
        if (!err) {
            callback(null, result);
        } else {
            callback(err, null);
        }
    });    
};

function getDb() {
    return monogdb.getDb();
}

function distinctByQuery(field, query, callback){
    if (typeof query == "function") {
        callback = query;
        query = null;
    }
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    if(!query)
        query = {};
    coll.distinct(field, query, function(err, result){
        if(!err){
            callback(null,result);
        } else {
            callback(err, null);
        }
    });
}

function getMaxValue(fieldName, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    coll.aggregate([{$group:{_id: null, max:{"$max": "$" + fieldName}}}], function(err, result){
        if(!err){
            callback(null,result);
        } else {
            callback(err, null);
        }
    })
}

function getDistinctOrderByQuery(filterQuery, fieldsForDistinctAndSort, sortCriteria, callback) {
    var db = mongodb.getDb();
    var coll = db.collection(this.getCollectionName());
    var pathways = [];
    
    pathways.push({"$match": filterQuery});

    var grouping = {};
    fieldsForDistinctAndSort.forEach(function(field) {
        grouping[field] = "$" + field;
    });
    pathways.push({"$group": {_id: grouping}});

    if (sortCriteria) {
        var sorting = {};
        Object.keys(sortCriteria).forEach(function(sortField) {
            sorting["_id." + sortField] = sortCriteria[sortField];
        });
        pathways.push({"$sort": sorting});
    }
    coll.aggregate(pathways).toArray(callback);
}

function getIdFilter(entity) {
    return { _id: mongodb.ObjectID(entity._id) };
}

module.exports = function BaseDao(collectionName) {
    return {
        create: create,
        createMany: createMany,
        getAll: getAll,
        getById: getById,
        getIdFilter: getIdFilter,
        getByQuery: getByQuery,
        getOneByQuery: getOneByQuery,
        getAndSortByQuery: getAndSortByQuery,
        distinctByQuery: distinctByQuery,
        getDistinctOrderByQuery: getDistinctOrderByQuery,
        update: update,
        updateById: updateById,
        updateMany: updateMany,
        updateToSetQuery:updateToSetQuery,
        updateToUnset: updateToUnset,
        updateArrayById: updateArrayById,
        updateArrayByQuery: updateArrayByQuery,
        removeItemInArrayByQuery: removeItemInArrayByQuery,
        remove: remove,
        removeByQuery: removeByQuery,
        bulkWrite: bulkWrite,
        getMaxValue: getMaxValue,
        getDb : getDb,
        getCollectionName: function () {
            return collectionName;
        }
    };
};