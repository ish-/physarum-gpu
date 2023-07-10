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
  Vector4,
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
import { insertAfter, Arr } from '/lib/utils';
import { palettes, paletteGlsl } from '/lib/PaletteGlsl';

import createInstances from './instances.js';
// import { $video, videoTexture } from './cameraMedia';
// import edgeGlsl from '/shaders/edge.glsl';
import { blocks, scroll, initBlockDim } from './blocks';
import blocksGlsl from './blocks.glsl';

// const testTex = new TextureLoader().load('/assets/boxMap.jpg');
Object.assign(sketch.renderer.domElement.style, {
  position: 'absolute',
  zIndex: -1,
});
let aspect = sketch.W / sketch.H;
let pointer = { x: -10, y: -10, z: 0 };
const countSq = parseInt(window.location.hash.split('#')?.[1]) || 200;

const actions = {
  'reset (R)': reset,
  'fullscreen (F)': () => sketch.setFullscreen(),
  'hide panels (H)': () => sketch.hidePanels(),
}
gui.add(actions, 'reset (R)');
gui.add(actions, 'fullscreen (F)');
gui.add(actions, 'hide panels (H)');

const initVelFrame = new NoiseFrame({ name: 'initVel', size: countSq, normalize: true })
  .render();
const initPosFrame = new NoiseFrame({
  name: 'initPos', size: countSq,
  range: new Vector2(0, aspect)
}).render();

// const initVelFrame = new QuadFrame({
//   name: 'initVelFrame',
//   material: new ShaderMaterial({
//     uniforms: {
//       resolution: { value: sketch.size },
//     },
//     vertexShader: rawVertGlsl,
//     fragmentShader: `
//       varying vec2 vUv;
//       void main () { gl_FragColor = vec4(vUv, 0., 1.); }
//     `,
//   }),
// }).render();

const velNoiseFrame = new NoiseFrame({ name: 'velNoise', size: countSq,
  uniforms: { speed: .16, lacunarity: 0.82 },
});
velNoiseFrame.render();

// POS

const posFB = new Feedback({
  initTexture: initPosFrame.texture,
  size: countSq,
  uniforms: GuiUniforms('posFB', {
  }, {
    uSpeed: 1,
    tVel: null,
    aspect,
  }),
  shader: {
    compute: `
    const float SPEED = .001;
    uniform float uSpeed;
    uniform sampler2D tVel;
    ${mathGlsl}
    vec4 compute () {
      vec2 pos = texture2D(tPrev, vUv).xy + texture2D(tVel, vUv).xy * uSpeed * SPEED;
      pos = toRangeFract(vec2(0., 0.), vec2(aspect, 1), pos);

      return vec4(pos, .0, 1.);
    }`,
  }
});



