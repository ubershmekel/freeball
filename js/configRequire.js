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
        three: 'node_modules/three/three',
        cannon: 'node_modules/cannon/build/cannon',
        Stats: 'js/Stats',
        optional: 'js/optional',
        TrackballControls: 'js/TrackballControls',
        socketio: 'socket.io/socket.io'
    }
};