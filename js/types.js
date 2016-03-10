if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([], function() {
    var bodyTypes = {
            box: "box",
            ball: "ball",
            ground: "ground",
            player: "player"
    };
    return {
        bodyTypes: bodyTypes,
        eventTypes: {
            startGame: "startGame",
            tick: "tick",
            command: "command"
        },
        player: function(teamI, playerI, radius) {
            this.teamI = teamI;
            this.playerI = playerI;
            this.radius = radius;
            this.type = bodyTypes.player;
        },
        moveCommand: function(playerId, moveVec) {
            this.playerId = playerId;
            this.moveVec = moveVec;
        }
    };
});