
if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(function(require) {
    var CANNON = require("cannon");
    var types = require("js/types");
    var bodyTypes = types.bodyTypes;
    var ballRadius = 6;
    var endGameScore = 2;
    
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
        var scores = {};
        var isGameOver = false;
        var playerStartPos = [
            new CANNON.Vec3(0, -50, 5),
            new CANNON.Vec3(0, 50, 5)
        ];
        var ballStartPos = new CANNON.Vec3(0, 0, 25);
        var ballBody;

        // TODO: Why does normal `g` not work here? It looks sluggish... 
        world.gravity.set(0, 0, -5.82); // m/s²
        var physicsMaterial = new CANNON.Material("slipperyMaterial");
        var contactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 0.1, restitution: 0.5 });
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
            body.gameType = typ;
            world.addBody(body);
        };
        
        function createBall() {
            var radius = ballRadius; // m
            var sphereBody = new CANNON.Body({
                mass: 2, // kg
                position: ballStartPos, // m
                shape: new CANNON.Sphere(radius),
                material: physicsMaterial
            });
            newBody(sphereBody, {
                type: bodyTypes.ball,
                radius: radius
            });
            ballBody = sphereBody;
        }
        
        // TODO: delete playerBodies
        var playerBodies = {};
        var playerSlotBodies = [];
        function createPlayer(player) {
            var radius = 1; // m
            var x = 0;
            var y = player.team * 100 - 50;
            var sphereBody = new CANNON.Body({
                mass: 5, // kg
                position: playerStartPos[player.team], // m
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
            playerSlotBodies.push(sphereBody);
            scores[player.team] = 0;
        }
        
        function createAllPlayers() {
            playersArray.map(function(playa) {
                createPlayer(playa);
            });
        };
        
        function createGround() {
            // From: https://github.com/schteppe/cannon.js/blob/4cc2eb1e883839f823b30e1f22654e340467aea8/src/shapes/Plane.js#L7
            // A plane, facing in the Z direction. The plane has its surface at z=0
            // and everything below z=0 is assumed to be solid plane.
            // To make the plane face in some other direction than z, you must put it inside
            // a Body and rotate that body. See the demos.

            var x = new CANNON.Vec3(1,0,0);
            var y = new CANNON.Vec3(0,1,0);
            var z = new CANNON.Vec3(0,0,1);
            
            var planes = [
                // floor
                {
                    pos: [0, 0, 0],
                    quat: [z, 0]
                },
                
                // end of field walls
                {    
                    pos: [0, 200, 0],
                    quat: [x, Math.PI / 2]
                },
                {    
                    pos: [0, -200, 0],
                    quat: [x, -Math.PI / 2]
                },
                
                // angled roof
                {    
                    pos: [-30, 0, 50],
                    quat: [y, -Math.PI * 5 / 4]
                },
                {    
                    pos: [30, 0, 50],
                    quat: [y, Math.PI * 5 / 4]
                },
                
                // angled bottom floor
                {
                    pos: [40, 0, 20],
                    quat: [y, -Math.PI / 4]
                },
                {    
                    pos: [-40, 0, 20],
                    quat: [y, Math.PI / 4]
                }
            ];
            var groundShape = new CANNON.Plane();
            planes.forEach(function(planeDef) {
                var groundBody = new CANNON.Body({
                    mass: 0, // mass == 0 makes the body static
                    material: physicsMaterial
                });
                var pos = planeDef.pos;
                var quat = planeDef.quat;
                groundBody.position.set(pos[0], pos[1], pos[2]);
                //console.log(groundBody.position)
                groundBody.quaternion.setFromAxisAngle(quat[0], quat[1]);
                groundBody.addShape(groundShape);
                newBody(groundBody, {
                    type: bodyTypes.ground,
                    quaternion: groundBody.quaternion 
                });
            })
        };
        
        function createPoppers() {
            var popperData = [
                {y:-120, team: 0},
                {y: 120, team: 1}
            ];
            var popperRadius = 5;
            
            popperData.forEach(function(popper) {
                var popperBody = new CANNON.Body({
                    mass: 0, // static
                    position: new CANNON.Vec3(0, popper.y, 8),
                    shape: new CANNON.Sphere(popperRadius),
                    material: physicsMaterial
                });
                newBody(popperBody, {
                    type: bodyTypes.popper,
                    team: popper.team,
                    radius: popperRadius
                });
                
                popperBody.addEventListener("collide", function(e) {
                    var targetType = e.body.gameType.type;

                    if(targetType === bodyTypes.ball) {
                        score(popper.team);
                    }
                });
            });
        }
        
        function resetPositions() {
            playerSlotBodies.forEach(function (body, index) {
                body.position.copy(playerStartPos[index]);
                body.velocity.set(0, 0, 0);
            });
            
            ballBody.position.copy(ballStartPos);
            ballBody.velocity.set(0, 0, 0);
        }
        
        function score(team) {
            scores[team] += 1;
            if(scores[team] >= endGameScore) {
                eventCallback(types.eventTypes.gameOver, {
                    teamWon: team,
                    newScore: scores[team]
                });
                isGameOver = true;
            } else {
                eventCallback(types.eventTypes.score, {
                    teamScored: team,
                    newScore: scores[team]
                });                
                resetPositions();
            }
            //console.log("Score");
        }

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
                    body.force.set(v.x, v.y, v.z);
                    body.force.normalize();
                    body.force = body.force.scale(500);

                    /*
                    var v = com.moveVec;
                    body.velocity.set(v.x, v.y, v.z);
                    body.velocity.normalize();
                    body.velocity = body.velocity.scale(15);
                    */
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
            if(!isGameOver)
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
            createPoppers();
            notifyPlayersGameStarted();
            setTimeout(simloop, msPerFrame);
        }
        
        main();
        return game;
    };
    
    startGame.generate_id = generate_id;
    
    return startGame;
});