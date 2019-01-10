const EventEmitter = require('events');
const util = require('util');
var config = require('../config/config.' + process.env.NODE_ENV);

var eventGateway = require('event-gateway-psg');

var pubSubOptions = {
    mqConfig: {
        url: config.amqpConfig.url
    },
    receivedEvents: [
        {
            eventName: "researchAdmission",
            eventType: "pubSub"
        }
    ]
};

eventGateway.on("researchAdmission", function (err, recEventMessage) {
    if (!err) {
        console.log("In eventGwAdapter for researchAdmission: " + JSON.stringify(recEventMessage));
        eventGwAdapter.emit("researchAdmission", err, recEventMessage.message);
    }
});

function EventGatewayAdapter() {
    EventEmitter.call(this);
}

util.inherits(EventGatewayAdapter, EventEmitter);
var eventGwAdapter = new EventGatewayAdapter();

eventGateway.init(eventGwAdapter, pubSubOptions);

module.exports = eventGwAdapter;
