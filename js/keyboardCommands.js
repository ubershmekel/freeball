
if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(['js/keyboard'], function(keyboard) {
    
    keyboard.init();
    
    var keyboardCommands = {};
    var binds = {};
    var names = {
        forward: 'forward',
        back: 'back',
        left: 'left',
        right: 'right',
        fly: 'fly',
        look: 'look',
        dive: 'dive'
    };
    
    binds[keyboard.keyCodes.up] =    names.forward;
    binds[keyboard.keyCodes.w] =     names.forward;
    binds[keyboard.keyCodes.left] =  names.left;
    binds[keyboard.keyCodes.a] =     names.left;
    binds[keyboard.keyCodes.down] =  names.back;
    binds[keyboard.keyCodes.s] =     names.back;
    binds[keyboard.keyCodes.right] = names.right;
    binds[keyboard.keyCodes.d] =     names.right;
    binds[keyboard.keyCodes.space] = names.fly;
    binds[keyboard.keyCodes.e] =     names.fly;
    binds[keyboard.keyCodes.q] =     names.dive;
    binds[keyboard.keyCodes.p] =     names.fly;
    binds[keyboard.keyCodes.l] =     names.dive;
    
    var update = function() {
        var commandsCalled = {};
        Object.keys(keyboard.keysDown).forEach(function(keyCode,index) {
            var bound = binds[keyCode];
            if(bound !== undefined)
                commandsCalled[bound] = true;
        });
        return commandsCalled;
    };
    
    keyboardCommands.update = update;
    keyboardCommands.names = names;
    
    return keyboardCommands;
});