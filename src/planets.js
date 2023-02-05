import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import $ from 'jquery';
var csv = require('jquery-csv');
var ct = require('color-temperature');


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
    return radius / 1000;
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

function temp2color(temp) {
    const rgb = ct.colorTemperature2rgb(temp);
    //return rgb.red * 0x10000 + rgb.green * 0x100 + rgb.blue;
    return 0xffffff;
}

function getColorExoplanets(planet) {
    const temp = planet.pl_eqt || 300;
    return temp2color(temp);
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
        "invalidPlanet": invalidPlanetExoplanets,
        "getColor": getColorExoplanets
    },
};

const db = "exoplanets";

let planetGroups = [];

let planetGroupDivs = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 180, 200, 250, 300, 350, 400, 500, 700, 1000];
let planetGroupDivSets = [];

function findPlanetGroups(dis) {
    const i = 1 + planetGroupDivs.findIndex((e) => dis >= e);
    return planetGroupDivSets[i];
}

function findPlanetGroupDivs(disFrom, disTo) {
    let groupSet = [];
    for (const group of planetGroups) {
        const dis = group.center.length();
        if (dis - 2 * group.radius <= disTo && dis + 2 * group.radius >=disFrom) {
            groupSet.push(group);
        }
    }
    return groupSet;
}

function dividePlanetGroups() {
    let last_div = -Infinity;
    for (const [i, div] of planetGroupDivs.entries()) {
        let groupSet = findPlanetGroupDivs(last_div, div);
        planetGroupDivSets.push(groupSet);
        last_div = div;
    }
    let groupSet = findPlanetGroupDivs(last_div, Infinity);
    planetGroupDivSets.push(groupSet);

    for (const groupSet of planetGroupDivSets) {
        //alert(groupSet.length);
    }
}

function drawPlanet(scene, planet, test) {
    const radius = databases[db].getRadius(planet);
    const geo = new THREE.SphereGeometry(radius, 8, 8);
    const color = test ? 0xff0000 : databases[db].getColor(planet);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geo, material);

    var sph = databases[db].getSpherical(planet);

    const visibleRad = radius * 100;
    const groupMinRad = sph.radius / 16;
    const globalMinRad = 10;
    const newGroupRad = Math.max(visibleRad, globalMinRad, groupMinRad);

    var center = new THREE.Vector3();
    center.setFromSpherical(sph);
    sphere.position.copy(center);
    scene.add(sphere);

    let foundGroup = false;

    for (var group of planetGroups) {
        let dist = group.center.distanceTo(center);
        //alert(group.radius + " " + dist + " " + newGroupRad);
        if (newGroupRad > group.radius + dist) {
            group.center = center;
            group.radius = newGroupRad;
            group.members.push(sphere);
            foundGroup = true;
            break;
        } else if (dist < group.radius) {
            group.members.push(sphere);
            foundGroup = true;
            break;
        }
    }

    if (!foundGroup) {
        let newGroup = {};
        newGroup.radius = newGroupRad;
        newGroup.center = center;
        newGroup.members = [sphere];
        planetGroups.push(newGroup);
    }
};

function drawSolarSystem(scene) {
    const geo = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffc040 });
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

let selected_planet = null;

function universeInit() {
    /* three.js example */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const renderer = new THREE.WebGLRenderer();
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

    $.get(databases[db].file, function (data) {
        const exoplanets = csv.toObjects(data);
        for (const [i, planet] of exoplanets.entries()) {
            if (databases[db].invalidPlanet(planet))
                continue;
            drawPlanet(scene, planet, false);
        }
        //alert(planetGroups.length);
        let maxGroupSize = -1;
        for (const group of planetGroups) {
            maxGroupSize = Math.max(group.members.length, maxGroupSize);
        }
        //alert(maxGroupSize);

        dividePlanetGroups();
    });

    async function onPointerMove(event) {
        pointer.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);

        if (selected_planet) {
            const intersects = raycaster.intersectObject(selected_planet);
            if (intersects.length == 0) {
                selected_planet.material.color.set(selected_planet.position.equals(new THREE.Vector3()) ? 0xffc040 : 0xffffffff);
                selected_planet = null;
            }
        } else {
            let groupSets = findPlanetGroups(camera.position.length());
            for (const group of groupSets) {
                const intersects = await raycaster.intersectObjects(group.members);
                if (intersects.length > 0) {
                    selected_planet = intersects[0].object;
                    selected_planet.material.color.set(0x6495ED);
                    break;
                }
            }
        }

        animate();
    }

    document.addEventListener('pointermove', (event)=>onPointerMove(event));

    animate();

}

universeInit();
