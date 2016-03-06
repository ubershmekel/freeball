var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var requirejs = require('requirejs');

var game = requirejs('js/server.js');
var types = requirejs('js/types.js');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/viewer.html');
});

app.use('/', express.static('.'));

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on(types.eventTypes.startGame, function() {
        game(function(data) {
            socket.emit(types.eventTypes.tick, data);
        });
    })
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

