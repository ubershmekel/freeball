var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var requirejs = require('requirejs');

var server = requirejs('js/server.js');
var types = requirejs('js/types.js');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/viewer.html');
});

app.use('/', express.static('.'));

io.on('connection', function(socket) {
    console.log('a user connected');
    function onTick(data) {
        socket.emit(types.eventTypes.tick, data);
    }

    var gameInstance;
    socket.on(types.eventTypes.startGame, function() {
        gameInstance = server(onTick);
    })
    socket.on(types.eventTypes.command, function(com) {
        if(gameInstance)
            gameInstance.command(com);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

