var request = require('request');
var mainFile = require('./index');
var returnDict = {};
var eventDict = {};
var checkInDict = {};
var checkIn2Dict = {};

module.exports = function (app) {
    //
    // GET /bot
    //
    app.get('/bot', function (request, response) {
        if (request.query['hub.mode'] === 'subscribe' &&
            request.query['hub.verify_token'] === "skyvu_ar") {
            console.log("Validating webhook");
            response.status(200).send(request.query['hub.challenge']);
        } else {
            console.error("Failed validation. Make sure the validation tokens match.");
            response.sendStatus(403);
        }
    });

    app.get('/wake', function (request, response) {
        console.log("WAKE UP!");
    });

    app.get('/notify', function (request, response) {

    });

    //
    // POST /bot
    //
    app.post('/bot', function (request, response) {
        var data = request.body;
        console.log('received bot webhook');
        // Make sure this is a page subscription
        if (data.object === 'page') {
            console.log('data.object : ' + data.object);
            // Iterate over each entry - there may be multiple if batched
            data.entry.forEach(function (entry) {
                var pageID = entry.id;
                var timeOfEvent = entry.time;
                // Iterate over each messaging event
                entry.messaging.forEach(function (event) {
                    if (event.message) {
                        console.log('received Message');
                        receivedMessage(event);
                    } else if (event.game_play) {
                        console.log('received GamePlay');
                        receivedGameplay(event);
                    } else {
                        console.log("Webhook received unknown event: ", event);
                    }
                });
            });
        }
        response.sendStatus(200);
    });

    //
    // Handle messages sent by player directly to the game bot here
    //
    function receivedMessage(event) {
    }

    //
    // Handle game_play (when player closes game) events here.
    //
    function receivedGameplay(event) {
        // Page-scoped ID of the bot user
        var senderId = event.sender.id;

        // FBInstant player ID
        var playerId = event.game_play.player_id;

        // FBInstant context ID
        var contextId = event.game_play.context_id;

        // Check for payload
        if (event.game_play.payload) {
            //
            // The variable payload here contains data set by
            // FBInstant.setSessionData()
            //
            var payload = JSON.parse(event.game_play.payload);

            // In this example, the bot is just "echoing" the message received
            // immediately. In your game, you'll want to delay the bot messages
            // to remind the user to play 1, 3, 7 days after game play, for example.
            sendMessage(senderId, null, "Message to game client: '" + payload.message + "'", "Play now!", payload, null);
        }
        else {
            console.log(mainFile.RETURN().content + " : " + mainFile.RETURN().title + " : " + mainFile.RETURN().url);
            console.log(mainFile.CHECKIN().content + " : " + mainFile.CHECKIN().title + " : " + mainFile.CHECKIN().url);
            //sendMessageReturn(senderId, null, mainFile.RETURN().content, mainFile.RETURN().title, null, mainFile.RETURN().url);
            sendMessageCheckIn(senderId, null, mainFile.CHECKIN().content[0], mainFile.CHECKIN().title[0], null, mainFile.CHECKIN().url);
            sendMessageCheckIn5Days(senderId, null, mainFile.CHECKIN().content[1], mainFile.CHECKIN().title[1], null, mainFile.CHECKIN().url);
            //sendMessageEvent(senderId, null, mainFile.EVENT().content, mainFile.EVENT().title, null, mainFile.EVENT().url);
        }
    }

    //
    // Send bot message
    //
    // player (string) : Page-scoped ID of the message recipient
    // context (string): FBInstant context ID. Opens the bot message in a specific context
    // message (string): Message text
    // cta (string): Button text
    // payload (object): Custom data that will be sent to game session
    //
    function sendMessageReturn(player, context, message, cta, payload, image) {
        var button = {
            type: "game_play"
        };

        if (context) {
            button.context = context;
        }
        if (payload) {
            button.payload = JSON.stringify(payload)
        }
        var messageData = {
            recipient: {
                id: player
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "media",
                        text: cta,
                        elements: [
                            {
                                media_type: "image",
                                url: image,
                                buttons: [button]
                            }
                        ]
                    }
                }
            }
        };

        if (returnDict[player] === null || returnDict[player] === undefined) {
            console.log("RETURN NOTIFICATION TIMER SET : " + player);
        }
        else {
            clearTimeout(returnDict[player]);
            console.log("RETURN NOTIFICATION TIMER RESET : " + player);
        }
        returnDict[player] = SetTimer(mainFile.RETURN().loopTime, messageData, player, true);
    }

    function sendMessageCheckIn(player, context, message, cta, payload, image) {
        var button = {
            type: "game_play",
            title: "PLAY NOW"
        };

        if (context) {
            button.context = context;
        }
        if (payload) {
            button.payload = JSON.stringify(payload)
        }
        var messageData = {
            recipient: {
                id: player
            },
            
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [
                            {
                                title: cta,
                                image_url: image,
                                buttons: [button]
                            }
                        ]
                    }
                }
            }
        };

        if (checkInDict[player] === null || checkInDict[player] === undefined) {
            checkInDict[player] = SetTimer(mainFile.CHECKIN().loopTime, messageData, player, false);
            console.log("CHECKIN QUEUED SET : " + player);
        }
        else {
            console.log("ALREADY QUEUED CHECKIN : " + player);
        }

        ////////checkInDict[player] = SetTimer(mainFile.CHECKIN().loopTime, messageData, player, false);
    }

    function sendMessageCheckIn5Days(player, context, message, cta, payload, image) {
        var button = {
            type: "game_play",
            title : "PLAY NOW"
        };

        if (context) {
            button.context = context;
        }
        if (payload) {
            button.payload = JSON.stringify(payload)
        }
        var messageData = {
            recipient: {
                id: player
            },
           
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [
                            {
                                title: cta,
                                image_url: image,
                                buttons: [button]
                            }
                        ]
                    }
                }
            }
        };

        if (checkIn2Dict[player] === null || checkIn2Dict[player] === undefined) {
            checkIn2Dict[player] = SetTimer(mainFile.CHECKIN().loopTime*2, messageData, player, false);
            console.log("CHECKIN QUEUED 5 DAYS SET : " + player);
        }
        else {
            console.log("ALREADY QUEUED CHECKIN 5 DAYS : " + player);
        }

        //checkInDict[player] = SetTimer(mainFile.CHECKIN().loopTime * 2, messageData, player, false);
    }

    function SetTimer(time, messageData, player, loop) {
        var timer = setTimeout(function () {
            var graphApiUrl = 'https://graph.facebook.com/me/messages?access_token=EAAGqhR4rBPABAGSBZCeAABi2NgBwRz2Cti3ECRkRETsrAWKHRnw6ZB7wZCX9j4UFjZBL2EmWJcsc3yZCtrygNb3sF5qtFCvja91DPvrY9u7OXtjnPVbxccloXMjnOejk9SwjSyEy2NKbqhZCa1wPQ13k24IvFcmQU6XeidbtLKZBgZDZD'
            request({
                url: graphApiUrl,
                method: "POST",
                json: true,
                body: messageData
            }, function (error, response, body) {
                //if (error !== null)
                //    console.error('send api returned', 'error', error, 'status code', response.statusCode, 'body', body);
                //else
                //    console.log(response + " : " + body);

                console.error('send api returned', 'error', error, 'status code', response.statusCode, 'body', body);
            });

            if (loop) {
                returnDict[player] = SetTimer(mainFile.RETURN().loopTime * 3, messageData, player, true);
            }
        }, time);

        return timer;
    }
}