import sketch from '/lib/Sketch';

import {
  CircleGeometry,
  BufferAttribute,
  ShaderMaterial,
  Mesh,
  InstancedMesh,
  OrthographicCamera,
  MeshBasicMaterial,
  DoubleSide,
  BoxGeometry,
  DynamicDrawUsage,
  Object3D,
  Vector3,
  Color,
} from 'three';
import { gui, Presets } from '/lib/gui';
import { insertAfter, callnpass, rand, toFixed, modifyShader, modifyMatShader, hash2 } from '/lib/utils';
import InstancingTransforms from '/lib/InstancingTransforms';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

import QuadFrame from '/lib/QuadFrame';
import defaultUvVertGlsl from '/shaders/defaultUv.vert.glsl?raw';

import pulseFragModGlsl from './pulse.frag.mod.glsl?raw';
import gradientGlsl from './gradient.frag.glsl?raw';

import _circlesData from './circles.json';

sketch
  .initGui({ reset: false })
  .initKeys();
sketch.dpi = 1;
// sketch.renderer.domElement.style.filter = 'blur(.5px)';
const circlesData = _circlesData.reduce((m, d, i) => {
  if (!(i % 2)) m.push(d);
  return m;
}, []);

const PARS = {
  size: 1,
  rotateStep: 0,
  rotateSpeed: 5,
  origin: false,
  colorStart: { value: new Color(0x112256) },
  colorStop: { value: new Color(0x24507a) },
  pulseLerp: { value: 0 },
  pulseWidth: { value: .8 },
  pulseDuration: 2,
  pulseInterval: 5,
  pulseIntervalRand: 1,
  pulse,
  pulsePlay: true,
};
const INFO = {
  camRot: '',
  camPos: '',
}

function toggleOrigin (v = PARS.origin) { console.log(v);sketch.scene[v?'add':'remove'](testMesh) }
gui.add(PARS, 'origin').onChange(toggleOrigin);
gui.add(PARS, 'size', .0001, 10, .001).onChange(setScale);
gui.add(PARS, 'rotateStep', 0, 100, .1).onChange(setRotation);
gui.add(PARS, 'rotateSpeed', 0, 50, .001).onChange(v => v === 0 && setRotation());
gui.addColor(PARS.colorStart, 'value').name('colorStart')
  .onChange(v => albedo.render());
gui.addColor(PARS.colorStop, 'value').name('colorStop')
  .onChange(v => albedo.render());
gui.add(PARS.pulseLerp, 'value', 0, 1, .001).name('pulseLerp').listen();
gui.add(PARS.pulseWidth, 'value', 0, 2, .001).name('pulseWidth').listen();
gui.add(PARS, 'pulseDuration', 0.001, 10, .01);
gui.add(PARS, 'pulse');
gui.add(PARS, 'pulseInterval', 0.1, 30, .01).onChange(pulseInterval);
gui.add(PARS, 'pulseIntervalRand', 0, 10, .1);
gui.add(PARS, 'pulsePlay').onChange(v => v ? pulseInterval() : clearTimeout(pulseIi));
function animatePulse ({ delta }) {
  PARS.pulseLerp.value += delta / PARS.pulseDuration;
  if (PARS.pulseLerp.value > 1.) {
    sketch.off('render', animatePulse);
    PARS.pulseLerp.value = 0;
  }
}
gui.add(INFO, 'camRot').listen();
gui.add(INFO, 'camPos').listen();

let pulseIi;
function pulseInterval (
  time = PARS.pulseInterval + PARS.pulseDuration + rand(-1)*PARS.pulseIntervalRand
) {
  clearTimeout(pulseIi);

  pulseIi = setTimeout(() => {
    console.log('pulseInterval.pulse')
    PARS.pulse();
    pulseInterval();
  }, time * 1e3);
}
pulseIi = pulseInterval();

const COUNT = circlesData.length;
console.log({COUNT})

const circleGeo = new CircleGeometry(.4, 64);
const offsetAttr = new Float32Array(COUNT * 3);
for (let k = 0; k < COUNT; k += 3) {
  const i = k * 3;
  offsetAttr[i] = circlesData[k][0];
  offsetAttr[i+1] = circlesData[k][1];
  offsetAttr[i+2] = 0;
}
circleGeo.setAttribute('offset', new BufferAttribute(offsetAttr, 3));

