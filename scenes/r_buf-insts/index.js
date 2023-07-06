import {
  WebGLRenderTarget,
  NearestFilter,
  ShaderMaterial,
  TextureLoader,
  InstancedBufferAttribute,
  Scene,
  FloatType,
} from 'three';

import {
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
import createInstances from './instances.js';

export default function ({ scene, renderer, camera, width, height }) {
  const testTex = new TextureLoader().load('/assets/boxMap.jpg');
  const noiseFragGlsl = tmpFrag.replace('// <functions>', mxNoiseGlsl);

  const amountSq = 10;
  const noiseRT = new WebGLRenderTarget(amountSq, amountSq, {
    type: FloatType, minFilter: NearestFilter, magFilter: NearestFilter });
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

  const gui = new GUI();
  const fold = gui.addFolder('Cube');
  matUniformGui(noiseMat, fold)
    .add('octaves').add('lacunarity').add('diminish').add('scale');
  fold.open();

  const quad = new Quad(noiseMat, renderer);

  const mesh = createInstances(amountSq, noiseRT.texture);

  scene.add(mesh);
  // scene.add((() => {
  //   const geo = new BoxGeometry(1, 1, 1);
  //   const mat = new MeshBasicMaterial({ color: 0x0088FF });
  //   const mesh = new Mesh(geo, mat);
  //   return mesh;
  // })());
  scene.position.z = -2;

  return {
    scene,
    onRender ({ now, elapsed, delta, render }) {
      noiseMat.uniforms.time.value = elapsed/2;
      // render({ scene: quad.mesh, camera: quad.camera, target: null });
      render({ scene: quad.mesh, camera: quad.camera, target: noiseRT });

      // const buf = new Float32Array(amountSq**2 * 4);
      // renderer.readRenderTargetPixels(noiseRT,0,0,amountSq,amountSq, buf);
      // console.log(buf);

      // mesh.material.uniforms.tPos.value = noiseRT.texture;

      // mesh.instanceMatrix = noiseRT.texture;
      // scene.rotation.y += 0.01;
      // render({ scene: mesh });
      render({ scene });

      return {
        // renderSketch: false,
      }
    },
  };
}
