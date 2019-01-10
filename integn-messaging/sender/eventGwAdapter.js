const EventEmitter = require('events');
const util = require('util');
var config = require('../config/config.' + process.env.NODE_ENV);

var eventGateway = require('event-gateway-psg');

var pubSubOptions = {
    mqConfig: {
        url: config.amqpConfig.url
    },
    publishedEvents: [
        {
            eventName: "researchAdmission",
            eventType: "pubSub"
        }
    ],
    receivedEvents: [
        {
            eventName: "importEnrollment",
            eventType: "pubSub"
        },
        {
            eventName: "sectionChanged",
            eventType: "pubSub"
        },
        {
            eventName: "droppedOut",
            eventType: "pubSub"
        },
        {
            eventName: "cancelledEnrollment",
            eventType: "pubSub"
        }
    ]
};

eventGateway.on("importEnrollment", function (err, recEventMessage) {
    if (!err) {
        console.log("In eventGwAdapter for importEnrollment: " + JSON.stringify(recEventMessage));
        eventGwAdapter.emit("importEnrollment", err, recEventMessage.message);
    }
});

eventGateway.on("sectionChanged", function (err, recEventMessage) {
    if (!err) {
        console.log("In eventGwAdapter for sectionChanged: " + JSON.stringify(recEventMessage));
        eventGwAdapter.emit("sectionChanged", err, recEventMessage.message);
    }
});

eventGateway.on("droppedOut", function (err, recEventMessage) {
    if (!err) {
        console.log("In eventGwAdapter for droppedOut: " + JSON.stringify(recEventMessage));
        eventGwAdapter.emit("droppedOut", err, recEventMessage.message);
    }
});

eventGateway.on("cancelledEnrollment", function (err, recEventMessage) {
    if (!err) {
        console.log("In eventGwAdapter for cancelledEnrollment: " + JSON.stringify(recEventMessage));
        eventGwAdapter.emit("cancelledEnrollment", err, recEventMessage.message);
    }
});
function fireResearchAdmission(studentRecord) {
    this.emit("researchAdmission", studentRecord);
}
function EventGatewayAdapter() {
    EventEmitter.call(this);
}

// EventGatewayAdapter.prototype.fireImportEnrollment = fireImportEnrollment;
EventGatewayAdapter.prototype.fireResearchAdmission = fireResearchAdmission;

util.inherits(EventGatewayAdapter, EventEmitter);
var eventGwAdapter = new EventGatewayAdapter();

eventGateway.init(eventGwAdapter, pubSubOptions);

module.exports = eventGwAdapter;
