/* global requirejs */
// client-side THREE.JS viewer of the game
var v;
requirejs(['three', 'Stats', 'socketio', 'TrackballControls'], function(THREE, Stats, socketio) {
    
    var socket = socketio();
    socket.on('tick', function(update) {
        //console.log(update);
        if(update.n) {
            // make new object
            v.createBall();
        }
        if(update.p) {
            for(var i = 0; i < update.p.length; i++) {
                var obj = v.objects[i].mesh;
                obj.position.copy(update.p[i]);
                //var vec = update.p[i];
                //obj.position.set(vec[0], vec[1], vec[2]);
                //obj.velocity = update.v[i] 
            }
        }
    });
    
    var rendererDivId = "renderer";
    var colors = {};
    colors.green = 0x99ff99;
    colors.red =   0xff9999;
    colors.blue =  0x9999ff;
    colors.skyBlue = 0xddddff;
    var redMaterial = new THREE.MeshLambertMaterial( { color: colors.red } );
    var blueMaterial = new THREE.MeshLambertMaterial( { color: colors.blue } );
    var ambientLight = new THREE.AmbientLight( 0x555555 );
    var earthTexture = new THREE.TextureLoader().load( 'images/land_ocean_ice_cloud_2048.jpg' );
    
    var stats;
    var initStats = function() {

        stats = new Stats();
        stats.setMode( 0 ); // 0: fps, 1: ms, 2: mb

        // align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

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
        camera.position.set(100, 100, 100)
        
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
        light.position.set( 10, 60, 20 );
        light.target.position.set( 0, 0, 0 );
        if (true) {
            light.castShadow = true;

            light.shadow.camera.near = 20;
            light.shadow.camera.far = 50;
            light.shadow.camera.fov = 40;

            light.shadowMapBias = 0.1;
            light.shadowMapDarkness = 0.7;
            light.shadow.mapSize.Width = 2*512;
            light.shadow.mapSize.Height = 2*512;

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
        
        var radius = 5;
        var ballGeometry = new THREE.SphereGeometry(radius, 32, 32);
        
        
        viewer.createBall = function() {
            var ballMesh = new THREE.Mesh( ballGeometry, blueMaterial );
            scene.add(ballMesh);
            ballMesh.castShadow = true;
            ballMesh.receiveShadow = true;
            ballMesh.position.set(0, 0, 0); 
            objects.push({
                mesh: ballMesh,
                type: "ball"
            });
        };
        


        viewer.clearScene = function(scene) {
            var renderer = document.getElementById(rendererDivId);
            renderer.parentNode.removeChild(renderer);
            var i;
            for(i=0; i < scene.children.length; i++){
                var obj = scene.children[i];
                scene.remove(obj);
            }
        }
        
        viewer.createPlane = function() {
            // floor
            var planeGeometry = new THREE.PlaneGeometry( 300, 300, 50, 50 );
            planeGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

            var material = new THREE.MeshLambertMaterial( {
                color: colors.green,
                map: earthTexture
            });

            var mesh = new THREE.Mesh( planeGeometry, material );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add( mesh );
        }
        
        viewer.tick = function() {
            v.controls.update()
            renderer.render( scene, camera );
        }
        
        viewer.createPlane();
        return viewer;
    }
    
    v = initScene();
    
    function animate() {
        stats.begin();
        requestAnimationFrame( animate );
        v.tick();
        stats.end();
    }
    
    requestAnimationFrame( animate );
    return v;
});