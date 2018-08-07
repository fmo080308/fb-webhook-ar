'use strict';

// Imports dependencies and set up http server

var  express = require('express');
var  bodyParser = require('body-parser');
var  request = require('request');
var  expressWs = require('express-ws');
var  expressWs = expressWs(express());
var  app = expressWs.app;
var socketArray = [];


  
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));

var  aWss = expressWs.getWss('/');

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
	  
      console.log(webhook_event);
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
	
	console.log(socketArray.length);
	var i;
	for(i = 0; i < socketArray.length;i++)
	{
		socketArray[i].send("REPLY");
	}
	
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res, next) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "skyvu_ar";
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
  else console.log('ERROR');
}
);

app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
	ws.send("HELLO BACK");
  });
  console.log("CONNECTED");
  
  socketArray.push(ws);
});

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
