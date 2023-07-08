import sketch, { debug } from '/lib/Sketch';

import {
  WebGLRenderTarget,
  RepeatWrapping,
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
  OrthographicCamera,
} from 'three';

import { gui, GuiUniforms } from '/lib/gui';
import Feedback from '/lib/Feedback';
import QuadFrame from '/lib/QuadFrame';
import NoiseFrame from '/lib/NoiseFrame';
import Frame from '/lib/Frame';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'

import opacityFrag from '/shaders/opacity.frag.glsl?raw';
import tmpFrag from './tmp.frag.glsl?raw';
import mathGlsl from '/shaders/math.glsl?raw';
import velCompGlsl from './vel.comp.glsl?raw';
import ferCompGlsl from './fer.Comp.glsl?raw';
import { insertAfter } from '/lib/utils';

import createInstances from './instances.js';

// const testTex = new TextureLoader().load('/assets/boxMap.jpg');

const countSq = 400;

const initVelFrame = new NoiseFrame({ name: 'initVel', size: countSq });
initVelFrame.render();
const initPosFrame = new NoiseFrame({ name: 'initPos', size: countSq, range: [0, 1] });
initPosFrame.render();

const velNoiseFrame = new NoiseFrame({ name: 'velNoise', size: countSq,
  uniforms: { speed: .16, lacunarity: 0.82 },
});
velNoiseFrame.render();

// POS

const posFB = new Feedback({
  initTexture: initPosFrame.texture,
  size: countSq,
  uniforms: GuiUniforms('posFB', {
    uSpeed: 1,
  }, {
    tVel: null,
    aspect: sketch.W / sketch.H,
  }),
  shader: {
    compute: `
    const float SPEED = .001;
    uniform float uSpeed;
    uniform sampler2D tVel;
    ${mathGlsl}
    vec4 compute () {
      vec2 pos = texture2D(tPrev, vUv).xy + texture2D(tVel, vUv).xy * uSpeed * SPEED;
      // pos = toRangeFract(vec2(-aspect, -1), vec2(aspect, 1), pos);
      pos = fract(pos);
      return vec4(pos, .0, 1.);
    }`,
  }
});

// debug(posFB.textureOld)
// debug(initVelFrame)
// debugger;

const velFB = new Feedback({
  initTexture: initVelFrame.texture,
  size: countSq,
  uniforms: GuiUniforms('velFB', {
    uSensorAng: [45, 0, 180, .5],
    uSensorDist: [0.01, -.1, .5, 0.001],
    uSensorFerLimit: [1., 0, 5, .1],
    uTurnAng: [20, 0, 180, .5],
    uSpeed: [2, 0, 10, .01],
    uNoiseStr: [1, 0, 1, .01],
  }, {
    tPos: posFB.texture,
    tFer: null,
    tVelNoise: velNoiseFrame.texture,

    aspect: sketch.W / sketch.H,
    uPointer: { x: -10, y: -10 },
  }).open(),
  shader: {
    // damping: false,
    compute: velCompGlsl,
  }
});

posFB.uniforms.tVel.value = velFB.texture;

window.addEventListener('pointermove', e => {
  let { pageX: x, pageY: y } = e;
  x = ((x / sketch.W));
  y = (1 - (y / sketch.H));
  velFB.uniforms.uPointer.value = { x, y };
});

let pause = false;
function reset () {
  initVelFrame.quad.material.uniforms.seed.value = Math.random() * 1e3;
  initVelFrame.render();
  initPosFrame.render();
  ferFB.reset();
  posFB.initWithTexture();
  velFB.initWithTexture();
}
window.addEventListener('keydown', e => {
  if (e.key === 'r') reset();
  if (e.code === 'Space') pause = !pause;
});

// INSTANCES
const agents = createInstances(countSq, posFB.texture);
sketch.scene.add(agents);
sketch.camera = new OrthographicCamera(0, 1, 1, 0, 0, 50);

const sceneFrame = new Frame({
  width: sketch.W, height: sketch.H,
  type: HalfFloatType,
});

const ferFB = new Feedback({
  width: sketch.W / sketch.dpi,
  height: sketch.H / sketch.dpi,
  wrap: RepeatWrapping,
  filter: LinearFilter,
  uniforms: GuiUniforms('ferFB', {
    opacity: [.98, 0.9, 1., .001],
    blur: [1.5, -1, 4.5, .01],
  }, {
    tInput: sceneFrame.texture,
  }),
  shader: {
    compute: ferCompGlsl,
  }
});

sketch.addEventListener('resize', () => {
  const { W, H } = sketch;
  const aspect = W / H;
  sceneFrame.setSize(W, H);
  ferFB.setSize(W / sketch.dpi, H / sketch.dpi);
  posFB.uniforms.aspect.value = aspect;
});

// posFB.uniforms.tFer.value = ferFB.texture;

// const composer = new EffectComposer(sketch.renderer);
// composer.addPass(new RenderPass(sketch.scene, sketch.camera));
// composer.addPass(new AfterimagePass(.99));

sketch.initStats();
sketch.startRaf(({ now, elapsed, delta }) => {
  if (pause) return;
  // console.time('sketch.render');
  velNoiseFrame.quad.material.uniforms.time.value = elapsed/2;
  velNoiseFrame.render();
  posFB.render();
  velFB.uniforms.tPos.value = posFB.texture;

  velFB.render();

  agents.material.uniforms.tPos.value = posFB.texture;
  // agents.material.uniforms.tPos.value = velNoiseFrame.texture;
  sceneFrame.render(sketch);
  ferFB.render();
  velFB.uniforms.tFer.value = ferFB.texture;
  sketch.render();
  // composer.render();
  debug(ferFB);
  // debug(sceneFrame);
  // debug(velFB);
  // debug(posFB);
  // console.timeEnd('sketch.render');
});

export default {};
