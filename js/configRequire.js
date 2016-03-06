// Configure Require.js
var require = {
    // Default load path for js files
    baseUrl: '',
    shim: {
        // --- Use shim to mix together all subcomponents
        'Stats': { exports: 'Stats' },
        'TrackballControls': { deps: ['three'], exports: 'THREE' },
        'cannon': { exports: 'CANNON'}
    },
    paths: {
        // --- start THREE sub-components
        three: 'libs/three.js/three',
        cannon: 'libs/cannon.js/build/cannon',
        Stats: 'js/Stats',
        TrackballControls: 'js/TrackballControls',
        socketio: 'socket.io/socket.io'
    }
};