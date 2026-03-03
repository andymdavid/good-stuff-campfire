import {
    Group,
    BoxGeometry,
    CylinderGeometry,
    MeshStandardMaterial,
    Mesh,
    Vector3,
    CanvasTexture,
    PlaneGeometry,
    DoubleSide,
    MathUtils,
    sRGBEncoding
} from 'three';

export const triplaneBanner = new Group();

const FLIGHT_INTERVAL = 30.0;
const FLIGHT_DURATION = 12.0;
const FLIGHT_ALTITUDE = 7.5;
const FLIGHT_DEPTH = -18;
const FLIGHT_START_X = -36;
const FLIGHT_END_X = 36;

const BANNER_WIDTH = 3.6;
const BANNER_HEIGHT = 0.65;
const BANNER_SEGMENTS = 16;
const BANNER_WAVE_AMPLITUDE = 0.15;
const BANNER_WAVE_SPEED = 3.0;
const BANNER_WAVE_FREQ = 2.5;

let planeGroup = null;
let bannerMesh = null;
let bannerBasePositions = null;
let bannerTime = 0;
let cycleTime = 0;
let propellerGroup = null;

function createBannerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e9dec8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#d2c1a5';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

    ctx.strokeStyle = '#8a7b66';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    ctx.fillStyle = '#2c2620';
    ctx.font = '900 112px "Georgia", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = 'Solvitur Ambulando';
    const maxTextWidth = canvas.width - 120;
    const measured = ctx.measureText(text);
    const scaleX = Math.min(1, maxTextWidth / Math.max(1, measured.width));
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scaleX, 1);
    ctx.fillText(text, 0, 0);
    ctx.restore();

    const texture = new CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.encoding = sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
}

function createBanner() {
    const geometry = new PlaneGeometry(BANNER_WIDTH, BANNER_HEIGHT, BANNER_SEGMENTS, 6);
    // Place the attachment edge at x = 0 so the banner trails backward (negative X)
    geometry.translate(-BANNER_WIDTH / 2, 0, 0);

    const bannerTexture = createBannerTexture();
    const material = new MeshStandardMaterial({
        map: bannerTexture,
        emissiveMap: bannerTexture,
        transparent: true,
        roughness: 0.9,
        metalness: 0.05,
        emissive: 0xffffff,
        emissiveIntensity: 0.15
    });

    const front = new Mesh(geometry, material);
    front.castShadow = true;
    front.receiveShadow = true;

    const back = new Mesh(geometry, material);
    back.rotation.y = Math.PI;
    back.castShadow = true;
    back.receiveShadow = true;

    const group = new Group();
    group.add(front);
    group.add(back);

    bannerMesh = front;
    bannerBasePositions = geometry.attributes.position.array.slice();

    return group;
}

