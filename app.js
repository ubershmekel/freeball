#!/usr/bin/env node
'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var requirejs = require('requirejs');

// Trying to avoid the following error with `requirejs.config`
// Error: Tried loading "js/matchmaker.js" at js/matchmaker.js then tried node's require("js/matchmaker.js") and it failed with error: Error: Cannot find module 'js/matchmaker.js'
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

http.listen(3000, function(){
    console.log('listening on *:3000');
});

