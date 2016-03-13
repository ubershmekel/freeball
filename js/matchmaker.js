
if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function(require) {
    var server = requirejs('js/server.js');
    var types = requirejs('js/types.js');
    
    var matchmaker = {};
    var games = [];
    var playersQueue = [];
    matchmaker.init = function(http) {
        var io = require('socket.io')(http);
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
    };
    return matchmaker;
});

