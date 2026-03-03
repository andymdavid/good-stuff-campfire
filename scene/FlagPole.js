import {
    Group,
    CylinderGeometry,
    MeshStandardMaterial,
    Mesh,
    PlaneGeometry,
    TextureLoader,
    DoubleSide,
    MathUtils,
    sRGBEncoding,
    DynamicDrawUsage,
    Vector3
} from 'three';
import { campfire } from './Campfire.js';
import { dirToLight } from './Skybox.js';

export const flagPole = new Group();

const POLE_HEIGHT = 3.4;
const POLE_RADIUS = 0.06;
const FLAG_SIZE = 1.4;
const FLAG_SEGMENTS = 16;
const FLAG_Y_OFFSET = 2.2;
const FLAG_WAVE_AMPLITUDE = 0.12;
const FLAG_WAVE_SPEED = 2.2;
const FLAG_WAVE_FREQ_X = 3.0;
const FLAG_WAVE_FREQ_Y = 1.6;

const textureLoader = new TextureLoader();

let flagMesh = null;
let flagBasePositions = null;
let flagTime = 0;
let flagMaterial = null;

const up = new Vector3(0, 1, 0);
const FLAG_EMISSIVE_DAY_BOOST = 0.18;

function createPole() {
    const geometry = new CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 12);
    const material = new MeshStandardMaterial({
        color: 0x9da7b1,
        roughness: 0.6,
        metalness: 0.7
    });
    const pole = new Mesh(geometry, material);
    pole.castShadow = true;
    pole.receiveShadow = true;
    pole.position.y = POLE_HEIGHT / 2;
    return pole;
}

function createFlag() {
    const geometry = new PlaneGeometry(FLAG_SIZE, FLAG_SIZE, FLAG_SEGMENTS, FLAG_SEGMENTS);
    geometry.translate(FLAG_SIZE / 2, 0, 0);
    geometry.attributes.position.usage = DynamicDrawUsage;

    const texture = textureLoader.load('images/Other Stuff - Logo - 3.png');
    texture.encoding = sRGBEncoding;

    const material = new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        side: DoubleSide,
        transparent: true,
        alphaTest: 0.1,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0xffffff,
        emissiveIntensity: 0.0
    });

    const flag = new Mesh(geometry, material);
    flag.castShadow = true;
    flag.receiveShadow = true;
    flag.position.set(0, FLAG_Y_OFFSET, 0);
    flag.rotation.y = MathUtils.degToRad(-10);

    flagMesh = flag;
    flagBasePositions = geometry.attributes.position.array.slice();
    flagMaterial = material;

    return flag;
}

export function Start() {
    console.log("FlagPole: Starting initialization");

    flagPole.clear();
    flagTime = 0;

    const pole = createPole();
    const flag = createFlag();

    flagPole.add(pole);
    flagPole.add(flag);

    // Position behind and to the right of Andy (relative to campfire)
    flagPole.position.copy(campfire.position);
    flagPole.position.x += 3.1;
    flagPole.position.z -= 1.3;

    console.log("FlagPole: Initialization complete");
}

export function Update(deltaTime) {
    if (!flagMesh || !flagBasePositions) return;

    flagTime += deltaTime;
    const positionAttr = flagMesh.geometry.attributes.position;
    const positions = positionAttr.array;

    for (let i = 0; i < positions.length; i += 3) {
        const baseX = flagBasePositions[i];
        const baseY = flagBasePositions[i + 1];
        const baseZ = flagBasePositions[i + 2];

        const xFactor = MathUtils.clamp(baseX / FLAG_SIZE, 0, 1);
        const wave = Math.sin(flagTime * FLAG_WAVE_SPEED + baseX * FLAG_WAVE_FREQ_X + baseY * FLAG_WAVE_FREQ_Y);

        positions[i + 2] = baseZ + wave * FLAG_WAVE_AMPLITUDE * xFactor;
    }

    positionAttr.needsUpdate = true;
    flagMesh.geometry.computeVertexNormals();

    if (flagMaterial) {
        const sunIntensity = dirToLight.dot(up);
        const dayFactor = MathUtils.clamp((sunIntensity + 0.1) * 2, 0, 1);
        flagMaterial.emissiveIntensity = dayFactor * FLAG_EMISSIVE_DAY_BOOST;
    }
}
