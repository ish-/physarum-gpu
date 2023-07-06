import * as THREE from 'three';
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

export default function ({ scene, renderer, camera, width, height }) {
  const tex = new THREE.TextureLoader().load('/assets/boxMap.jpg');

  const bufScene = new THREE.Scene();
  const bufRT = new THREE.WebGLRenderTarget( 800, 800, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});

  // const boxMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
  const boxMat = new THREE.MeshBasicMaterial({ map: tex });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.z = -1.8;
  bufScene.add(box);

  var planeMat = new THREE.MeshBasicMaterial({ color: 0x7074FF })
  var planeGeo = new THREE.PlaneGeometry( 1000, 1000 );
  var plane = new THREE.Mesh(planeGeo, planeMat);
  plane.position.z = -10;
  bufScene.add(plane);

  var box2Mat = new THREE.MeshBasicMaterial({ map: bufRT.texture });
  // var box2Mat = new THREE.MeshBasicMaterial({ map: tex });
  var box2Geo = new THREE.BoxGeometry( .5, .5, .5 );
  var box2 = new THREE.Mesh(box2Geo, box2Mat);
  box2.position.z = -.6;
  scene.add(box2);

  let box2Rot = 0;
  let boxRot = 0;

  const quadRT = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
  const quadFragShader = tmpFrag.replace('// <functions>', mxNoiseGlsl);
  console.log(quadFragShader);
  const quadMat = new THREE.ShaderMaterial({
    uniforms: {
      opacity: { value: .6 },
      time: { value: 0 },
      tSource: { value: quadRT.texture },

      octaves: { value: 2 },
      lacunarity: { value: .5 },
      diminish: { value: .5 },
      scale: { value: 1 },
    },
    vertexShader: defaultUvVert,
    // fragmentShader: opacityFrag,
    fragmentShader: quadFragShader,
  });

  const gui = new GUI()
  const fold = gui.addFolder('Cube');
  matUniformGui(quadMat, fold)
    .add('octaves').add('lacunarity').add('diminish').add('scale');
  fold.open()
  // const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  // // quadCam.position.z = 1;
  // const quadGeo = new THREE.PlaneGeometry(2, 2);
  // const quadMesh = new THREE.Mesh(quadGeo, quadMat);

  // const noiseMat = new THREE.ShaderMaterial({
  //   uniforms: {
  //     opacity: { value: .6 },
  //     time: { value: 0 },
  //     tSource: { value: quadRT.texture },
  //   },
  //   vertexShader: defaultUvVert,
  //   // fragmentShader: opacityFrag,
  //   fragmentShader: `

  //   `,
  // });

  const quad = new Quad(quadMat, renderer);

  const composer = new EffectComposer(renderer);
  // composer.addPass(new RenderPass( quadMesh, quadCam ));
  composer.addPass(new RenderPass( quad.mesh, quad.camera ));
  // composer.addPass(new GlitchPass());

  const feedback = new Feedback({
    damp: .9,
    // main: `
    //   void main (texelOld, texelNew) {
    //     texelNew.g
    //   }
    // `,
  });
  composer.addPass(feedback);

  // const inspector = new RenderTargetInspector( 200, renderer );
  let feedbackReset = false;
  window.addEventListener('keydown', e => {
    if (e.key === 'r' && e.ctrlKey)
      feedbackReset = true
  });

  return {
    scene,
    onRender ({ now, elapsed, delta, render }) {
      const boxRot = Math.cos(elapsed/540 + 100) * 360;
      box.rotation.set(boxRot, boxRot, -boxRot);

      render({ scene: bufScene, camera,          target: bufRT });

      const box2Rot = Math.sin(elapsed/600) * 360;
      box2.rotation.set(box2Rot, -box2Rot, box2Rot);

      quadMat.uniforms.time.value = elapsed;

      render({ scene,           camera,          target: quadRT });
      // render({ scene: quadMesh, camera: quadCam, target: null });
      if (feedbackReset)
        feedback.reset();
      // renderer.setRenderTarget(null);
      composer.render();

      // inspector.add( bufRT, 'bufRT' );
      // inspector.update();
      // render(quad);
      // quad.render();

      return {
        renderSketch: false,
      }
    },
  };
}