function createTriplane() {
    const group = new Group();

    const bodyMat = new MeshStandardMaterial({
        color: 0xb31212,
        roughness: 0.55,
        metalness: 0.1,
        emissive: 0x3a0505,
        emissiveIntensity: 0.25
    });
    const wingMat = new MeshStandardMaterial({
        color: 0xc01717,
        roughness: 0.6,
        metalness: 0.08,
        emissive: 0x4a0707,
        emissiveIntensity: 0.2
    });
    const strutMat = new MeshStandardMaterial({
        color: 0x7a3a3a,
        roughness: 0.7,
        metalness: 0.1
    });
    const metalMat = new MeshStandardMaterial({
        color: 0xc2c9cf,
        roughness: 0.3,
        metalness: 0.75
    });

    // Fuselage (longer, with nose)
    const fuselage = new Mesh(new CylinderGeometry(0.18, 0.25, 4.1, 16), bodyMat);
    fuselage.rotation.z = MathUtils.degToRad(90);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    group.add(fuselage);

    const cowling = new Mesh(new CylinderGeometry(0.26, 0.22, 0.5, 16), metalMat);
    cowling.rotation.z = MathUtils.degToRad(90);
    cowling.position.x = 2.1;
    cowling.castShadow = true;
    group.add(cowling);

    // Main wings (three stacked)
    const wingGeom = new BoxGeometry(1.1, 0.08, 3.6);
    const wingY = [-0.35, 0, 0.35];
    wingY.forEach((y) => {
        const wing = new Mesh(wingGeom, wingMat);
        wing.position.set(0.5, y, 0);
        wing.castShadow = true;
        wing.receiveShadow = true;
        group.add(wing);
    });

    // Struts (vertical)
    const strutGeom = new BoxGeometry(0.06, 0.7, 0.06);
    const strutX = [-0.6, 0.6];
    const strutZ = [-0.6, 0.6];
    strutX.forEach((x) => {
        strutZ.forEach((z) => {
            const strut = new Mesh(strutGeom, strutMat);
            strut.position.set(x, 0, z);
            strut.castShadow = true;
            group.add(strut);
        });
    });

    // Tailplane + fin
    const tailplane = new Mesh(new BoxGeometry(1.2, 0.07, 0.5), wingMat);
    tailplane.position.set(-2.0, 0.05, 0);
    tailplane.castShadow = true;
    group.add(tailplane);

    const fin = new Mesh(new BoxGeometry(0.06, 0.55, 0.3), wingMat);
    fin.position.set(-2.1, 0.32, 0);
    fin.castShadow = true;
    group.add(fin);

    // Landing gear
    const gearLegGeom = new BoxGeometry(0.05, 0.35, 0.05);
    const gearWheelGeom = new CylinderGeometry(0.12, 0.12, 0.08, 10);
    const wheelMat = new MeshStandardMaterial({
        color: 0x2f2f2f,
        roughness: 0.9,
        metalness: 0.0
    });

    [-0.25, 0.25].forEach((z) => {
        const leg = new Mesh(gearLegGeom, strutMat);
        leg.position.set(0.7, -0.35, z);
        leg.castShadow = true;
        group.add(leg);

        const wheel = new Mesh(gearWheelGeom, wheelMat);
        // Align wheel axis with fuselage (X axis)
        wheel.rotation.set(0, MathUtils.degToRad(90), MathUtils.degToRad(90));
        wheel.position.set(0.7, -0.55, z);
        wheel.castShadow = true;
        group.add(wheel);
    });

    // Propeller
    propellerGroup = new Group();
    propellerGroup.position.set(2.35, 0, 0);
    group.add(propellerGroup);

    const propHub = new Mesh(new CylinderGeometry(0.05, 0.05, 0.12, 8), metalMat);
    propHub.rotation.z = MathUtils.degToRad(90);
    propHub.castShadow = true;
    propellerGroup.add(propHub);

    const propBladeGeom = new BoxGeometry(0.06, 0.8, 0.04);
    const blade1 = new Mesh(propBladeGeom, strutMat);
    blade1.position.set(0.1, 0, 0);
    blade1.castShadow = true;
    propellerGroup.add(blade1);

    const blade2 = blade1.clone();
    blade2.rotation.x = MathUtils.degToRad(90);
    propellerGroup.add(blade2);

    return group;
}

export function Start() {
    triplaneBanner.clear();
    bannerTime = 0;
    cycleTime = 0;
    propellerGroup = null;

    planeGroup = createTriplane();
    const bannerGroup = createBanner();

    const bannerOffset = new Vector3(-2.2, -0.15, 0);
    bannerGroup.position.copy(bannerOffset);
    planeGroup.add(bannerGroup);

    triplaneBanner.add(planeGroup);
    triplaneBanner.visible = false;
}

export function Update(deltaTime) {
    if (!planeGroup || !bannerMesh || !bannerBasePositions) return;

    cycleTime += deltaTime;
    const inFlight = (cycleTime % FLIGHT_INTERVAL) < FLIGHT_DURATION;

    triplaneBanner.visible = inFlight;

    if (!inFlight) return;

    const t = (cycleTime % FLIGHT_INTERVAL) / FLIGHT_DURATION;
    const x = MathUtils.lerp(FLIGHT_START_X, FLIGHT_END_X, t);

    planeGroup.position.set(x, FLIGHT_ALTITUDE, FLIGHT_DEPTH);
    planeGroup.rotation.set(0, 0, MathUtils.degToRad(2));

    if (propellerGroup) {
        propellerGroup.rotation.x += deltaTime * 18.0;
    }

    bannerTime += deltaTime;
    const positionAttr = bannerMesh.geometry.attributes.position;
    const positions = positionAttr.array;

    for (let i = 0; i < positions.length; i += 3) {
        const baseX = bannerBasePositions[i];
        const baseY = bannerBasePositions[i + 1];
        const baseZ = bannerBasePositions[i + 2];

        const xFactor = MathUtils.clamp((baseX + BANNER_WIDTH) / BANNER_WIDTH, 0, 1);
        const wave = Math.sin(bannerTime * BANNER_WAVE_SPEED + baseX * BANNER_WAVE_FREQ + baseY * 2.0);
        positions[i + 2] = baseZ + wave * BANNER_WAVE_AMPLITUDE * xFactor;
    }

    positionAttr.needsUpdate = true;
    bannerMesh.geometry.computeVertexNormals();
}