const albedo = new QuadFrame({
  type: sketch.computeTextureType,
  size: 500,
  material: new ShaderMaterial({
    uniforms: {
      colorStart: PARS.colorStart,
      colorStop: PARS.colorStop,
    },
    fragmentShader: gradientGlsl,
    vertexShader: defaultUvVertGlsl,
  }),
}).render();

const mat = new MeshBasicMaterial({ side: DoubleSide,
  map: albedo.texture });

modifyMatShader(mat, {
  uniforms: {
    pulseLerp: PARS.pulseLerp,
    pulseWidth: PARS.pulseWidth,
  },
  vertex: `//! PREPEND
    varying float vInstanceZ;

    //! INSERT_AFTER #include <uv_vertex>
    vInstanceZ = instanceMatrix[3][2];
  `,
  fragment: pulseFragModGlsl,
});

const mesh = new InstancedMesh(circleGeo, mat, COUNT);
mesh.rotation.z = Math.PI;
mesh.instanceMatrix.setUsage( DynamicDrawUsage );

const instanceIds = new BufferAttribute(new Float32Array(COUNT), 1);

const transforms = new InstancingTransforms(COUNT, mesh);
transforms.forEach((t, i) => {
  t.position.set(
    circlesData[i][0] * .001,
    circlesData[i][1] * .001,
    1 - i / COUNT,
  );
});
setScale();
setRotation();

mesh.scale.multiplyScalar(1.4);
mesh.position.set(1.8, 1, 0);
sketch.scene.add(mesh);
sketch.scene.position.z = 2;

const camera = sketch.camera = new OrthographicCamera(-1, 1, 1, -1, .000001, 50);
sketch.camera.position.z = -2;

const testMesh = new Object3D();
const testMesh1 = new Mesh(
  new BoxGeometry(),
  new MeshBasicMaterial({ color: 0xff6600, wireframe: true }),
);
const testMesh2 = testMesh1.clone();
testMesh2.scale.multiplyScalar(.5);
testMesh.add(testMesh1).add(testMesh2);
toggleOrigin();

sketch.scene.background = albedo.texture;

const orbit = new OrbitControls(sketch.camera, sketch.renderer.domElement);
orbit.listenToKeyEvents( window );

handleResize();
sketch.on('resize', handleResize);

sketch.initStats();
pulse();

const camPivot = new Object3D(0, 0, 2);
sketch.scene.add(camPivot);
camPivot.add(sketch.camera);
const camVel = new Vector3();
const origin = new Vector3(0, 0, 2);

sketch.startRaf(({ now, elapsed, delta }) => {
  if (PARS.rotateSpeed !== 0)
    transforms.forEach(t => t.rotation.z += PARS.rotateSpeed / 1e3);

  (() => {
    const drv = .0001;
    camVel.add({ x: rand(-drv,drv), y: rand(-drv,drv), z: 0 });
    camVel.clampLength(0, .01);

    const nextPos = camPivot.position.clone().add(camVel);
    const nextPosLen = nextPos.length();

    const posLim = .1;
    if (nextPosLen > posLim)
      nextPos.multiplyScalar(1 / (posLim * 2 - nextPosLen))
    camPivot.position.add(camVel, nextPos);
    camPivot.position.clampLength(0, posLim);
    camera.lookAt(origin);
    camera.updateMatrix();
  })();

  (() => {
    const { camera: c } = sketch;
    const r = c.rotation;
    INFO.camRot = `${toFixed(r.x)},${toFixed(r.y)},${toFixed(r.z)}`;
    const p = c.position;
    INFO.camPos = `${toFixed(p.x)},${toFixed(p.y)},${toFixed(p.z)},${toFixed(c.zoom)}`;
  })()

  sketch.render();
});

function pulse () {
  PARS.pulseLerp.value = 0;
  sketch.off('render', animatePulse);
  sketch.on('render', animatePulse);
}

function setScale (v = PARS.size) {
  transforms.forEach(({ scale }, i) => {
    const s = v + (1 - i / COUNT) * .6 * v; // from ref
    scale.set(s, s, 1);
  })
}
function setRotation (v = PARS.rotateStep) {
  const rad = v / Math.PI;
  transforms.forEach(({ rotation }, i) => rotation.set(0, 0, i * rad / 1000));
}

function handleResize ({ size } = sketch) {
  console.log('handleResize', size)
  const aspect = size.x / size.y;
  sketch.camera.right = aspect;
  sketch.camera.left = -aspect;
  sketch.camera.updateProjectionMatrix();
}