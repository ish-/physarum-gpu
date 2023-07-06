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
import Quad from '/lib/Quad.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import Feedback from '/lib/Feedback.js';
import defaultUvVert from '/shaders/defaultUv.vert.glsl?raw';
import opacityFrag from '/shaders/opacity.frag.glsl?raw';
import { matUniformGui } from '/lib/gui.js';
// import RenderTargetInspector from '/lib/RenderTargetInspector.js';
import mxNoiseGlsl from '/lib/mx-noise.glsl?raw';
import tmpFrag from './tmp.frag.glsl?raw';
import { GUI } from 'dat.gui';
import QuadFrame from '/lib/QuadFrame';


import createInstances from './instances.js';

function go ({ scene, renderer, camera, width, height }) {
  const testTex = new TextureLoader().load('/assets/boxMap.jpg');
  const noiseFragGlsl = tmpFrag.replace('// <functions>', mxNoiseGlsl);

  const amountSq = 10;

  // velocity
  // const velRT = new WebGLRenderTarget(amountSq, amountSq, {
  //   type: FloatType, minFilter: NearestFilter, magFilter: NearestFilter });
  const noiseMat = new ShaderMaterial({
    uniforms: {
      opacity: { value: .6 },
      time: { value: 0 },
      tSource: { value: testTex },

      octaves: { value: 2 },
      lacunarity: { value: .5 },
      diminish: { value: .5 },
      scale: { value: 1 },
    },
    vertexShader: defaultUvVert,
    fragmentShader: noiseFragGlsl,
  });

  const velFrame = new QuadFrame({
    size: amountSq,
    material: noiseMat,
    type: FloatType, minFilter: NearestFilter, magFilter: NearestFilter })

  const gui = new GUI();
  const fold = gui.addFolder('Cube');
  matUniformGui(noiseMat, fold)
    .add('octaves').add('lacunarity').add('diminish').add('scale');
  fold.open();

  // const velQuad = new Quad(noiseMat);

  // POS

  const posFB = new Feedback({ size: amountSq,
    uniforms: {
      tNew: { value: velFrame.texture },
    },
    shader: {
      damping: false,
    }
  });

  // INSTANCES
  const mesh = createInstances(amountSq, posFB.texture);
  scene.add(mesh);
  scene.position.z = -2;

  return function ({ now, elapsed, delta, render }) {
    noiseMat.uniforms.time.value = elapsed/2;
    velFrame.render();
    posFB.render();

    render()
    // debug({ texture: velFrame.texture })

    return { renderSketch: false }
  };
}

sketch.startRaf(go({
  scene: sketch.scene,
  renderer: sketch.renderer,
  camera: sketch.camera,
  width: sketch.W,
  height: sketch.H,
}))
export default {};
