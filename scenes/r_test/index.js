import {
  BoxGeometry,
  ShaderMaterial,
  OrthographicCamera,
  NearestFilter
} from 'three';

import sketch, { debug } from '/lib/Sketch';
import QuadFrame from '/lib/QuadFrame';
import NoiseFrame from '/lib/NoiseFrame';
import defaultUvVertGlsl from '/shaders/defaultUv.vert.glsl';
import createInstances from '../r_pts-insts/instances';
import { gui } from '/lib/gui';
import SuperFrame from '/lib/SuperFrame';

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

// const noiseFrame = new NoiseFrame({
//   size: 10,
//   range: [0, 1],
//   uniforms: { speed: .01 },
// });

// const instances = createInstances(COUNT_SQ, noiseFrame.texture);
// instances.material.uniforms.pointSize.value = 50;
// sketch.scene.add(instances);

// const f = new SuperFrame({
//   // size: 10,
//   // filter: NearestFilter,
//   guiUniforms: {
//     edgeSmooth: [.005, 0, 0.1, 0.001],
//   },
//   fragmentShader: `
//     float sdBox( in vec2 p, in vec2 b ) {
//       vec2 d = abs(p)-b;
//       return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
//     }
//     void main () {
//       float sizeMod = sin(time.x) / 4.;
//       float box = smoothstep(edgeSmooth * sizeMod + .25, 0., sdBox((vUv - vec2(.5)), vec2(.25 + sizeMod)));
//       gl_FragColor = vec4(box, box, 0., 1.);
//     }
//   `,
// });


sketch.camera = new OrthographicCamera(0, 1, 1, 0, 0, 1);

sketch.startRaf(({ elapsed }) => {
  // f.render();
  // debug(f);
  // noiseFrame.material.uniforms.time.value = elapsed;
  // noiseFrame.render();
  // sketch.render();
});