var eventGateway = require('../../index');

var loggerOptions = {
    receivedEvents: [
        {
            eventName: "logProduct2",
            eventType: "pubSub",
            eventTarget: "newProduct"
        }
    ]    
};

eventGateway.on("logProduct2", function(err, recEventMessage) {
    if (!err) {
        console.log("Received by Logger 2:" + JSON.stringify(recEventMessage));
    }
});

eventGateway.init(null, loggerOptions);