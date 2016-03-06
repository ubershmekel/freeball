if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([], function() {
    return {
        bodyTypes: {
            box: "box",
            ball: "ball",
            ground: "ground",
            player: "player"
        },
        eventTypes: {
            startGame: "startGame",
            tick: "tick"
        }
        
    };
});