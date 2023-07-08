import {
  BoxGeometry,
  ShaderMaterial,
  OrthographicCamera,
} from 'three';

import sketch, { debug } from '/lib/Sketch';
import QuadFrame from '/lib/QuadFrame';
import NoiseFrame from '/lib/NoiseFrame';
import defaultUvVertGlsl from '/shaders/defaultUv.vert.glsl';
import createInstances from '../r_pts-insts/instances';
import { gui } from '/lib/gui';

const COUNT_SQ = 10;

const uvFragGlsl = `
  varying vec2 vUv;
  void main () {
    gl_FragColor = vec4(vUv, .0, 1.);
  }
`;

// const posFrame = new QuadFrame({
//   ...QuadFrame.computeOpts,
//   size: 10,
//   material: new ShaderMaterial({
//     vertexShader: defaultUvVertGlsl,
//     fragmentShader: uvFragGlsl,
//   }),
// });
// posFrame.render();

const noiseFrame = new NoiseFrame({
  size: 10,
  range: [0, 1],
  uniforms: { speed: .01 },
});

const instances = createInstances(COUNT_SQ, noiseFrame.texture);
instances.material.uniforms.pointSize.value = 50;
sketch.scene.add(instances);

sketch.camera = new OrthographicCamera(0, 1, 1, 0, 0, 1);

sketch.startRaf(({ elapsed }) => {
  noiseFrame.material.uniforms.time.value = elapsed;
  noiseFrame.render();
  sketch.render();
});