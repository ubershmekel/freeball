// Configure Require.js
var require = {
    // Default load path for js files
    baseUrl: '',
    shim: {
        // --- Use shim to mix together all subcomponents
        'Stats': { exports: 'Stats' },
        'trackballControls': { deps: ['three'], exports: 'THREE' },
        'cannon': { exports: 'CANNON'}
    },
    paths: {
        // --- start THREE sub-components
        three: 'node_modules/three/three',
        cannon: 'node_modules/cannon/build/cannon',
        Stats: 'js/Stats',
        optional: 'js/optional',
        trackballControls: 'js/controls/trackballControls',
        pointerLockControls: 'js/controls/pointerLockControls',
        autoCameraControls: 'js/controls/autoCameraControls',
        socketio: 'socket.io/socket.io'
    }
};