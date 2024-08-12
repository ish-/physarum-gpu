import sketch, { debug } from '/lib/Sketch';
import mxNoiseGlsl from '/lib/mx-noise.glsl?raw';
import {
  RepeatWrapping, LinearFilter, ShaderMaterial,
  Vector2, Vector4, OrthographicCamera } from 'three';

import { Arr, lerp, rerange, guiCtrlWidth } from '/lib/utils';
import { GuiUniforms } from '/lib/gui-uniforms';
import { GuiPresets } from '/lib/gui-presets';
import Feedback from '/lib/Feedback';
import QuadFrame from '/lib/QuadFrame';
import NoiseFrame from '/lib/NoiseFrame';
import Frame from '/lib/Frame';

import mathGlsl from '/shaders/math.glsl?raw';
import colorAdjustGlsl from '/shaders/colorAdjust.glsl?raw';
import velCompGlsl from './vel.comp.glsl?raw';
import ferCompGlsl from './fer.Comp.glsl?raw';
import rawVertGlsl from '/shaders/raw.vert.glsl?raw';
import { touchable, onTouchStart, onTouchEnd, onTouchMove } from '/lib/utils';
import { palettes, paletteGlsl } from '/lib/PaletteGlsl';
import { MicAnalyzer } from '/lib/MicAnalyzer';

import createInstances from './instances.js';
import UserCamera from './UserCamera.js';
import edgeGlsl from '/shaders/edge.glsl';
import { blocks, initBlockDim, MAX_BLOCKS } from './blocks';
import blocksGlsl from './blocks.glsl';
import builtinPresets from './presets';

const USE_BLOCKS = 0;
let userCamera;
sketch.zoom = { value: 1 };

// INIT
Object.assign(sketch.renderer.domElement.style, {
  position: 'absolute',
  zIndex: -1,
});
let aspect = sketch.W / sketch.H;

const DEFAULT_COUNT_SQ = touchable ? 80 : 200;
// countSq from url ?query
const countSq = parseInt(window.location.search.split('?')?.[1]) || DEFAULT_COUNT_SQ;

const guiProm = sketch.initGui();
GuiPresets(guiProm, builtinPresets);
GuiUniforms.gui = guiProm;
sketch
  .initKeys()
  .initPointer()
  .initStats();

// THIS CONTROLS
const params = {
  // showBlocks: true,
  agentCountSq: countSq,
  blocksBlur: 0,
  useMic: false,
  micVol: 0,
  useCamera: false,
};

const modulation = {
  micVol: 0,
  micVolMin: .5,
};

let mic;
const micBuf = new Array(20).fill(1);
function micOnRender ({ now }) {
  let vol = mic.getVol(now)/* ** .5*/;
  vol = lerp(modulation.micVol, vol, vol < modulation.micVol ? .07 : 1);
  // modulation.micVol = vol;
  micBuf[Math.floor((now * 100) % 20)] = vol;
  const nextMicVolMin = Math.min(
    micBuf.reduce((min, vol) => Math.min(min, vol), 1),
    .5,
  );
  const micVolMin = lerp(modulation.micVolMin, nextMicVolMin, .1);
  modulation.micVolMin = micVolMin;
  modulation.micVol = rerange(micVolMin, 1, 0, 1, vol);
}

guiProm.then(gui => {
  if (USE_BLOCKS) {
    guiCtrlWidth(30, gui.add(params, 'showBlocks').onChange(v => {
      blocks.setActive(v);
    }));
    guiCtrlWidth(70, gui.add(params, 'blocksBlur', 0, 10, 1).onChange(v => {blocks.setBlur(v)}));
  }
  gui.add(params, 'useMic').onChange(async v => {
    if (v) {
      mic = await new MicAnalyzer();
      sketch.on('render', micOnRender);
    } else {
      sketch.off('render', micOnRender);
      modulation.micVol = 0;
    }
  });
  gui.add(modulation, 'micVol', 0, 1).listen();
  gui.add(modulation, 'micVolMin', 0, 1).listen();
  gui.add(params, 'useCamera').onChange(async v => {
    if (v) {
      if (!userCamera)
        userCamera = new UserCamera();
      userCamera.init()
        .then(() => {
          ferFB.uniforms.tVideo.value = userCamera.texture;
          ferFB.uniforms.useCamera.value = true;
        })
        .catch(() => alert('You have no camera or it is prohibited, try to allow it in the settings!'));
    } else {
      if (userCamera) {
        userCamera.stop();
        ferFB.uniforms.tVideo.value = null;
        ferFB.uniforms.useCamera.value = false;
      }
    }
  });
})



///////////// COMPONENTS
GuiUniforms.skip = true;
const initVelFrame = new NoiseFrame({ name: 'initVel', size: countSq, normalize: true })
  .render();
const initPosFrame = new NoiseFrame({
  name: 'initPos', size: countSq,
  // range: new Vector2(0, aspect)
  // range: new Vector2((aspect / 2) - .1, (aspect / 2) + .1),
  handle: `
    gl_FragColor *= vec4(${ aspect }, 1., 1000., 1.);
  `,
}).render();

