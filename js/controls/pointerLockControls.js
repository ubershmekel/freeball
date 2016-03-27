if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function(require) {
    var keyboard = require('js/keyboard');
    var types = require('js/types');
    
    var controls = {};
    var instructions = document.getElementById("instructions");
    
    controls.supportsPointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    controls.requirePointerLock = function(ee) {
        controls.enabled = false;
        instructions.style.display = 'block';
        var element = document.body;
        controls.isPointerLocked = function(){
            return document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element;
        }
        var pointerlockchange = function ( event ) {
            if ( controls.isPointerLocked() ) {

                controls.enabled = true;
                //ee.trigger('unpause'); 

                //blocker.style.display = 'none';
                instructions.style.display = 'none';
            } else {

                controls.enabled = false;
                //ee.trigger('pause'); 

                //blocker.style.display = '-webkit-box';
                //blocker.style.display = '-moz-box';
                //blocker.style.display = 'box';

                instructions.style.display = 'block';

            }

        };

        var pointerlockerror = function ( event ) {
            //instructions.style.display = '';
            humane.error("pointer lock error: " + event);
            console.error(event);
        };

        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

        instructions.addEventListener( 'click', function ( event ) {
            instructions.style.display = 'none';

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

            if ( /Firefox/i.test( navigator.userAgent ) ) {

                var fullscreenchange = function ( event ) {

                    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                        document.removeEventListener( 'fullscreenchange', fullscreenchange );
                        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                        element.requestPointerLock();
                    }

                }

                document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

                element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

                element.requestFullscreen();

            } else {

                element.requestPointerLock();

            }

        }, false );

    };

    controls.pointerLockControls = function ( camera ) {
        this.enabled = true;
        var velocityFactor = 0.6;
        var jumpForce = 200;
        var scope = this;
        var PI_2 = Math.PI / 2;

        var pitchObject = new THREE.Object3D();
        scope.pitchObject = pitchObject;
        //pitchObject.position.y = 2;
        pitchObject.add( camera );
        pitchObject.rotation.y = PI_2;

        var yawObject = new THREE.Object3D();
        scope.object = yawObject;
        yawObject.rotation.z = -PI_2;
        //yawObject.position.y = -4;
        yawObject.add( pitchObject );

        var quat = new THREE.Quaternion();

        //var contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
        //var upAxis = new CANNON.Vec3(0,1,0);
        /*
        cannonBody.addEventListener("collide",function(e){
            var contact = e.contact;

            // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
            // We do not yet know which one is which! Let's check.
            if(contact.bi.id == cannonBody.id)  // bi is the player body, flip the contact normal
                contact.ni.negate(contactNormal);
            else
                contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is

            // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
            if(contactNormal.dot(upAxis) > 0.5) // Use a "good" threshold value between 0 and 1 here!
                canJump = true;
        });
        */

        //var velocity = cannonBody.velocity;


        var onMouseMove = function ( event ) {
            if ( scope.enabled === false ) return;

            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            yawObject.rotation.z -= movementX * 0.002;
            pitchObject.rotation.y -= movementY * 0.002;
            //console.log(pitchObject.rotation.y);
            // limit up/down so you can't break your neck backwards and reverse the yawObject effect
            pitchObject.rotation.y = Math.max( 0, Math.min( Math.PI, pitchObject.rotation.y ) );
            //console.log(movementX, movementY);
        };

        document.addEventListener( 'mousemove', onMouseMove, false );

        this.getObject = function () {
            return yawObject;
        };

        //this.getDirection = function(targetVec){
        //    targetVec.set(0,0,-1);
        //    quat.multiplyVector3(targetVec);
        //}

        // Moves the camera to the Cannon.js object position and adds velocity to the object if the run key is down
        //var inputVelocity = new THREE.Vector3();
        var euler = new THREE.Euler();
        this.update = function ( delta ) {

            if ( scope.enabled === false ) return;

            delta *= 0.1;

            //inputVelocity.set(0,0,0);

            // Convert velocity to world coordinates
            /*euler.x = pitchObject.rotation.x;
            euler.y = yawObject.rotation.y;
            euler.order = "XYZ";*/
            //quat.setFromEuler(euler);
            //inputVelocity.applyQuaternion(quat);
            //quat.multiplyVector3(inputVelocity);

            // Add to the object
            //velocity.x += inputVelocity.x;
            //velocity.z += inputVelocity.z;

            //yawObject.position.copy(cannonBody.position);
            
            //cannonBody.force.x = 0;
            //cannonBody.force.y = 20;
            //cannonBody.force.z = 0;
        };
    };
    
    return controls;
});