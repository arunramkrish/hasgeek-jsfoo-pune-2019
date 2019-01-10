//var eventGateway = require('../../index');
var eventGateway=require('event-gateway-psg');
var loggerOptions = {
    receivedEvents: [
        {
            eventName: "logProduct",
            eventType: "pubSub",
            eventTarget: "newProduct"
        }
    ]    
};

eventGateway.on("logProduct", function(err, recEventMessage) {
    if (!err) {
        console.log("Received by Logger 1:" + JSON.stringify(recEventMessage));
    }
});

eventGateway.init(null, loggerOptions);