const velNoiseFrame = new NoiseFrame({ name: 'velNoise', size: countSq,
  uniforms: { speed: .16, lacunarity: 0.82 },
});
velNoiseFrame.render();
GuiUniforms.skip = false;

const posFB = new Feedback({
  name: 'posFB',
  initTexture: initPosFrame.texture,
  size: countSq,
  uniforms: GuiUniforms('posFB', {
    uCountSq: [countSq, 0, countSq],
    uLife: [0., 0., 200.],
  }, {
    uZoom: 1,
    uPointer: sketch.pointer,
    sceneRes: sketch.size,
    uSpeed: 1,
    tVel: null,
    aspect,
  }),
  shader: {
    compute: `
    const float SPEED = .001;
    uniform float uZoom;
    uniform float uSpeed;
    uniform float uLife;
    uniform sampler2D tVel;
    uniform vec2 sceneRes;
    uniform vec3 uPointer;
    uniform int uCountSq;
    int inxFromUv (ivec2 uv, ivec2 res) {
      return int(uv.y * res.y + uv.x * res.x);
    }
    ${mathGlsl}
    vec4 compute () {
      vec4 pointData = texture2D(tPrev, vUv);
      vec2 pos = pointData.xy;
      float life = pointData.b + .016;
      pos = pos + texture2D(tVel, vUv).xy * uSpeed * SPEED;
      int inx = inxFromUv(ivec2(vUv * resolution), ivec2(resolution));
      if (uLife > 0. && life > uLife) {
        //pos = vec2(.5, .5);
        pos = uPointer.xy * vec2(sceneRes.x/sceneRes.y, 1.) * pow(uZoom, 1./3.);
        life = toRange(-1000., 1000., 0., uLife, texture2D(tInit, vUv).b);
      }

      if (inx > uCountSq*uCountSq)
        pos = vec2(-10, -10.);
      else
        pos = toRangeFract(vec2(0., 0.), vec2(aspect, 1), pos);

      return vec4(pos, life, 1.);
    }`,
  }
});

const velFB = new Feedback({
  name: 'velFB',
  initTexture: initVelFrame.texture,
  size: countSq,
  uniforms: GuiUniforms('Velocity (velFB)', {
    uSensorAng: [45, 0.5, 179.5, .5],
    uSensorDist: [0.01, -.1, .2, 0.001],
    uSensorFerLimit: [1., 0, 5, .001],
    uMaxTurnAng: [8, 0, 180, .5],
    uSpeed: [2, 0.001, 10, .001],
    uNoiseStr: [1, 0, 10, .01],
    computeIters: [3, 1, 10, 1],
    uInteractive: true,
  }, {

    time: Date.now(),
    tPos: posFB.texture,
    tFer: null,
    tVelNoise: velNoiseFrame.texture,
    sceneRes: sketch.size,

    aspect,
    uPointer: sketch.pointer,
  }).open(),
  shader: {
    // damping: false,
    compute: mxNoiseGlsl + velCompGlsl,
  }
});

posFB.uniforms.tVel.value = velFB.texture;



const agents = createInstances(countSq, posFB.texture, aspect);
sketch.scene.add(agents);
sketch.camera = new OrthographicCamera(0, 1, 1, 0, 0, 500);

// window.addEventListener('wheel', e => {
//   const speed = e.deltaY * .01;
//   // sketch.zoom.value += speed;
//   posFB.uniforms.uZoom += speed;
//   sketch.camera.top += speed
//   sketch.camera.right += speed;
//   sketch.camera.left -= speed;
//   sketch.camera.bottom -= speed;
//   sketch.camera.updateProjectionMatrix()
// })

const sceneFrame = new Frame({
  dpi: 1,
  name: 'sceneFrame',
  type: sketch.computeTextureType,
});
// console.log(mxNoiseGlsl + mathGlsl + blocksGlsl + edgeGlsl + ferCompGlsl)

const ferFB = new Feedback({
  name: 'ferFB',
  wrap: RepeatWrapping,
  filter: LinearFilter,
  defines: {
    MAX_BLOCKS,
    ...(USE_BLOCKS ? {USE_BLOCKS} : null)
  },
  uniforms: GuiUniforms('Pheramone (ferFB)', {
    opacity: [.98, 0.9, 1., .001],
    // blur: [0., 0., 2., .01],
  }, {
    uPointer: sketch.pointer,
    sceneRes: sketch.size,
    useCamera: params.useCamera,
    time: Date.now(),
    tVideo: null,
    uSensorFerLimit: velFB.uniforms.uSensorFerLimit,
    tInput: sceneFrame.texture,
    uBlocks: { value: Arr(MAX_BLOCKS).map(_ => new Vector4(...initBlockDim)) },
  }).open(),
  shader: {
    compute: mxNoiseGlsl + mathGlsl + blocksGlsl + edgeGlsl + ferCompGlsl,
  }
});


