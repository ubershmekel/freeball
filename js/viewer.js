/* global requirejs */
// client-side THREE.JS viewer of the game
var v;
requirejs(
       ['three', 'Stats', 'socketio', 'js/types', 'js/server', 'js/keyboardCommands', 'js/BallControls', 'TrackballControls'], 
function(THREE,   Stats,   socketio,   types,      server,      keyboardCommands,         BallControls) {
    var bodyTypes = types.bodyTypes;
    var socket;
    var thisPlayerId = null;
    var focusPlayer = null;
    
    var rendererDivId = "renderer";
    var colors = {};
    colors.green = 0x99ff99;
    colors.red =   0xff9999;
    colors.yellow =   0xffff99;
    colors.blue =  0x9999ff;
    colors.skyBlue = 0xddddff;
    var redMaterial = new THREE.MeshLambertMaterial( { color: colors.red } );
    var blueMaterial = new THREE.MeshLambertMaterial( { color: colors.blue } );
    var yellowMaterial = new THREE.MeshLambertMaterial( { color: colors.yellow } );
    var ambientLight = new THREE.AmbientLight( 0x555555 );
    var earthTexture = new THREE.TextureLoader().load( 'images/land_ocean_ice_cloud_2048.jpg' );
    
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
    
    var initControls = function(camera, renderer) {
        var trackBall = new THREE.TrackballControls( camera );
        trackBall.rotateSpeed = 4.0;
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
        viewer.objects = objects;
        
        var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.set(50, 50, 50);
        //camera.lookAt(new THREE.Vector3([0,0,0]));
        
        viewer.camera = camera;
        viewer.audioListener = new THREE.AudioListener();
        viewer.camera.add( viewer.audioListener );

        viewer.scene = new THREE.Scene();
        var scene = viewer.scene;
        scene.fog = new THREE.Fog( colors.skyBlue, 0, 500 );

        controls = initControls(camera, renderer);
        scene.add(camera);
        
        //camera.position.set(30,0,0);
        camera.up = new THREE.Vector3(0,0,1);
        camera.lookAt(new THREE.Vector3(0,0,0));
        //camera.lookAt({x: -0.7654980871707273, y: 0.563635924172992, z: -0.3103662623816727});

        //scene.add( controls.object );
        //scene.add( controls.getObject() );
        //var controls = new BallControls.BallControls(camera);
        //BallControls.requirePointerLock();
        
        

        scene.add( ambientLight );

        var light = new THREE.SpotLight( 0xffffff );
        light.position.set( 0, 0, 100 );
        light.target.position.set( 0, 0, 0 );
        if (true) {
            light.castShadow = true;

            light.shadow.camera.near = 20;
            light.shadow.camera.far = 100;
            light.shadow.camera.fov = 80;

            light.shadowMapBias = 0.1;
            light.shadowMapDarkness = 0.7;
            light.shadow.mapSize.Width = 4*512;
            light.shadow.mapSize.Height = 4*512;

            //light.shadowCameraVisible = true;
        }
        
        scene.add( light );
        viewer.light = light;

        var renderer = new THREE.WebGLRenderer();
        viewer.renderer = renderer;
        renderer.shadowMap.enabled = true;
        renderer.shadowMapSoft = true;
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor( scene.fog.color, 1 );

        renderer.domElement.id = rendererDivId;
        document.body.appendChild( renderer.domElement );
        
        var ballRadius = 3;
        var ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
        
        var playerRadius = 1;
        var playerGeometry = new THREE.SphereGeometry(playerRadius, 32, 32);
        
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
            var ballMesh = new THREE.Mesh( playerGeometry, colors[typeInfo.teamI] );
            ballMesh.castShadow = true;
            ballMesh.receiveShadow = true;
            ballMesh.position.set(0, 0, 0); 
            playerMeshes.push(ballMesh);
            addBodyToScene(ballMesh, bodyTypes.player);
        };

        function createBall (typeInfo) {
            var ballMesh = new THREE.Mesh( ballGeometry, yellowMaterial );
            ballMesh.castShadow = true;
            ballMesh.receiveShadow = true;
            ballMesh.position.set(0, 0, 0);

            addBodyToScene(ballMesh, bodyTypes.ball);
        };
        
        function createPlane(typeInfo) {
            // floor
            var planeGeometry = new THREE.PlaneGeometry( 400, 200, 50, 50 );
            planeGeometry.applyMatrix( new THREE.Matrix4().makeRotationZ( - Math.PI / 2 ) );

            var material = new THREE.MeshLambertMaterial( {
                color: colors.green,
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

        
        viewer.update = function() {
            //v.controls.update()
            controls.update();
            //controls.updateCommands();
            renderer.render( scene, camera );
        }
        
        function updatePositions(positions) {
            //console.log(packet.p);
            if(positions.length != objects.length)
                console.warn("Simulation and viewer object count desynced", positions.length, objects.length);
            for(var i = 0; i < objects.length; i++) {
                var obj = objects[i].mesh;
                //obj.position.copy(packet.p[i]);
                var vec = positions[i];
                obj.position.set(vec[0], vec[1], vec[2]);
                //obj.velocity = packet.v[i] 
            }
            //console.log(focusPlayer);
            camera.position.copy(playerMeshes[focusPlayer].position);
            camera.position.setY(camera.position.y*1.1);
            camera.position.setZ(camera.position.z + 2);
        }
        
        function newObjects(objList) {
            // make new objects
            for(var i = 0; i < objList.length; i++) {
                var newObj = objList[i];
                switch(newObj.type) {
                    case bodyTypes.ball:
                        createBall(newObj);
                        break;
                    case bodyTypes.player:
                        createPlayer(newObj);
                        break;
                    case bodyTypes.ground:
                        createPlane(newObj);
                        break;
                    default:
                        console.warn("Unhandled object type: " + newObj);
                }
            }
            
            controls.target.copy(playerMeshes[focusPlayer].position);
        }
        var noMove = new THREE.Vector3(0, 0, 0);
        function sendCommands() {
            var commands = keyboardCommands.update();
            //console.log(commands);
            var moveVector = noMove.clone();
            var forward = camera.getWorldDirection();
            var up = camera.up;
            var left = up.cross(forward);
            if (commands[keyboardCommands.names.forward]) {
                moveVector.add(forwad.setLength(1));
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
            
            if (!moveVector.equals(noMove)) {
                socket.emit(types.eventTypes.command, new types.moveCommand(moveVector));
                //console.log(moveVector);
            }

        }
        
        viewer.serverTick = function(packet) {
            stats.update();
            //console.log(packet);
            if(packet.n) {
                newObjects(packet.n);
            }
            if(packet.p) {
                updatePositions(packet.p);
            }
            sendCommands();
        }
        
        viewer.onStartGame = function(playerIdsArray) {
            focusPlayer = playerIdsArray.indexOf(thisPlayerId);
            console.log('serverStartGame', playerIdsArray, focusPlayer);
        };
        
        viewer.onSetPlayerId = function(playerId) {
            thisPlayerId = playerId;
            console.log("I am", playerId);
        };
        
        return viewer;
    }
    
    function main() {
        v = initScene();
        window.addEventListener( 'resize', onWindowResize, false );

        function animate() {
            requestAnimationFrame( animate );
            v.update();
        };
        
        requestAnimationFrame( animate );

        socket = socketio();
        // To run the server locally:
        //server(v.serverTick);
        socket.emit(types.eventTypes.clientRequestGame);
        socket.on(types.eventTypes.setPlayerId, v.onSetPlayerId);
        socket.on(types.eventTypes.serverStartGame, v.onStartGame);
        socket.on(types.eventTypes.tick, v.serverTick);
        
        //setInterval(function() {
            // TODO: delete his
        //    console.log('forward');
        //    socket.emit(types.eventTypes.command, new types.moveCommand({x:0,y:1,z:0}));
        //}, 1000);
        
        return v;
    }
    
    return main();
});