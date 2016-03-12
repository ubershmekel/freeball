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

var games = [];
var playersQueue = [];

io.on('connection', function(socket) {
    var player = {
        id: server.generate_id(),
        socket: socket,
        game: null
    };
    
    socket.emit(types.eventTypes.setPlayerId, player.id);
    
    console.log('a user connected: ' + player.id);
    var gameInstance = null;
    socket.on(types.eventTypes.clientRequestGame, function() {
        if(playersQueue.length >= 1) {
            console.log("starting game");
            var player_2 = playersQueue.shift();
            function onEvent(eventName, data) {
                socket.emit(eventName, data);
                player_2.socket.emit(eventName, data);
            }

            var gameInstance = server(onEvent);
            
            player.game = gameInstance;
            player_2.game = gameInstance;
            games.push(gameInstance);
        } else {
            playersQueue.push(player);
        }
    });
    
    socket.on(types.eventTypes.command, function(com) {
        if(gameInstance !== null)
            gameInstance.command(com);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

