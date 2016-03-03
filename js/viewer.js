/* global requirejs */
// client-side THREE.JS viewer of the game

requirejs(['three', 'socketio'], function(THREE, io) {
    
    var socket = io();
    socket.on('tick', function(update) {
        console.log(update);
    });
    
    var rendererDivId = "renderer";
    var colors = {};
    colors.green = 0x99ff99;
    colors.red =   0xff9999;
    colors.blue =  0x9999ff;
    colors.skyBlue = 0xddddff;

    var initScene = function() {
        var viewer = {};
        viewer.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        viewer.audioListener = new THREE.AudioListener();
        viewer.camera.add( viewer.audioListener );

        viewer.scene = new THREE.Scene();
        var scene = viewer.scene;
        scene.fog = new THREE.Fog( colors.skyBlue, 0, 500 );

        var ambient = new THREE.AmbientLight( 0x555555 );
        scene.add( ambient );

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
        
        viewer.clearScene = function(scene) {
            var renderer = document.getElementById(rendererDivId);
            renderer.parentNode.removeChild(renderer);
            var i;
            for(i=0; i < scene.children.length; i++){
                var obj = scene.children[i];
                scene.remove(obj);
            }
        }
        
        return viewer;
    }
    
    return initScene();
});