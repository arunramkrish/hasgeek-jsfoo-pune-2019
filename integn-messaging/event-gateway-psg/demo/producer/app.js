const util = require('util');
const EventEmitter = require('events');
//var eventGateway = require('../../index');
var eventGateway=require('event-gateway-psg');
function Producer() {
    EventEmitter.call(this);

    var callbackFn = function () {
        this.produce({
            productDescription: "Product 1"
        });
    };

    var timerCallback = callbackFn.bind(this);

    setTimeout(function () {
        process.nextTick(timerCallback);
    }, 10000);
}

Producer.prototype.produce = function produce(product) {
    this.emit("productProduced", product)
}

util.inherits(Producer, EventEmitter);

var producerOptions = {
    publishedEvents: [
        {
            eventName: "productProduced", //event name is used as queue name or topic name
            eventType: "p2p"
           // eventSource: "productProduced"
        }
    ]
};

var producer = new Producer();

eventGateway.init(producer, producerOptions);

module.exports = producer;