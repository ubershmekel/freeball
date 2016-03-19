if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([], function() {
    var bodyTypes = {
            box: "box",
            ball: "ball",
            ground: "ground",
            player: "player",
            popper: "popper"
    };
    return {
        bodyTypes: bodyTypes,
        eventTypes: {
            setPlayerId: "setPlayerId",
            clientRequestGame: "clientRequestGame",
            serverStartGame: "serverStartGame",
            tick: "tick",
            command: "command",
            toast: "toast",
            score: "score",
            gameOver: "gameOver"
        },
        player: function(teamI, playerI, radius) {
            this.teamI = teamI;
            this.playerI = playerI;
            this.radius = radius;
            this.type = bodyTypes.player;
        },
        moveCommand: function(moveVec, playerId) {
            this.moveVec = moveVec;
            this.playerId = playerId;
        },
        teamNames: ["Blue", "Red"]
    };
});