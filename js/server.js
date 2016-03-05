
if (typeof define !== 'function') { var define = require('amdefine')(module) }

var requirejs = require('requirejs');

define(function(require) {
    var startGame = function(tickCallback) {
        var CANNON = require("cannon");
        var ticksPerSecond = 30;
        var msPerFrame = 1000.0 / ticksPerSecond;
        var sPerFrame = 1.0 / ticksPerSecond;
        var maxSubSteps = 3;
        
        console.log('start sim');

        //var CANNON = require("cannon");

        // Setup our world
        var world = new CANNON.World();
        world.gravity.set(0, 0, -9.82); // m/s²

        // Create a sphere
        var radius = 1; // m
        var sphereBody = new CANNON.Body({
            mass: 5, // kg
            position: new CANNON.Vec3(0, 0, 10), // m
            shape: new CANNON.Sphere(radius)
        });
        world.addBody(sphereBody);
        tickCallback({n: ["sphere"]})

        // Create a plane
        var groundBody = new CANNON.Body({
            mass: 0 // mass == 0 makes the body static
        });
        var groundShape = new CANNON.Plane();
        groundBody.addShape(groundShape);
        world.addBody(groundBody);

        // Start the simulation loop
        var lastTime;
        function simloop() {
            //requestAnimationFrame(simloop);
            var time = new Date().getTime();
            if (lastTime !== undefined) {
                var dt = (time - lastTime) / 1000;
                world.step(sPerFrame, dt, maxSubSteps);
            }
            //console.log("Sphere z position: " + sphereBody.position.z);
            lastTime = time;
            var state = {
                p: [sphereBody.position],
                v: [sphereBody.velocity]
            }
            tickCallback(state);
        }

        setInterval(simloop, msPerFrame);
    };
    
    return startGame;
});