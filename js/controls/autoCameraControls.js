if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function(require) {
    var types = require('js/types');
    
    var controls = {};

    controls.autoCameraControls = function ( camera, scene, targetNear, targetFar ) {
        var scope = this;

        var distanceStick = new THREE.Vector3();
        var cameraDistance = 15;
        var cameraHeight = 2;
        var cameraSpeed = 0.001;

        // Note these start out undefined in freeball
        scope.targetFar = targetFar;
        scope.targetNear = targetNear;
        
        scene.add(camera);
        
        // `camera.up` prevents the camera from getting to strange angles and inverting with `lookAt`
        camera.up.set( 0, 0, 1 );
        
        scope.update = function ( delta ) {
            if(scope.targetFar === undefined || scope.targetFar === undefined)
                return;
            // sub(a, b) makes `a - b`, pointing from b -> a
            distanceStick.subVectors(scope.targetNear.position, scope.targetFar.position);
            distanceStick.setLength(cameraDistance);
            distanceStick.add(scope.targetNear.position);
            distanceStick.z += cameraHeight;
            
            if(cameraSpeed) {
                // TODO: make this limit the angular velocity, not linear velocity.
                // At the moment this only triggers after a score.
                // Also the camera inverts when flying directly above the ball.
                distanceStick.sub(camera.position); // the camera displacement vector 
                var dist = distanceStick.length();
                var maxDist = delta * cameraSpeed;
                if(dist > maxDist) {
                    distanceStick.setLength(maxDist);
                }
                distanceStick.add(camera.position);
            }
            
            camera.position.copy(distanceStick);
            camera.lookAt(scope.targetFar.position);
        };
    };
    
    return controls;
});