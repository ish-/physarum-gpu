import sketch, { debug } from '/lib/Sketch';

import {
  WebGLRenderTarget,
  NearestFilter,
  ShaderMaterial,
  TextureLoader,
  InstancedBufferAttribute,
  Scene,
  FloatType,
  Color,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
} from 'three';

import { GuiUniforms } from '/lib/gui';
import Feedback from '/lib/Feedback';
import QuadFrame from '/lib/QuadFrame';

import defaultUvVert from '/shaders/defaultUv.vert.glsl?raw';
import opacityFrag from '/shaders/opacity.frag.glsl?raw';
import mxNoiseGlsl from '/lib/mx-noise.glsl?raw';
import tmpFrag from './tmp.frag.glsl?raw';

import createInstances from './instances.js';

const testTex = new TextureLoader().load('/assets/boxMap.jpg');
const noiseFragGlsl = tmpFrag.replace('// <functions>', mxNoiseGlsl);

const amountSq = 10;

const noiseMat = new ShaderMaterial({
  uniforms: GuiUniforms('noises', {
    octaves: 2,
    lacunarity: .5,
    diminish: .5,
    scale: 1,
  }).noGui({
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
  uniforms: {
    tNew: { value: velFrame.texture },
  },
  shader: {
    damping: false,
    // process: `

    // `
  }
});

window.addEventListener('keydown', e => {
  if (e.key === 'r')
    posFB.reset();
})

// INSTANCES
const mesh = createInstances(amountSq, posFB.texture);
sketch.scene.add(mesh);
sketch.scene.position.z = -2;


sketch.startRaf(({ now, elapsed, delta }) => {
  noiseMat.uniforms.time.value = elapsed/2;
  velFrame.render();
  posFB.render();

  sketch.render();
  // debug({ texture: velFrame.texture })
});

export default {};
