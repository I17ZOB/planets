import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

const std_dist = 5.0;

function getPlanetSphericalHYG(planet) {
    const dist = planet.dist;
    const ra = d2r(ra24h2d(planet.ra));
    const dec = d2r(planet.dec);
    const phi = 2 * Math.PI - ra;
    const theta = 0.5 * Math.PI - dec;
    //alert([phi/Math.PI, theta/Math.PI]);
    return new THREE.Spherical(dist, theta, phi);
}


function getPlanetSphericalExoplanets(planet) {
    const dist = planet.sy_dist;
    const ra = d2r(planet.ra);
    const dec = d2r(planet.dec);
    const phi = 2 * Math.PI - ra;
    const theta = 0.5 * Math.PI - dec;
    //alert([phi/Math.PI, theta/Math.PI]);
    return new THREE.Spherical(dist, theta, phi);
}

const databases = {
    "HYG": {"file": "./hygdata_v3.csv", "getSpherical": getPlanetSphericalHYG},
    "exoplanets": {"file": "./exoplanets.csv", "getSpherical": getPlanetSphericalExoplanets},
};

const db = "exoplanets";

function d2r(d) {
    return d / 180 * Math.PI;
}

function ra24h2d(ra24h) {
    return ra24h / 24 * 360;
}

function getPlanetRadius(planet) {
    const dist = planet.dist;
    const radius = planet.r1;
}


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
    controls.enablePan = true;
    controls.listenToKeyEvents( window );

    function animate() {
        requestAnimationFrame( animate );

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        controls.update();
        renderer.render( scene, camera );

    };

    
    function drawPlanet(planet, test) {
        const geo = new THREE.SphereGeometry(0.1, 32, 32);
        const color = test ? 0xff0000 : 0xffffff;
        const material = new THREE.MeshBasicMaterial({color: color});
        const sphere = new THREE.Mesh(geo, material);

        var sph = databases[db].getSpherical(planet);

        sphere.position.setFromSpherical(sph);
        scene.add(sphere);
    };

    $.get(databases[db].file, function(data) {
        const exoplanets = $.csv.toObjects(data);
        for (const [i, planet] of exoplanets.entries()) {
            drawPlanet(planet, false);
        }
    });
    
    animate();
}


universeInit();
