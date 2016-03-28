#!/usr/bin/env node
'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var requirejs = require('requirejs');
var os = require('os');

// `requirejs.config` required to avoid the following error when running from a global npm install.
// Error: Tried loading "js/matchmaker.js" at js/matchmaker.js
// Tried node's require("js/matchmaker.js") and it failed with error: Error: Cannot find module 'js/matchmaker.js'
requirejs.config({
    baseUrl: __dirname,
    nodeRequire: require
});

var matchmaker = requirejs('js/matchmaker');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use('/', express.static(__dirname));


matchmaker.init(http);

var port = 3000;
http.listen(port, function(){
    console.log('listening on *:' + port);
    var url = "http://" + os.hostname() + ":" + port;
    console.log('Invite a friend to play: ' + url);
});

