
if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function(require) {
    var CANNON = require("cannon");
    var types = require("js/types");
    var bodyTypes = types.bodyTypes;
    
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
    
    var startGame = function(eventCallback, playersArray) {
        var ticksPerSecond = 50;
        var msPerFrame = 1000.0 / ticksPerSecond;
        var sPerFrame = 1.0 / ticksPerSecond;
        var maxSubSteps = 3;
        var commands = {};
        var world = new CANNON.World();
        // TODO: Why does normal `g` not work here? It looks sluggish... 
        world.gravity.set(0, 0, -19.82); // m/s²
        var physicsMaterial = new CANNON.Material("slipperyMaterial");
        var contactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 0.1, restitution: 0.8 });
        world.addContactMaterial(contactMaterial);
        
        var game = {};
        game.world = world;
        game.id = generate_id();
        var newBodiesThisTick = [];
        
        var newCommands = [];
        game.command = function(command) {
            newCommands.push(command);
        };
        
        // Setup our world
        function newBody(body, typ) {
            // notify the client something is added to the world
            newBodiesThisTick.push(typ);
            world.addBody(body);
        };
        
        function createBall() {
            var radius = 3; // m
            var sphereBody = new CANNON.Body({
                mass: 2, // kg
                position: new CANNON.Vec3(0, 0, 50), // m
                shape: new CANNON.Sphere(radius),
                material: physicsMaterial
            });
            newBody(sphereBody, {type: bodyTypes.ball});
        }
        
        var playerBodies = {};
            // Create a sphere
        function createPlayer(player) {
            var radius = 1; // m
            var x = 0; //playerI * 10;
            var y = player.team * 100 - 50;
            var sphereBody = new CANNON.Body({
                mass: 5, // kg
                position: new CANNON.Vec3(x, y, 5), // m
                shape: new CANNON.Sphere(radius),
                material: physicsMaterial
            });
            //var playerId = '' + teamI + '-' + playerI;
            var typeInfo = {
                type: bodyTypes.player,
                radius: radius,
                teamI: player.team,
                //playerI: playerI,
                id: player.id
            };
            newBody(sphereBody, typeInfo);
            playerBodies[player.id] = sphereBody;
        }
        
        function createAllPlayers() {
            playersArray.map(function(playa) {
                createPlayer(playa);
            });
            /*var teamSizes = [1, 1];
            for(var teamI = 0; teamI < teamSizes.length; teamI++) {
                var playerCount = teamSizes[teamI];
                for(var playerI = 0; playerI < playerCount; playerI++) {
                    createPlayer(teamI, playerI);
                }
            }*/
        };
        
        function createGround() {
            var groundBody = new CANNON.Body({
                mass: 0, // mass == 0 makes the body static
                material: physicsMaterial
            });
            var groundShape = new CANNON.Plane();
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,0,1), -Math.PI/2);
            groundBody.addShape(groundShape);
            newBody(groundBody, {type: bodyTypes.ground});
        };

        function handleCommands() {
            for(var i = 0; i < newCommands.length; i++) {
                var com = newCommands[i];
                try {
                    //console.log(body);
                    // TODO: better error handling
                    //console.log(vec);
                    //console.log(body.velocity);
                    //body.velocity.copy(com.moveVec);
                    //body.velocity.normalize();
                    //body.velocity = body.velocity.scale(100);
                    var body = playerBodies[com.playerId];
                    //var modify = body.force;
                    var modify = body.velocity;
                    //body.velocity.copy(com.moveVec);
                    var v = com.moveVec;
                    body.velocity.set(v.x, v.y, v.z);
                    body.velocity.normalize();
                    body.velocity = body.velocity.scale(15);
                    //body.velocity = body.force.scale(100);
                    //console.log(body.velocity);
                } catch(e) {
                     console.warn('Bad command: ' + e);
                }
            }
            newCommands = [];
        }

        function reportState() {
            var positions = [];
            var velocities = [];
            for(var i = 0; i < world.bodies.length; i++) {
                positions.push(cannonToThreeVec(world.bodies[i].position));
                velocities.push(cannonToThreeVec(world.bodies[i].velocity));
            }
            var state = {
                p: positions,
                v: velocities,
                t: tick
            }
            if(newBodiesThisTick.length > 0) {
                state.n = newBodiesThisTick;
                newBodiesThisTick = [];
            }
            eventCallback(types.eventTypes.tick, state);
        };

        // Start the simulation loop
        var lastTimeMs = new Date().getTime();
        var tick = -1;
        function simloop() {
            tick++;
            var timeMs = new Date().getTime();
            var dtSeconds = (timeMs - lastTimeMs) / 1000;
            
            handleCommands();
            
            //world.step(sPerFrame, dtSeconds, maxSubSteps);
            //world.step(sPerFrame);
            world.step(dtSeconds);
            //console.log("Sphere z position: " + sphereBody.position.z);
            lastTimeMs = timeMs;
            
            reportState();
            setTimeout(simloop, msPerFrame);
        };
        
        function notifyPlayersGameStarted() {
            var playerIds = playersArray.map(function(value) { return value.id });
            eventCallback(types.eventTypes.serverStartGame, playerIds);
        }

        function main() {
            console.log('start sim');
            createGround();
            createBall();
            createAllPlayers();
            notifyPlayersGameStarted();
            setTimeout(simloop, msPerFrame);
        }
        
        main();
        return game;
    };
    
    startGame.generate_id = generate_id;
    
    return startGame;
});