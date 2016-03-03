// Configure Require.js
var require = {
    // Default load path for js files
    baseUrl: '',
    shim: {
        // --- Use shim to mix together all subcomponents
    },
    paths: {
        // --- start THREE sub-components
        three: 'libs/three.js/three',
        socketio: 'socket.io/socket.io'
    }
};