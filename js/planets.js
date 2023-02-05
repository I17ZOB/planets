import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

const std_dist = 5.0;


function d2r(d) {
    return d / 180 * Math.PI;
}

function ra24h2d(ra24h) {
    return ra24h / 24 * 360;
}

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

function getRadiusHYG(planet) {
    const radius = planet.r1;
    return redius / 1000;
}

function getRadiusExoplanets(planet) {
    const radius = planet.pl_rade;
    return radius / 100;
}


function invalidPlanetExoplanets(planet) {
    return !planet || !planet.ra || !planet.dec || !planet.pl_rade
    || !planet.sy_dist;
}


function invalidPlanetHYG(planet) {
    /* TODO */
    return !planet;
}


const databases = {
    "HYG": {
        "file": "./hygdata_v3.csv",
        "getSpherical": getPlanetSphericalHYG,
        "getRadius": getRadiusHYG,
        "invalidPlanet": invalidPlanetHYG
    },
    "exoplanets": {
        "file": "./exoplanets.csv",
        "getSpherical": getPlanetSphericalExoplanets,
        "getRadius": getRadiusExoplanets,
        "invalidPlanet": invalidPlanetExoplanets
    },
};

const db = "exoplanets";

    
function drawPlanet(scene, planet, test) {
    const geo = new THREE.SphereGeometry(databases[db].getRadius(planet), 8, 8);
    const color = test ? 0xff0000 : 0xffffff;
    const material = new THREE.MeshBasicMaterial({color: color});
    const sphere = new THREE.Mesh(geo, material);

    var sph = databases[db].getSpherical(planet);

    sphere.position.setFromSpherical(sph);
    scene.add(sphere);
};

function drawSolarSystem(scene) {
    const geo = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({color: 0xffc040});
    const sphere = new THREE.Mesh(geo, material);
    
    sphere.position.set(0, 0, 0);
    scene.add(sphere);
}

function resizeRendererHandler(renderer, camera) {
    return (event) => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

function universeInit() {
    /* three.js example */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({canvas: document.querySelector("#universe")});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    addEventListener("resize", resizeRendererHandler(renderer, camera));
    /*
    const resizeObserver = new ResizeObserver(resizeRendererHandler(renderer, camera));
    resizeObserver.observe(renderer.domElement, {box: 'content-box'});
    */

    camera.position.z = 5;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.listenToKeyEvents(window);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };

    drawSolarSystem(scene);

    $.get(databases[db].file, function(data) {
        const exoplanets = $.csv.toObjects(data);
        for (const [i, planet] of exoplanets.entries()) {
            if (databases[db].invalidPlanet(planet))
              continue;
            drawPlanet(scene, planet, false);
        }
    });
    
    animate();
}


universeInit();
