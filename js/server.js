
if (typeof define !== 'function') { var define = require('amdefine')(module) }

var requirejs = require('requirejs');

define(function(require) {
    var bodyTypes = require("js/types").bodyTypes;
    
    var packetMembers = {
        position: "p",
        velocities: "v",
        bodyTypes: "bodyTypes",
        packetMembers: "packetMembers"
    };
    
    function generate_id() {
        var symbols = 'abcdefghijklmnopqrstuvwxyz1234567890';
        var chars = [];

        for(var i = 0; i < 10; i++) {
            chars.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
        return chars.join('');
    }
    
    function cannonToThreeVec(vec) {
        return [vec.x, vec.y, vec.z];
    }
    
    var startGame = function(tickCallback) {
        var CANNON = require("cannon");
        
        var ticksPerSecond = 50;
        var msPerFrame = 1000.0 / ticksPerSecond;
        var sPerFrame = 1.0 / ticksPerSecond;
        var maxSubSteps = 3;
        
        console.log('start sim');
        
        var game = {};
        game.id = generate_id();
        
        // Setup our world
        var world = new CANNON.World();
        game.newBodiesThisTick = [];
        game.newObj = function(body, typ) {
            // notify the client something is added to the world
            game.newBodiesThisTick.push(typ);
            world.addBody(body);
        };
        game.world = world;
        world.gravity.set(0, 0, -9.82); // m/s²

        var physicsMaterial = new CANNON.Material("slipperyMaterial");
        var contactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 0.1, restitution: 0.8 });
        world.addContactMaterial(contactMaterial);
        
        var createPlayer = function(teamI, playerI) {
            // Create a sphere
            var radius = 1; // m
            var x = playerI * 10;
            var y = teamI * 100 - 50;
            var sphereBody = new CANNON.Body({
                mass: 5, // kg
                position: new CANNON.Vec3(x, y, 50), // m
                shape: new CANNON.Sphere(radius),
                material: physicsMaterial
            });
            game.newObj(sphereBody, bodyTypes.ball);
        }
        
        var teamSizes = [1, 1];
        for(var teamI = 0; teamI < teamSizes.length; teamI++) {
            var playerCount = teamSizes[teamI];
            for(var playerI = 0; playerI < playerCount; playerI++) {
                createPlayer(teamI, playerI);
            }
        }

        // Create a plane
        var groundBody = new CANNON.Body({
            mass: 0, // mass == 0 makes the body static
            material: physicsMaterial
        });
        var groundShape = new CANNON.Plane();
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,0,1),-Math.PI/2);
        groundBody.addShape(groundShape);
        game.newObj(groundBody, bodyTypes.ground);

        // Start the simulation loop
        var lastTime = new Date().getTime();
        function simloop() {
            //requestAnimationFrame(simloop);
            var time = new Date().getTime();
            var dt = (time - lastTime) / 1000;
            //world.step(sPerFrame, dt, maxSubSteps);
            //world.step(sPerFrame);
            world.step(dt);
            //console.log("Sphere z position: " + sphereBody.position.z);
            lastTime = time;
            var positions = [];
            var velocities = [];
            for(var i = 0; i < world.bodies.length; i++) {
                positions.push(cannonToThreeVec(world.bodies[i].position));
                velocities.push(cannonToThreeVec(world.bodies[i].velocity));
            }
            var state = {
                p: positions,
                v: velocities
            }
            if(game.newBodiesThisTick.length > 0) {
                state.n = game.newBodiesThisTick;
                game.newBodiesThisTick = [];
            }
            tickCallback(state);
            setTimeout(simloop, msPerFrame);
        }

        setTimeout(simloop, msPerFrame);
    };
    
    return startGame;
});