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
  Vector2,
  FloatType,
  HalfFloatType,
  Color,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  OrthographicCamera,
  RawShaderMaterial,
} from 'three';

import { gui, GuiUniforms } from '/lib/gui';
import Feedback from '/lib/Feedback';
import QuadFrame from '/lib/QuadFrame';
import NoiseFrame from '/lib/NoiseFrame';
import Frame from '/lib/Frame';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'

import defaultUvVertGlsl from '/shaders/defaultUv.vert.glsl';
import opacityFrag from '/shaders/opacity.frag.glsl?raw';
import tmpFrag from './tmp.frag.glsl?raw';
import mathGlsl from '/shaders/math.glsl?raw';
import velCompGlsl from './vel.comp.glsl?raw';
import ferCompGlsl from './fer.Comp.glsl?raw';
import rawVertGlsl from '/shaders/raw.vert.glsl?raw';
import { insertAfter } from '/lib/utils';
import { palettes, paletteGlsl } from '/lib/PaletteGlsl';

import createInstances from './instances.js';

// const testTex = new TextureLoader().load('/assets/boxMap.jpg');

let pointer = { x: -10, y: -10, z: 0 };
const countSq = 400;

const initVelFrame = new NoiseFrame({ name: 'initVel', size: countSq });
initVelFrame.render();
const initPosFrame = new NoiseFrame({ name: 'initPos', size: countSq, range: new Vector2(0, 1) });
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
    uPointer: pointer,
  }).open(),
  shader: {
    // damping: false,
    compute: velCompGlsl,
  }
});

posFB.uniforms.tVel.value = velFB.texture;

window.addEventListener('pointerdown', e => pointer.z = 1);
window.addEventListener('pointerup', e => pointer.z = 0);
window.addEventListener('pointermove', e => {
  let { pageX: x, pageY: y } = e;
  pointer.x = ((x / sketch.W));
  pointer.y = (1 - (y / sketch.H));
});

let pause = false;
function reset () {
  initVelFrame.quad.material.uniforms.seed.value = Math.random() * 1e3;
  initVelFrame.render();
  initPosFrame.render();
  posFB.initWithTexture();
  velFB.initWithTexture();
  ferFB.reset();
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
  // width: sketch.W, height: sketch.H,
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
    uPointer: pointer,
  }),
  shader: {
    compute: ferCompGlsl,
  }
});

const paletteQFrame = new QuadFrame({
  type: HalfFloatType,
  material: new ShaderMaterial({
    uniforms: GuiUniforms('Palette', {
      use: false,
      uPalette: {
        value: palettes[0],
        opts: palettes.reduce((opts, p, i) => Object.assign(opts, { [`Palette ${i}`]: p }), {}),
      },
      uAnimSpeed: 1.,
      uPow: [1., 0.1, 2, .001],
    }, {
      resolution: { value: { x: sketch.W, y: sketch.H } },
      tColor: { value: ferFB.texture },
      time: { value: 0 },
    }),
    vertexShader: rawVertGlsl,
    fragmentShader: `
      precision highp float;
      uniform vec3 uPalette[4];
      uniform sampler2D tColor;
      uniform float uAnimSpeed;
      uniform float uPow;
      uniform float time;
      varying vec2 vUv;
      ${ paletteGlsl }
      void main () {
        vec4 col = texture2D(tColor, vUv);
        vec3 pCol = palette(pow(col.r, uPow) + time * uAnimSpeed, uPalette[0], uPalette[1], uPalette[2], uPalette[3]);
        pCol = clamp(pCol, 0., 1.);
        gl_FragColor = vec4((pCol/* + col.rgb*/) / 2., 1.);
      }
    `,
  }),
});

// paletteQFrame.render();
// debug(paletteQFrame);
// debugger;

sketch.addEventListener('resize', () => {
  const { W, H } = sketch;
  const aspect = W / H;
  sceneFrame.setSize(W, H);
  ferFB.setSize(W, H);
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
  velNoiseFrame.material.uniforms.time.value = elapsed/2;
  velNoiseFrame.render();
  posFB.render();
  velFB.uniforms.tPos.value = posFB.texture;

  velFB.render();

  agents.material.uniforms.tPos.value = posFB.texture;
  // agents.material.uniforms.tPos.value = velNoiseFrame.texture;
  sceneFrame.render(sketch);
  ferFB.render();
  velFB.uniforms.tFer.value = ferFB.texture;

  if (paletteQFrame.material.uniforms.use.value) {
    paletteQFrame.material.uniforms.time.value = elapsed/20;
    paletteQFrame.render();
    debug(paletteQFrame);
  } else
    debug(ferFB);
  // sketch.render();
  // composer.render();
  // debug(sceneFrame);
  // debug(velFB);
  // debug(posFB);
  // console.timeEnd('sketch.render');
});

export default {};
