/* global requirejs */
// client-side THREE.JS viewer of the game
var v;
requirejs(
       ['three', 'Stats', 'js/types', 'js/server', 'js/keyboardCommands', 'optional!socketio', 'pointerLockControls', 'autoCameraControls','trackballControls'], 
function(THREE,   Stats,      types,      server,      keyboardCommands,            socketio,   pointerLockControls,   autoCameraControls           ) {
    var bodyTypes = types.bodyTypes;
    var socket;
    var thisPlayerId = null;
    var focusPlayer = null;
    var activeControls = null;
    
    var tweenSpeed = 0.6;
    
    // `self` is `window` unless you're in a worker 
    var now = ( self.performance && self.performance.now ) ? self.performance.now.bind( performance ) : Date.now;
    
    var rendererDivId = "renderer";
    var colors = {};
    colors.green = 0x99ff99;
    colors.red =   0xff9999;
    colors.yellow =   0xffff99;
    colors.blue =  0x9999ff;
    colors.skyBlue = 0xddddff;
    colors.darkNight = 0x280137;
    colors.white = 0xffffff;
    var redMaterial = new THREE.MeshLambertMaterial( { color: colors.red } );
    var blueMaterial = new THREE.MeshLambertMaterial( { color: colors.blue } );
    var popperMaterials = {
        0: new THREE.MeshLambertMaterial( { color: colors.blue, transparent: true, opacity: 0.5 } ),
        1: new THREE.MeshLambertMaterial( { color: colors.red, transparent: true, opacity: 0.5 } )
    }
    var yellowMaterial = new THREE.MeshLambertMaterial( { color: colors.yellow } );
    var ambientLight = new THREE.AmbientLight( 0x555555 );
    //var earthTexture = new THREE.TextureLoader().load( 'images/land_ocean_ice_cloud_2048.jpg' );
    
    var stats;
    var createTickStats = function() {
        var tickDiv = stats.createPanel( 'tick', '#ff0', '#020' );
        var tickText = tickDiv.children[ 0 ];
        var tickGraph = tickDiv.children[ 1 ];
    }
    var initStats = function() {

        stats = new Stats();
        stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb

        // align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        
        //stats.domElement.
        
        document.body.appendChild( stats.domElement );
    };
    initStats();
    
    
    function onWindowResize() {
        v.camera.aspect = window.innerWidth / window.innerHeight;
        v.camera.updateProjectionMatrix();
        v.renderer.setSize( window.innerWidth, window.innerHeight );
    };
    
    var initTrackball = function(camera, renderer) {
        var trackBall = new THREE.trackballControls( camera );
        trackBall.rotateSpeed = 5.0;
        trackBall.zoomSpeed = 2.0;
        trackBall.panSpeed = 2.0;
        trackBall.noZoom = false;
        trackBall.noPan = false;
        trackBall.staticMoving = true;
        trackBall.dynamicDampingFactor = 0.3;
        trackBall.keys = [ 65, 83, 68 ];
        //controls.addEventListener( 'change', renderer );
        return trackBall;
    }
    
    var controls;
    var initScene = function() {
        var viewer = {};
        var objects = [];
        var playerMeshes = [];
        var recentServerPositions = [];
        var recentServerVelocities = [];
        var recentTickTimestamp = 0;
        
        viewer.objects = objects;
        
        var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        //camera.position.set(1, 1, 1);
        //camera.lookAt(new THREE.Vector3([0,0,0]));
        
        viewer.camera = camera;
        viewer.audioListener = new THREE.AudioListener();
        viewer.camera.add( viewer.audioListener );

        viewer.scene = new THREE.Scene();
        var scene = viewer.scene;
        scene.fog = new THREE.Fog( colors.darkNight, 0, 500 );


        
        if (true) {
            activeControls = autoCameraControls;
            controls = new autoCameraControls.autoCameraControls(camera, scene);
        } else {
            if (pointerLockControls.supportsPointerLock) {
                activeControls = pointerLockControls;
                controls = new pointerLockControls.pointerLockControls(camera);
                pointerLockControls.requirePointerLock();
                scene.add(controls.object);
                camera.up = new THREE.Vector3(0,0,1);
                camera.lookAt(new THREE.Vector3(0,0,0));
            } else {
                activeControls = trackballControls;
                controls = initTrackball(camera, renderer);
                scene.add(camera);
            }
        }

        viewer.controls = controls;
        
        scene.add( ambientLight );

        var lights = [
            {
                pos: [0, 0, 100],
                color: colors.white
            },
            {
                pos: [0, -130, 100],
                color: colors.blue
            },
            {
                pos: [0, 130, 100],
                color: colors.red
            }
        ];
        
        lights.forEach(function(lite) {
            var light = new THREE.SpotLight( lite.color );
            var pos = lite.pos;
            //light.intensity = 0.9;
            light.position.set( pos[0], pos[1], pos[2] );
            light.target.position.set( pos[0], pos[1], 0 );
            light.castShadow = true;

            light.shadow.camera.near = 10;
            light.shadow.camera.far = 250;
            light.shadow.camera.fov = 70;

            light.shadowMapBias = 0.1;
            light.shadowMapDarkness = 0.7;
            light.shadow.mapSize.Width = 2*512;
            light.shadow.mapSize.Height = 2*512;

            //scene.add(new THREE.CameraHelper( light.shadow.camera ));
            
            scene.add( light );
            scene.add( light.target );
            viewer.light = light;
        })
        
        //viewer.light = light;

        var renderer = new THREE.WebGLRenderer();
        viewer.renderer = renderer;
        renderer.shadowMap.enabled = true;
        renderer.shadowMapSoft = true;
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor( scene.fog.color, 1 );

        renderer.domElement.id = rendererDivId;
        document.body.appendChild( renderer.domElement );
        
        function addBodyToScene(mesh, typ) {
            objects.push({
                mesh: mesh,
                type: typ
            });
            scene.add(mesh);
            console.log(typ);
        }
        
        function createPlayer (typeInfo) {
            var colors = {0: blueMaterial, 1: redMaterial};
            var playerGeometry = new THREE.SphereGeometry(typeInfo.radius, 32, 32);
            var playerMesh = new THREE.Mesh( playerGeometry, colors[typeInfo.teamI] );
            playerMesh.castShadow = true;
            playerMesh.receiveShadow = true;
            playerMesh.position.set(0, 0, 0); 
            playerMeshes.push(playerMesh);
            addBodyToScene(playerMesh, bodyTypes.player);
        };

        var ballMesh = null;
        function createSphere (typeInfo) {
            var ballRadius = typeInfo.radius;
            var ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
            var material = yellowMaterial;
            if(typeInfo.type == bodyTypes.popper) {
                material = popperMaterials[typeInfo.team];
            }
            var ballMesh = new THREE.Mesh( ballGeometry, material );
            ballMesh.castShadow = true;
            ballMesh.receiveShadow = true;
            ballMesh.position.set(0, 0, 0);

            addBodyToScene(ballMesh, bodyTypes.ball);
            return ballMesh;
        };
        
        function createPlane(typeInfo) {
            // floor
            var planeGeometry = new THREE.PlaneGeometry( 50, 400, 20, 20 );
            planeGeometry.applyMatrix( new THREE.Matrix4().makeRotationFromQuaternion(typeInfo.quaternion) );

            var material = new THREE.MeshLambertMaterial( {
                color: colors.white,
                wireframe: true,
                //wireframeLinewidth does not work on windows: wireframeLinewidth: 2.0
                //map: earthTexture
            });

            var mesh = new THREE.Mesh( planeGeometry, material );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            addBodyToScene(mesh, bodyTypes.ground);
        }

        function clearScene(scene) {
            var renderer = document.getElementById(rendererDivId);
            renderer.parentNode.removeChild(renderer);
            var i;
            for(i=0; i < scene.children.length; i++){
                var obj = scene.children[i];
                scene.remove(obj);
            }
        }

        var lastPaintTime = now(); 
        viewer.onPaint = function() {
            // on paint - hopefully faster than onServerTick
            var dt = now() - lastPaintTime;
            
            //predictPositions(objects, recentServerPositions, recentServerVelocities, recentTickTimestamp);
            setPositions(objects, recentServerPositions);
            controls.update(dt);
            
            //controls.updateCommands();
            renderer.render( scene, camera );
        }
        
        function setPositions(objects, dstPositions) {
            for(var i = 0; i < objects.length; i++) {
                var obj = objects[i].mesh;
                var vec = dstPositions[i];
                obj.position.x = vec[0];
                obj.position.y = vec[1];
                obj.position.z = vec[2];
            }
        }
        
        function predictPositions(objects, srcPositions, velocities, lastUpdateTimestamp) {
            //return;
            var dt = (now() - lastUpdateTimestamp) / 1000.0;
            for(var i = 0; i < objects.length; i++) {
                var pos = objects[i].mesh.position;
                var srcPos = srcPositions[i];
                var vel = velocities[i];
                pos.multiplyScalar(1 - tweenSpeed)
                pos.x = pos.x + (srcPos[0] + vel[0] * dt) * tweenSpeed;
                pos.y = pos.y + (srcPos[1] + vel[1] * dt) * tweenSpeed;
                pos.z = pos.z + (srcPos[2] + vel[2] * dt) * tweenSpeed;
            }
        };
        
        function updatePositions(positions, velocities) {
            //console.log(packet.p);
            if(positions.length != objects.length)
                console.warn("Simulation and viewer object count desynced", positions.length, objects.length);
            recentServerPositions = positions;
            recentServerVelocities = velocities;
            recentTickTimestamp = now();
            //setPositions(objects, positions);
            //console.log(focusPlayer);
        }
        
        function newObjects(objList) {
            // make new objects
            for(var i = 0; i < objList.length; i++) {
                var newObj = objList[i];
                switch(newObj.type) {
                    case bodyTypes.ball:
                        ballMesh = createSphere(newObj);
                        break;
                    case bodyTypes.player:
                        createPlayer(newObj);
                        break;
                    case bodyTypes.ground:
                        createPlane(newObj);
                        break;
                    case bodyTypes.popper:
                        createSphere(newObj);
                        break;
                    default:
                        console.warn("Unhandled object type: " + newObj);
                }
            }
        }
        
        var noMove = new THREE.Vector3(0, 0, 0);
        function sendCommands() {
            var commands = keyboardCommands.update();
            //console.log(commands);
            var moveVector = noMove.clone();
            var forward = camera.getWorldDirection();
            // TODO: Should I try to avoid allocations?
            var up = camera.up.clone();
            var left = up.clone().cross(forward);
            if (commands[keyboardCommands.names.forward]) {
                moveVector.add(forward.setLength(1));
            }
            if (commands[keyboardCommands.names.back]) {
                moveVector.add(forward.setLength(-1));
            }
            if (commands[keyboardCommands.names.left]) {
                moveVector.add(left.setLength(1));
            }
            if (commands[keyboardCommands.names.right]) {
                moveVector.add(left.setLength(-1));
            }
            if (commands[keyboardCommands.names.fly]) {
                moveVector.add(up.setLength(1));
            }
            if (commands[keyboardCommands.names.dive]) {
                moveVector.add(up.setLength(-1));
            }
            
            if (!moveVector.equals(noMove)) {
                socket.emit(types.eventTypes.command, new types.moveCommand(moveVector));
                //console.log(moveVector);
            }

        }
        
        function fixCameraOnStart(packet) {
            // I don't yet understand how this thing works.
            
            //controls.target.copy(playerMeshes[focusPlayer].position);
            //controls.target = playerMeshes[focusPlayer].position;
            //camera.position.copy(playerMeshes[focusPlayer].position);
            //var outside = 7;
            //if(playerMeshes[focusPlayer].position.y < 0)
            //    outside = -outside;
            //camera.position.setX(outside);
            
            //console.log(camera.position);
            //camera.position.setY(camera.position.y + 2);
            //camera.position.setZ(camera.position.z + 1);
            //playerMeshes[focusPlayer].add(camera);
            
            if(activeControls === autoCameraControls) {
                controls.targetNear = playerMeshes[focusPlayer];
                controls.targetFar = ballMesh;
            }
            
            if(activeControls === pointerLockControls) {
                camera.position.setZ(8);
                playerMeshes[focusPlayer].add(controls.object);
            }
        }
        
        viewer.onServerTick = function(packet) {
            stats.update();
            //console.log(packet);
            if(packet.n) {
                newObjects(packet.n);
            }
            if(packet.p) {
                updatePositions(packet.p, packet.v);
            }
            sendCommands();
            if(packet.n) {
                // TODO: make this less ugly in some "game events/startup" function
                fixCameraOnStart();
            }
        }
        
        viewer.onStartGame = function(playerIdsArray) {
            focusPlayer = playerIdsArray.indexOf(thisPlayerId);
            console.log('serverStartGame', playerIdsArray, focusPlayer);
        };
        
        viewer.onSetPlayerId = function(playerId) {
            thisPlayerId = playerId;
            console.log("I am", playerId);
        };
        
        function scoreToast(line, team) {
            humane.log(line, { addnCls: 'team' + team})
        }
        
        function gameOverToast(line, team) {
            humane.log(line, { timeout: 15000, addnCls: 'wonToast team' + team})
        }
        
        function setScore(team, score) {
            var el = document.getElementById('score' + team);
            el.innerHTML = score;
        }
        
        viewer.score = function(data) {
            var team = data.teamScored;
            var line = types.teamNames[team] + ' scored!';
            setScore(team, data.newScore);
            scoreToast(line, team)
        };
        
        viewer.gameOver = function(data) {
            var team = data.teamWon;
            setScore(team, data.newScore);
            var line = types.teamNames[team] + ' won!';
            gameOverToast(line, team)
        }
        
        return viewer;
    }
    
    function selectRandom(arr) {
        // http://stackoverflow.com/questions/4550505/getting-random-value-from-an-array
        return arr[Math.floor(Math.random() * arr.length)];        
    }
    
    function main() {
        v = initScene();
        window.addEventListener( 'resize', onWindowResize, false );

        function animate() {
            requestAnimationFrame( animate );
            v.onPaint();
        };
        
        requestAnimationFrame( animate );

        // To run the server locally:
        // TODO: make `runLocal` a button in the UI?
        var runLocal = socketio === undefined;
        
        if(runLocal) {
            socket = {};
            socket.callbacks = {};
            socket.on = function(eventName, func) {
                socket.callbacks[eventName] = func;
            };
            socket.emit = function(eventName, data) {
                return socket.callbacks[eventName](data);
            };
        } else {
            socket = socketio();
        }
        
        socket.on(types.eventTypes.setPlayerId, v.onSetPlayerId);
        socket.on(types.eventTypes.serverStartGame, v.onStartGame);
        socket.on(types.eventTypes.score, v.score);
        socket.on(types.eventTypes.gameOver, v.gameOver);
        socket.on('error', function(e) {
            // TODO: check if this works somehow
            humane.error(e);
        });
        socket.on(types.eventTypes.toast, function(line) {
            // NOTE: we don't pass `humane.log`
            // as the callback because it ruins `this` and 
            // you get an undefined queue error.
            humane.log(line);
        });
        socket.on(types.eventTypes.tick, v.onServerTick);
        
        
        if (runLocal) {
            // TODO: Make this more elegant. E.g. remove the command forwarding from the matchmaker.
            var playersArray =  [{id: 'playerOne', team: 0}, {id:'playerTwo', team: 1}];
            thisPlayerId = selectRandom(playersArray).id;
            var game = server(socket.emit, playersArray);
            socket.on(types.eventTypes.command, function(com) {
                com.playerId = thisPlayerId;
                game.command(com);
            });
        } else {
            socket.emit(types.eventTypes.clientRequestGame);
        }

        return v;
    }
    
    return main();
});