<b>PRE-REQUISITES:</b>

RabbitMQ Server should be installed and Running.

<b>EXPLANATION:</b>

- The module contains a demo folder which has producer, consumer and logger apps.

- The producer app is used to publish an event along with the
data where it  uses the  event emitter for publishing and is
listened by (event-gateway-psg index.js) which sends it to the RabbitMQ server.

- The (event-gateway-psg index.js) is used to receive the event and create an connection with the RabbitMQ server and push the message into the appropriate queue

- The consumer app is used to  Subscribe an event and uses (event-gateway-psg index.js) to receive the event from the RabbitMQ server ,the (event-gateway-psg index.js) after receiving it emits that event to the consumer app via event emitter. 

- The logger app is used to log the published and subcribed events.

- This package can be used for interacting with various modules through RabbitMQ server.

- The producer, consumer and logger app is for understanding and is not part of the package.

- The mqconfig Url should be set to the rabbitMq server Url example("amqp://localhost") 