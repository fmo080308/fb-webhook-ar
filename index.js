var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(cors());

var RETURN_NEWS = {
    title : "",
    content : "",
    url : "",
    loopTime : 100000
};

var EVENT_NEWS = {
    title : "",
    content : "",
    url : "",
    loopTime : 100000
};

var CHECKIN_NEWS = {
    title : "",
    content : "",
    url : "",
    loopTime : 100000
};

var http = require("http");

function RETURN() {
    return RETURN_NEWS;
}

function EVENT() {
    return EVENT_NEWS;
}

function CHECKIN() {
    return CHECKIN_NEWS;
}

module.exports.RETURN = RETURN;
module.exports.EVENT = EVENT;
module.exports.CHECKIN = CHECKIN;

var PlayFab = require("playfab-sdk");

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
    LoginWithCustomID();

    setInterval(function () {
        http.get("http://fb-webhook-ar.herokuapp.com/wake");
    }, 300000); // every 5 minutes (300000)
});

function LoginWithCustomID() {
    var loginRequest = {
        // Currently, you need to look up the correct format for this object in the API-docs:
        // https://api.playfab.com/Documentation/Client/method/LoginWithCustomID
        TitleId: PlayFab.settings.titleId,
        CustomId: "#ServerBackend#",
        CreateAccount: true
    };

    PlayFab.PlayFabClient.LoginWithCustomID(loginRequest, LoginCallback);
}

function LoginCallback(error, result) {
    if (result !== null) {
        console.log("Logged in!");

        setInterval(function () {
            var newsRequest = {
                Count: 5
            }

            PlayFab.PlayFabClient.GetTitleNews(newsRequest, GetNewsCallback);
        }, 10000);
    } else if (error !== null) {
        console.log("Something went wrong with your first API call.");
        console.log("Here's some debug information:");
        console.log(CompileErrorReport(error));
    }
}

function GetNewsCallback(error, result) {
    if (result !== null) {
        var data = "";
        for (var keyPair in result.data.News) {
            console.log(keyPair.Body);
            data = JSON.parse(keyPair.Body + "");
            if (JSON.parse(keyPair.Body + "").type === "RETURN") {
                RETURN_NEWS.title = data.title;
                RETURN_NEWS.content = data.content;
                RETURN_NEWS.url = data.url;
                RETURN_NEWS.loopTime = data.loopTime;
            }
            else if (JSON.parse(keyPair.Body + "").type === "EVENT") {
                EVENT_NEWS.title = data.title;
                EVENT_NEWS.content = data.content;
                EVENT_NEWS.url = data.url;
                EVENT_NEWS.loopTime = data.loopTime;
            }
            else if (JSON.parse(keyPair.Body + "").type === "CHECKIN") {
                CHECKIN_NEWS.title = data.title;
                CHECKIN_NEWS.content = data.content;
                CHECKIN_NEWS.url = data.url;
                CHECKIN_NEWS.loopTime = data.loopTime;
            }
        }

        console.log("Updated");
    } else if (error !== null) {
        console.log("Something went wrong with your first API call.");
        console.log("Here's some debug information:");
        console.log(CompileErrorReport(error));
    }
}

// This is a utility function we haven't put into the core SDK yet.  Feel free to use it.
function CompileErrorReport(error) {
    if (error == null)
        return "";
    var fullErrors = error.errorMessage;
    for (var paramName in error.errorDetails)
        for (var msgIdx in error.errorDetails[paramName])
            fullErrors += "\n" + paramName + ": " + error.errorDetails[paramName][msgIdx];
    return fullErrors;
}

require('./matches.js')(app);
require('./bot.js')(app);