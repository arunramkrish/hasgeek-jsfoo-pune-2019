const EventEmitter = require('events');
const util = require('util');
//var eventGateway = require('../../index');
var  eventGateway=require('event-gateway-psg');
var consumerOptions = {
    publishedEvents: [
        {
            eventName: "logProduct",
            eventType: "pubSub",
            eventTarget: "newProduct"
        }
    ],
    receivedEvents: [
        {
            eventName: "productProduced",
            eventType: "p2p"
            // eventSource: "productProduced"
        }
    ]

};
eventGateway.on("productProduced", function (err, recEventMessage) {
    if (!err) {
        console.log("In consumer: " + JSON.stringify(recEventMessage));
        recEventMessage.eventName = "logProduct";
        logProducer.publishLogMessage(recEventMessage)
    }
});

function LogProducer() {
    EventEmitter.call(this);
}

LogProducer.prototype.publishLogMessage = function produce(message) {
    this.emit("logProduct", message)
    //  this.emit("logProduct2", message)
}



util.inherits(LogProducer, EventEmitter);
var logProducer = new LogProducer();
eventGateway.init(logProducer, consumerOptions);