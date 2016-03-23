
if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function(require) {
    var server = require('js/server');
    var types = require('js/types');
    
    var matchmaker = {};
    var games = [];
    var playersQueue = [];
    
    function tryCreateMatch() {
        var i = 0;
        var playersPerGame = 2;
        while(i < playersPerGame && i < playersQueue.length) {
            // TODO: this feels a bit needlessly complicated
            if (!playersQueue[i].socket.connected) {
                playersQueue.splice(i, 1);
                console.log('Kicked disconnected player');
                continue;
            }
            i++;
        }
        if(i == playersPerGame) {
            console.log("starting game");
            var gamePlayers = [];
            gamePlayers.push(playersQueue.shift());
            gamePlayers.push(playersQueue.shift());
            gamePlayers[0].team = 0;
            gamePlayers[1].team = 1;

            function onEvent(eventName, data) {
                gamePlayers[0].socket.emit(eventName, data);
                gamePlayers[1].socket.emit(eventName, data);
            }

            var gameInstance = server(onEvent, gamePlayers);
            gamePlayers.map(function(playa) {
                playa.game = gameInstance;
            });
            games.push(gameInstance);
            return true;
        }
        
        return false;
    };
    
    matchmaker.init = function(http) {
        var io = require('socket.io')(http);
        io.on('connection', function(socket) {
            var player = {
                id: server.generate_id(),
                socket: socket,
                game: null,
                team: null
            };

            socket.emit(types.eventTypes.setPlayerId, player.id);
            
            console.log('a user connected: ' + player.id);
            
            socket.on(types.eventTypes.clientRequestGame, function() {
                playersQueue.push(player);
                var created = tryCreateMatch();
                if(!created)
                    socket.emit(types.eventTypes.toast, "Waiting for another player");
            });
            
            socket.on(types.eventTypes.command, function(com) {
                if(player.game !== null) {
                    com.playerId = player.id;
                    player.game.command(com);
                }
            });
        });
    };
    return matchmaker;
});