const postFx = new QuadFrame({
  name: 'postFx',
  dpi: 1,
  type: sketch.computeTextureType,
  material: new ShaderMaterial({
    uniforms: GuiUniforms('PostFx', {
    // uBrightness: [1, 0, 3],
    // uContrast: [1, 0, 3],
    // uSaturation: [1, 0, 3],
      uGamma: [1, 0, 3],
      usePalette: true,
      uPalette: {
        type: 'vec3',
        value: palettes[1],
        opts: palettes.reduce((opts, p, i) => Object.assign(opts, { [`Palette ${i}`]: p }), {}),
      },
      uAnimSpeed: [1., -2, 20, .01],
      uPow: [1., 0.1, 2, .001],
      uMix: [.9, -1, 2, .01],
    }, {
      resolution: { x: sketch.W, y: sketch.H },
      tColor: ferFB.texture,
      time: 0,
    }).open(),
    vertexShader: rawVertGlsl,
    fragmentShader: `
      precision highp float;
      uniform bool usePalette;
      uniform vec3 uPalette[4];
      uniform sampler2D tColor;
      // uniform float uAnimSpeed;
      uniform float uPow;
      uniform float time;
      uniform float uMix;
      uniform float uGamma;
      uniform float uBrightness;
      uniform float uContrast;
      uniform float uSaturation;
      varying vec2 vUv;
      ${ colorAdjustGlsl }
      ${ paletteGlsl }
      void main () {
        vec4 ferData = texture2D(tColor, vUv);
        float fer = texture2D(tColor, vUv).r;
        float way = texture2D(tColor, vUv).g;
        vec3 col = vec3(fer, fer - way * .8, fer);

        if (usePalette) {
          vec3 pCol = palette(pow(fer, uPow) + time, uPalette[0], uPalette[1], uPalette[2], uPalette[3]);
          pCol = clamp(pCol, 0., 1.);
          col = mix(col.rgb, pCol, uMix) / 2.;
        }

        col = pow(col, vec3(1.0/uGamma));
        gl_FragColor = vec4(col, 1.);
          // * brightnessMat(uBrightness)
          // * contrastMat(uContrast)
          // * saturationMat(uSaturation);
      }
    `,
  }),
});
// const postFxParams = { blur: 0 };
// (await postFx.uniforms.folder()).add(postFxParams, 'blur', 0, 30, .01).onChange(v => {
//   sketch.renderer.domElement.style.filter = `blur(${v}px) contrast(${1+v/2})`;
// })

sketch.on('resize', ({ size: { width, height }, dpi }) => {
  aspect = width / height;
  // sceneFrame.setSize(width, H);
  initPosFrame.material.uniforms.range.y = aspect;
  ferFB.setSize(width, height);
  velFB.uniforms.aspect.value = aspect;
  posFB.uniforms.aspect.value = aspect;
  agents.material.uniforms.aspect.value = aspect;
});

sketch.on('reset', function reset () {
  initVelFrame.quad.material.uniforms.seed.value = Math.random() * 1e3;
  initVelFrame.render();
  initPosFrame.render();
  posFB.initWithTexture();
  velFB.initWithTexture();
  ferFB.reset();
});

// posFB.uniforms.tFer.value = ferFB.texture;

sketch.startRaf(({ now, elapsed, delta }) => {
  // console.time('sketch.render');
  velNoiseFrame.material.uniforms.time.value = elapsed/2;
  velNoiseFrame.render();
  ferFB.uniforms.time.value = elapsed;
  velFB.uniforms.time.value = elapsed;

  for (let i = 0; i < velFB.uniforms.computeIters.value; i++) {
    posFB.render();
    velFB.uniforms.tPos.value = posFB.texture;

    velFB.render();

    agents.material.uniforms.tPos.value = posFB.texture;
    // agents.material.uniforms.tPos.value = velNoiseFrame.texture;
    sceneFrame.render(sketch);
    ferFB.render();
    velFB.uniforms.tFer.value = ferFB.texture;
  }
  // debug(ferFB);

  if (modulation.micVol) {
    posFB.uniforms.uSpeed.value = modulation.micVol * 4;
    velFB.uniforms.uSensorFerLimit.value = 2 - modulation.micVol * 2;
  }

  if (postFx.material.uniforms.usePalette.value)
    postFx.material.uniforms.time.value += delta / 20
      * postFx.material.uniforms.uAnimSpeed.value;
  postFx.render();
  debug(postFx);

  if (USE_BLOCKS)
    handleBlocks();
});

function handleBlocks () {
  let i = 0;
  if (blocks.needRead) {
    for (let $el of blocks) {
      const dim = $el.getBoundingClientRect();
      const hw = dim.width / 2;
      const hh = dim.height / 2;
      ferFB.uniforms.uBlocks.value[i].set(dim.x + hw, dim.y + hh, hw, hh);
      i++;
    }
    ferFB.uniforms.uBlocks.value[i].set(...initBlockDim);
    blocks.needRead = false;
  }
}

export default {};
