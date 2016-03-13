var express = require('express');
var app = express();
var http = require('http').Server(app);
var requirejs = require('requirejs');

var matchmaker = requirejs('js/matchmaker.js');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/viewer.html');
});

app.use('/', express.static('.'));


matchmaker.init(http);

http.listen(3000, function(){
    console.log('listening on *:3000');
});