const velFB = new Feedback({
  initTexture: initVelFrame.texture,
  size: countSq,
  uniforms: GuiUniforms('velFB', {
    uSensorAng: [45, 0.5, 179.5, .5],
    uSensorDist: [0.01, -.1, .2, 0.001],
    uSensorFerLimit: [1., 0, 5, .001],
    uMaxTurnAng: [20, 0, 180, .5],
    uSpeed: [2, 0.001, 10, .001],
    uNoiseStr: [.6, 0, 1, .01],
    uInteractive: true,
  }, {
    tPos: posFB.texture,
    tFer: null,
    tVelNoise: velNoiseFrame.texture,
    sceneRes: sketch.size,

    aspect,
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
  if (e.key === 'f') sketch.setFullscreen();
  if (e.key === 'h') sketch.hidePanels();
  if (e.code === 'Space') pause = !pause;
});
// INSTANCES
const agents = createInstances(countSq, posFB.texture, aspect);
sketch.scene.add(agents);
sketch.camera = new OrthographicCamera(0, 1, 1, 0, 0, 50);

const sceneFrame = new Frame({
  name: 'sceneFrame',
  // width: sketch.W, height: sketch.H,
  type: sketch.computeTextureType,
});

const ferFB = new Feedback({
  width: sketch.W / sketch.dpi,
  height: sketch.H / sketch.dpi,
  // wrap: RepeatWrapping,
  filter: LinearFilter,
  uniforms: GuiUniforms('ferFB', {
    opacity: [.98, 0.9, 1., .001],
    // blur: [0., 0., 2., .01],
  }, {
    // tVideo: videoTexture,
    uSensorFerLimit: velFB.uniforms.uSensorFerLimit,
    tInput: sceneFrame.texture,
    uPointer: pointer,
    uBlocks: { value: Arr(20).map(_ => new Vector4(...initBlockDim)) },
  }).open(),
  shader: {
    compute: blocksGlsl + /*edgeGlsl + */ferCompGlsl,
  }
});


const postFx = new QuadFrame({
  name: 'postFx',
  type: FloatType,
  material: new ShaderMaterial({
    uniforms: GuiUniforms('postFx', {
      use: false,
      uPalette: {
        value: palettes[0],
        opts: palettes.reduce((opts, p, i) => Object.assign(opts, { [`Palette ${i}`]: p }), {}),
      },
      uAnimSpeed: [1., -2, 20, .01],
      uPow: [1., 0.1, 2, .001],
      uMix: [.9, -1, 2, .01],
    }, {
      resolution: { value: { x: sketch.W, y: sketch.H } },
      tColor: { value: ferFB.texture },
      time: { value: 0 },
    }).open(),
    vertexShader: rawVertGlsl,
    fragmentShader: `
      precision highp float;
      uniform vec3 uPalette[4];
      uniform sampler2D tColor;
      // uniform float uAnimSpeed;
      uniform float uPow;
      uniform float time;
      uniform float uMix;
      varying vec2 vUv;
      ${ paletteGlsl }
      void main () {
        vec4 col = texture2D(tColor, vUv);
        vec3 pCol = palette(pow(col.r, uPow) + time, uPalette[0], uPalette[1], uPalette[2], uPalette[3]);
        pCol = clamp(pCol, 0., 1.);
        pCol = mix(col.rgb, pCol, uMix);
        gl_FragColor = vec4((pCol/* + col.rgb*/) / 2., 1.);
      }
    `,
  }),
});

// postFx.render();
// debug(postFx);
// debugger;

sketch.addEventListener('resize', () => {
  const { W, H } = sketch;
  aspect = W / H;
  // sceneFrame.setSize(W, H);
  initPosFrame.material.uniforms.range.y = aspect;
  ferFB.setSize(W, H);
  velFB.uniforms.aspect.value = aspect
  posFB.uniforms.aspect.value = aspect;
  agents.material.uniforms.aspect.value = aspect;
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

  for (let i = 0; i < 3; i++) {
    posFB.render();
    velFB.uniforms.tPos.value = posFB.texture;

    velFB.render();

    agents.material.uniforms.tPos.value = posFB.texture;
    // agents.material.uniforms.tPos.value = velNoiseFrame.texture;
    sceneFrame.render(sketch);
    ferFB.render();
    velFB.uniforms.tFer.value = ferFB.texture;
  }

  if (postFx.material.uniforms.use.value) {
    postFx.material.uniforms.time.value += delta/20
      * postFx.material.uniforms.uAnimSpeed.value;
    postFx.render();
    debug(postFx);
  } else
    debug(ferFB);

  // sketch.render();
  // composer.render();
  // debug(sceneFrame);
  // debug(velFB);
  // debug(posFB);
  // console.timeEnd('sketch.render');
    handleBlocks();
});

function handleBlocks () {
  let i = 0;
  for (let $el of blocks) {
    const dim = $el.getBoundingClientRect();
    const hw = dim.width/2;
    const hh = dim.height/2;
    ferFB.uniforms.uBlocks.value[i].set(dim.x + hw, dim.y + hh, hw, hh).divideScalar(sketch.dpi);
    i++;
  }
  for (; i < 20; i++)
    ferFB.uniforms.uBlocks.value[i].set(...initBlockDim);
}

export default {};
