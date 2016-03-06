/* global requirejs */
// client-side THREE.JS viewer of the game
var v;
requirejs(['three', 'Stats', 'socketio', 'js/types', 'js/server', 'TrackballControls'], function(THREE, Stats, socketio, types, server) {
    var bodyTypes = types.bodyTypes;
    var socket = socketio();
    
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
    }    
    window.addEventListener( 'resize', onWindowResize, false );
    
    var initControls = function(camera, renderer) {
        var controls = new THREE.TrackballControls( camera );
        controls.rotateSpeed = 4.0;
        controls.zoomSpeed = 2.0;
        controls.panSpeed = 2.0;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [ 65, 83, 68 ];
        //controls.addEventListener( 'change', renderer );
        return controls;
    }
    var initScene = function() {
        var viewer = {};
        var objects = [];
        viewer.objects = objects;
        
        var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.set(50, 50, 50)
        
        viewer.camera = camera;
        viewer.audioListener = new THREE.AudioListener();
        viewer.camera.add( viewer.audioListener );

        viewer.scene = new THREE.Scene();
        var scene = viewer.scene;
        scene.fog = new THREE.Fog( colors.skyBlue, 0, 500 );

        viewer.controls = initControls(camera, renderer);
        //scene.add( viewer.controls.getObject() );

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
        
        var ballRadius = 2;
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
            v.controls.update()
            renderer.render( scene, camera );
        }
        
        viewer.serverTick = function(packet) {
            stats.update();
            //console.log(packet);
            if(packet.n) {
                // make new object
                for(var i = 0; i < packet.n.length; i++) {
                    var newObj = packet.n[i];
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
            }
            if(packet.p) {
                //console.log(packet.p);
                if(packet.p.length != objects.length)
                    console.warn("Simulation and viewer object count desynced", packet.p.length, objects.length);
                for(var i = 0; i < objects.length; i++) {
                    var obj = objects[i].mesh;
                    //obj.position.copy(packet.p[i]);
                    var vec = packet.p[i];
                    obj.position.set(vec[0], vec[1], vec[2]);
                    //obj.velocity = packet.v[i] 
                }
            }
        }
        
        return viewer;
    }
    
    v = initScene();
    
    function animate() {
        requestAnimationFrame( animate );
        v.update();
    }
    
    requestAnimationFrame( animate );

    //server(function(packet) {
    //    v.serverTick(packet)
    //});
    socket.emit(types.eventTypes.startGame);
    socket.on(types.eventTypes.tick, function(packet) {
        v.serverTick(packet);
    });

    
    return v;
});