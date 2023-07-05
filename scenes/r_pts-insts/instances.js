import {
  InstancedMesh,
  BoxGeometry,
  MeshBasicMaterial,
  DynamicDrawUsage,
  Object3D,
  Vector2,
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  RawShaderMaterial,
  Vector4,
  PointsMaterial,
  ShaderMaterial,
  NormalBlending,
  Points,
} from 'three';
import fragGlsl from './points.frag.glsl?raw';
import vertGlsl from './points.vert.glsl?raw';

export default function (countSq, tPos) {
  // console.log(tPos)
  const count = countSq**2;

  const mat = new ShaderMaterial({
    // defines: {
    //   // INSTANCED: '',
    // },
    uniforms: {
      time: { value: 0. },
      pointSize: { value: 2. },
      countSq: { value: countSq },
      speed: { value: 1. },
      tPos: { value: tPos },
    },
    vertexShader: vertGlsl,
    fragmentShader: fragGlsl,
    // transparent: true,
    // blending: NormalBlending,
    // // depthWrite: true,
    // depthTest: false,
  });

  const geo = new BufferGeometry();
  // const center = [0, 1];

  const posAttr = new Float32Array(count * 3);
  for (let k = 0; k < count; k += 3) {
    const i = k * 3;
    posAttr[i] = (Math.random()*2-1);
    posAttr[i+1] = (Math.random()*2-1);
    posAttr[i+2] = 0;
  }
  geo.setAttribute('position', new BufferAttribute(posAttr, 3));


  const inxAttr = new BufferAttribute(new Float32Array(count), 1);
  for (let i = 0; i < count; i++)
    inxAttr.array[i] = i;
  geo.setAttribute('instanceId', inxAttr);

  const mesh = new Points(geo, mat);

  return mesh;
};
