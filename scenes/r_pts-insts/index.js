import sketch, { debug } from '/lib/Sketch';

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
import velCompGlsl from './vel.comp.glsl?raw';
import ferCompGlsl from './fer.Comp.glsl?raw';
import rawVertGlsl from '/shaders/raw.vert.glsl?raw';
import { touchable, onTouchStart, onTouchEnd, onTouchMove } from '/lib/utils';
import { palettes, paletteGlsl } from '/lib/PaletteGlsl';
import { MicAnalyzer } from '/lib/MicAnalyzer';

import createInstances from './instances.js';
// import { $video, videoTexture } from './cameraMedia';
// import edgeGlsl from '/shaders/edge.glsl';
import { blocks, initBlockDim, MAX_BLOCKS } from './blocks';
import blocksGlsl from './blocks.glsl';

const USE_BLOCKS = 0;

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
GuiPresets(guiProm);
GuiUniforms.gui = guiProm;
sketch
  .initKeys()
  .initPointer()
  .initStats();

// THIS CONTROLS
const params = {
  // showBlocks: true,
  blocksBlur: 0,
  mic: false,
  micVol: 0,
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
  gui.add(params, 'mic').onChange(async v => {
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
})



///////////// COMPONENTS
GuiUniforms.skip = true;
const initVelFrame = new NoiseFrame({ name: 'initVel', size: countSq, normalize: true })
  .render();
const initPosFrame = new NoiseFrame({
  name: 'initPos', size: countSq,
  range: new Vector2(0, aspect)
}).render();

const velNoiseFrame = new NoiseFrame({ name: 'velNoise', size: countSq,
  uniforms: { speed: .16, lacunarity: 0.82 },
});
velNoiseFrame.render();

const posFB = new Feedback({
  name: 'posFB',
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

GuiUniforms.skip = false;
const velFB = new Feedback({
  name: 'velFB',
  initTexture: initVelFrame.texture,
  size: countSq,
  uniforms: GuiUniforms('velFB', {
    uSensorAng: [45, 0.5, 179.5, .5],
    uSensorDist: [0.01, -.1, .2, 0.001],
    uSensorFerLimit: [1., 0, 5, .001],
    uMaxTurnAng: [8, 0, 180, .5],
    uSpeed: [2, 0.001, 10, .001],
    uNoiseStr: [1, 0, 10, .01],
    computeIters: [3, 1, 10, 1],
    uInteractive: true,
  }, {
    tPos: posFB.texture,
    tFer: null,
    tVelNoise: velNoiseFrame.texture,
    sceneRes: sketch.size,

    aspect,
    uPointer: sketch.pointer,
  }).open(),
  shader: {
    // damping: false,
    compute: velCompGlsl,
  }
});

posFB.uniforms.tVel.value = velFB.texture;



const agents = createInstances(countSq, posFB.texture, aspect);
sketch.scene.add(agents);
sketch.camera = new OrthographicCamera(0, 1, 1, 0, 0, 50);

const sceneFrame = new Frame({
  dpi: 1,
  name: 'sceneFrame',
  type: sketch.computeTextureType,
});

const ferFB = new Feedback({
  name: 'ferFB',
  wrap: RepeatWrapping,
  filter: LinearFilter,
  defines: {
    MAX_BLOCKS,
    ...(USE_BLOCKS ? {USE_BLOCKS} : null)
  },
  uniforms: GuiUniforms('ferFB', {
    opacity: [.98, 0.9, 1., .001],
    // blur: [0., 0., 2., .01],
  }, {
    // tVideo: videoTexture,
    uSensorFerLimit: velFB.uniforms.uSensorFerLimit,
    tInput: sceneFrame.texture,
    uPointer: sketch.pointer,
    uBlocks: { value: Arr(MAX_BLOCKS).map(_ => new Vector4(...initBlockDim)) },
  }).open(),
  shader: {
    compute: blocksGlsl + /*edgeGlsl + */ferCompGlsl,
  }
});


const postFx = new QuadFrame({
  name: 'postFx',
  dpi: 1,
  type: sketch.computeTextureType,
  material: new ShaderMaterial({
    uniforms: GuiUniforms('postFx', {
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
      varying vec2 vUv;
      ${ paletteGlsl }
      void main () {
        vec4 col = texture2D(tColor, vUv);
        vec3 fer = vec3(col.r);
        if (usePalette) {
          vec3 pCol = palette(pow(fer.r, uPow) + time, uPalette[0], uPalette[1], uPalette[2], uPalette[3]);
          pCol = clamp(pCol, 0., 1.);
          pCol = mix(fer.rgb, pCol, uMix);
          gl_FragColor = vec4((pCol/* + fer.rgb*/) / 2., 1.);
        }
        else
          gl_FragColor = vec4(fer, 1.);
      }
    `,
  }),
});



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
