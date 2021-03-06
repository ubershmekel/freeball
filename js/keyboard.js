if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function(require) {
    var keyboard = {};
    keyboard.keysDown = {};
    keyboard.keyUpCallbacks = {};

    keyboard.keyCodes = {
        space: 32,
        left: 37,
        up: 38,
        right: 39,
        down: 40,
        a: 65,
        b: 66,
        c: 67,
        d: 68,
        e: 69,
        f: 70,
        g: 71,
        h: 72,
        i: 73,
        j: 74,
        k: 75,
        l: 76,
        m: 77,
        n: 78,
        o: 79,
        p: 80,
        q: 81,
        r: 82,
        s: 83,
        t: 84,
        u: 85,
        v: 86,
        w: 87,
        x: 88,
        y: 89,
        z: 90,
    }

    keyboard.onKeyDown = function ( event ) {
        keyboard.keysDown[event.keyCode] = true;
    }

    keyboard.onKeyUp = function ( event ) {
        delete keyboard.keysDown[event.keyCode];
        if(keyboard.keyUpCallbacks[event.keyCode]) {
            keyboard.keyUpCallbacks[event.keyCode](event.keyCode);
        }
    }

    keyboard.init = function() {
        document.addEventListener( 'keydown', keyboard.onKeyDown, false );
        document.addEventListener( 'keyup', keyboard.onKeyUp, false );
    }
    
    return keyboard;
});