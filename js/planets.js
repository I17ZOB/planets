import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

function drawPlanet(planet) {
    
};

function universeInit() {
    /* three.js example */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 5;
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enablePan = false;
    //	 controls.listenToKeyEvents( window );

    function animate() {
        requestAnimationFrame( animate );

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        controls.update();
        renderer.render( scene, camera );

    };

    animate();

    $.get("./exoplanets.csv", function(data) {
        exoplanets = $.csv.toObjects(data);
        for (const planet of exoplanets) {
            drawPlanet(planet);
        }
    });
}


universeInit();
