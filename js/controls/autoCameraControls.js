if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function(require) {
    var types = require('js/types');
    
    var controls = {};

    controls.autoCameraControls = function ( camera, scene, targetNear, targetFar ) {
        var scope = this;

        var distanceStick = new THREE.Vector3();

        // Note these start out undefined in freeball
        scope.targetFar = targetFar;
        scope.targetNear = targetNear;
        
        scene.add(camera);
        
        // `camera.up` prevents the camera from getting strange angles with `lookAt`
        camera.up.set( 0, 0, 1 );
        
        scope.update = function ( delta ) {
            if(scope.targetFar === undefined || scope.targetFar === undefined)
                return;
            // sub(a, b) makes `a - b`
            distanceStick.subVectors(scope.targetNear.position, scope.targetFar.position);
            distanceStick.setLength(15);
            distanceStick.add(scope.targetNear.position);
            camera.position.copy(distanceStick);
            camera.position.setZ(camera.position.z + 5);
            camera.lookAt(scope.targetFar.position);
        };
    };
    
    return controls;
});