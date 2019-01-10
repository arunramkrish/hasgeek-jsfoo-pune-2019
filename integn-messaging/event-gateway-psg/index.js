const util = require('util');
const EventEmitter = require('events');

function sendEvent(event) {
    var amqp = require('amqplib/callback_api');

    amqp.connect(event.rabbitmqurl, function (err, conn) {
        conn.createChannel(function (err, ch) {
            var q = event.eventName;

            ch.assertQueue(q, { durable: false });//for email
            ch.sendToQueue(q, new Buffer(JSON.stringify(event)));
            console.log(" [x] Sent %s", event);

           
        });
    });
}

function publishEvent(event) {
    var amqp = require('amqplib/callback_api');

    amqp.connect(event.rabbitmqurl, function (err, conn) {
        conn.createChannel(function (err, ch) {
            var topic = event.eventName;

            ch.assertExchange(topic, 'topic', { durable: false });
            ch.publish(topic, "anonymous.info", new Buffer(JSON.stringify(event)));
            console.log(" [x] Published message %s", event);

            
        });
    });
}

function receiveEvent(eventName,rabbitmqurl, eventListener) {

    var amqp = require('amqplib/callback_api');
    amqp.connect(rabbitmqurl, function (err, conn) {
        conn.createChannel(function (err, ch) {
            var q = eventName;

            ch.assertQueue(q, { durable: false });
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);

            ch.consume(q, function (msg) {

                var data = JSON.parse(msg.content);

                var receivedEvent = {
                    eventName: eventName,
                    message: data
                };
                eventListener(null, receivedEvent);
            }, { noAck: true });

        });
    });
}

function subscribeEvent(eventName,rabbitmqurl, eventListener) {

    var amqp = require('amqplib/callback_api');
    amqp.connect(rabbitmqurl, function (err, conn) {
        conn.createChannel(function (err, ch) {
            var topic = eventName;

            ch.assertExchange(topic, 'topic', { durable: false });
            ch.assertQueue('', { exclusive: true }, function (assErr, q) {
                console.log(" [*] Waiting for messages in topic %s. To exit press CTRL+C", topic);

                ch.bindQueue(q.queue, topic, "anonymous.info");

                ch.consume(q.queue, function (msg) {

                    var data = JSON.parse(msg.content);

                    var receivedEvent = {
                        eventName: eventName,
                        message: data
                    };
                    eventListener(null, receivedEvent);
                }, { noAck: true });

            });

        });
    });
}

var defaultOptions = {
    publishedEvents: [
        {
            eventName: "e1",
            eventType: "p2p",
            eventTarget: "queue1"
        },
        {
            eventName: "e2",
            eventType: "pubSub",
            eventTarget: "topic1"
        }
    ],
    receivedEvents: [
        {
            eventName: "e2",
            eventType: "p2p",
            eventSource: "queue2"
        },
        {
            eventName: "e2",
            eventType: "pubSub",
            eventSource: "topic2"
        }
    ]
};

function GatewayEventEmitter() {
    EventEmitter.call(this);
}
// GatewayEventEmitter.prototype = Object.create(new EventEmitter());
util.inherits(GatewayEventEmitter, EventEmitter);

var gatewayEventEmitter = new GatewayEventEmitter();

/**
 * 
 * @param {*} clientPublisher 
 * @param {*} options  
 */
gatewayEventEmitter.init = function init(clientPublisher, options) {
    var url = options.mqConfig.url;
    //register listener for client events to receive what client is publishing and pass it on to event bus
    if ((clientPublisher) && (options) && (options.publishedEvents) && (options.publishedEvents.length > 0)) {
        options.publishedEvents.forEach(publishedEvent => {
            clientPublisher.on(publishedEvent.eventName, function (eventData) {
                console.log("Received event from client publisher " + eventData);

                if (publishedEvent.eventType === "p2p") {
                    var data = {
                        eventName: publishedEvent.eventName,
                        eventType: "p2p",
                        eventSource: "queue2",
                        message: eventData,
                        rabbitmqurl: url
                    };
                    sendEvent(data);
                } else if (publishedEvent.eventType === "pubSub") {
                    var data = {
                        eventName: publishedEvent.eventName,
                        eventType: "p2p",
                        eventSource: "queue2",
                        message: eventData,
                        rabbitmqurl: url
                    };
                    publishEvent(data);
                }
            });
        });
    }

    if ((options) && (options.receivedEvents) && (options.receivedEvents.length > 0)) {
        options.receivedEvents.forEach(rEvent => {
           
            if (rEvent.eventType === "p2p") {
                receiveEvent(rEvent.eventName,url, function (recErr, recMessageEvent) {
                    if (!recErr) {
                        //take the message and publish the event corresponding to it
                        gatewayEventEmitter.emit(recMessageEvent.eventName, recErr, recMessageEvent);
                    }
                });
            } else if (rEvent.eventType === "pubSub") {
                subscribeEvent(rEvent.eventName,url, function (recErr, recMessageEvent) {
                    if (!recErr) {
                        //take the message and publish the event corresponding to it
                        gatewayEventEmitter.emit(recMessageEvent.eventName, recErr, recMessageEvent);
                    }
                });
            }
        });
    }

}

function clientreceive(clientreceiver, options) {

    //register listeners for event bus to reeive them and pass it on to clients
    //if ((options) && (options.receivedEvents) && (options.receivedEvents.length > 0)) {
    //   options.receivedEvents.forEach(receivedEvents => {

    if ((options) && (options.receivedEvents)) {
        if (options.receivedEvents.eventType === "p2p") {
            //TODO register event listener to rabbit queue
            console.log(options.receivedEvents.message);


            //    gatewayEmitter.emit(options.receivedEvents.eventName, options);
            //

        } else if (publishedEvent.eventType === "pubSub") {
            //TODO publish obtained event to topic
        }
    }
}

module.exports = gatewayEventEmitter;