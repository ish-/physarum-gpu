import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  NormalBlending,
  Points,
  ShaderMaterial,
} from 'three';

import { GuiUniforms } from '/lib/gui-uniforms';
import fragGlsl from './points.frag.glsl?raw';
import vertGlsl from './points.vert.glsl?raw';

export default function (countSq, tPos, aspect) {
  const count = countSq**2;

  const mat = new ShaderMaterial({
    // defines: {
    //   // INSTANCED: '',
    // },
    uniforms: GuiUniforms('Agents', {
      uIntensity: [.2, 0.001, 2, .01],
      pointSize: [1.5, .1, 5],
    }, {
      countSq: countSq,
      tPos: tPos,
      aspect,
    }),
    vertexShader: vertGlsl,
    fragmentShader: fragGlsl,
    transparent: true,
    blending: NormalBlending,
    // // depthWrite: true,
    depthTest: false,
  });

  const geo = new BufferGeometry();
  // const center = [0, 1];

  const posAttr = new Float32Array(count * 3);
  // for (let k = 0; k < count; k += 3) {
  //   const i = k * 3;
  //   posAttr[i] = (Math.random()*2-1);
  //   posAttr[i+1] = (Math.random()*2-1);
  //   posAttr[i+2] = 0;
  // }
  geo.setAttribute('position', new BufferAttribute(posAttr, 3));

  const gidAttr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const ii = i * 3;
    gidAttr[ii] = (i % countSq) / countSq;
    gidAttr[ii+1] = Math.floor(i / countSq) / countSq;
    gidAttr[ii+2] = i;
  }
  geo.setAttribute('gId', new BufferAttribute(gidAttr, 3));

  const mesh = new Points(geo, mat);

  return mesh;
};
