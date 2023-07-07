import sketch, { debug } from '/lib/Sketch';

import {
  WebGLRenderTarget,
  LinearFilter,
  NearestFilter,
  ShaderMaterial,
  TextureLoader,
  InstancedBufferAttribute,
  Scene,
  FloatType,
  HalfFloatType,
  Color,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
} from 'three';

import { GuiUniforms } from '/lib/gui';
import Feedback from '/lib/Feedback';
import QuadFrame from '/lib/QuadFrame';
import Frame from '/lib/Frame';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'

import defaultUvVert from '/shaders/defaultUv.vert.glsl?raw';
import opacityFrag from '/shaders/opacity.frag.glsl?raw';
import mxNoiseGlsl from '/lib/mx-noise.glsl?raw';
import tmpFrag from './tmp.frag.glsl?raw';
import positionCompGlsl from './position.comp.glsl?raw';
import ferCompGlsl from './fer.Comp.glsl?raw';

import createInstances from './instances.js';

const testTex = new TextureLoader().load('/assets/boxMap.jpg');
const noiseFragGlsl = tmpFrag.replace('// <functions>', mxNoiseGlsl);

const amountSq = 200;

const noiseMat = new ShaderMaterial({
  uniforms: GuiUniforms('velNoise', {
    octaves: 2,
    lacunarity: 5,
    diminish: .5,
    scale: 3,
  }, {
    time: 0,
  }),
  vertexShader: defaultUvVert,
  fragmentShader: noiseFragGlsl,
});

const velFrame = new QuadFrame({
  ...QuadFrame.computeOpts,
  size: amountSq,
  material: noiseMat,
});

// POS

const posFB = new Feedback({ size: amountSq,
  uniforms: GuiUniforms('posFB', {
    uSensorAng: [45, 0, 180, .5],
    uSensorLod: [.01, 0, 1, .001],
    uSensorDist: [0.005, -.1, .5, 0.001],
    uSensorFerLimit: [1., 0, 5, .1],
    uTurnAng: [45, 0, 180, .5],
    uSpeed: [2, 0, 10, .01],
  }, {
    tInput: velFrame.texture,
    tFer: null,

    uPointer: { x: -10, y: -10 },
  }).open(),
  shader: {
    // damping: false,
    compute: positionCompGlsl,
  }
});

window.addEventListener('pointermove', e => {
  let { pageX: x, pageY: y } = e;
  x = ((x / sketch.W) * 2 - 1);
  y = (1 - (y / sketch.H)) * 2 - 1;
  posFB.uniforms.uPointer.value = { x, y };
});

let pause = false;
window.addEventListener('keydown', e => {
  if (e.key === 'r') posFB.reset();
  if (e.code === 'Space') pause = !pause;
});

// INSTANCES
const mesh = createInstances(amountSq/*, posFB.texture*/);
sketch.scene.add(mesh);
sketch.scene.position.z = -2;

const sceneFrame = new Frame({ width: sketch.W, height: sketch.H, type: HalfFloatType });

const ferFB = new Feedback({
  width: sketch.W / sketch.dpi,
  height: sketch.H / sketch.dpi,
  type: LinearFilter,
  uniforms: GuiUniforms('ferFB', {
    opacity: [.99, 0.9, 1., .001],
  }, {
    tInput: sceneFrame.texture,
  }),
  shader: {
    compute: ferCompGlsl,
  }
});

// posFB.uniforms.tFer.value = ferFB.texture;

// const composer = new EffectComposer(sketch.renderer);
// composer.addPass(new RenderPass(sketch.scene, sketch.camera));
// composer.addPass(new AfterimagePass(.99));

sketch.initStats();
sketch.startRaf(({ now, elapsed, delta }) => {
  if (pause) return;
  console.time('sketch.render');
  noiseMat.uniforms.time.value = elapsed/2;
  velFrame.render();
  posFB.render();

  mesh.material.uniforms.tPos.value = posFB.texture;
  sceneFrame.render(sketch);
  ferFB.render();
  posFB.uniforms.tFer.value = ferFB.texture;
  // sketch.render();
  // composer.render();
  debug(ferFB);
  console.timeEnd('sketch.render');
});

export default {};
