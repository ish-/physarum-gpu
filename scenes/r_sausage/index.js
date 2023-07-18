import sketch, { debug } from '/lib/Sketch';

import * as THREE from 'three'
import {
  CircleGeometry,
  BufferAttribute,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  ShaderMaterial,
  RawShaderMaterial,
  Mesh,
  InstancedMesh,
  OrthographicCamera,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

import circlesData from './circles.json';
const GRADIENT = [0x132251, 0x30537b];
const COUNT = circlesData.length;
const circleGeo = new CircleGeometry();
// circleGeo.computeVertexNormals()
// circleGeo.computeTangents()

// const geo = new InstancedBufferGeometry();
// geo.setAttribute('position', new BufferAttribute(new Float32Array([
//   0.025, - 0.025, 0,
//   - 0.025, 0.025, 0,
//   0, 0, 0.025,
// ]), 3));
// geo.attributes = circleGeo.attributes;

const offsetAttr = new Float32Array(COUNT * 3);
for (let k = 0; k < COUNT; k += 3) {
  const i = k * 3;
  offsetAttr[i] = (Math.random()*2-1);
  offsetAttr[i+1] = (Math.random()*2-1);
  offsetAttr[i+2] = 0;
}
// geo.setAttribute('offset', new InstancedBufferAttribute(offsetAttr, 3));
circleGeo.setAttribute('offset', new BufferAttribute(offsetAttr, 3));

// const inxAttr = new InstancedBufferAttribute(new Float32Array(COUNT), 1);
// for (let i = 0; i < COUNT; i++)
//   inxAttr.array[i] = i;
// geo.setAttribute('instanceId', inxAttr);

const mat = new THREE.MeshBasicMaterial({ color: 0xff6600, side: THREE.DoubleSide, });
mat.onBeforeCompile(shader => {
  console.log(shader);
});
// const mat = new RawShaderMaterial({
//   uniforms: {
//     time: { value: sketch.timeUniform },
//   },
//   side: THREE.DoubleSide,
//   vertexShader: `
//     precision highp float;
//     uniform mat4 projectionMatrix;
//     uniform mat4 modelViewMatrix;
//     uniform mat4 instanceMatrix;
//     attribute vec2 uv;
//     attribute vec3 position;
//     attribute vec3 offset;
//     varying vec2 vUv;
//     varying vec4 vColor;

//     void main() {
//       vUv = uv;
//       vColor = vec4(uv, 0., 1.);
//       gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//     }
//   `,
//   fragmentShader: `precision highp float;
//     varying vec2 vUv;
//     varying vec4 vColor;
//     void main () {
//       // gl_FragColor = vColor;
//       gl_FragColor = vColor;
//     }
//   `,
// });

// mat.onBeforeCompile(shader => {
//   console.log(shader)
//   return shader;
// })

const testMesh = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true }),
);
// testMesh.rotation.x = 45;
// testMesh.rotation.y = 45;
const testMesh2 = testMesh.clone();
testMesh2.scale.multiplyScalar(.5);
sketch.scene.add(testMesh);
sketch.scene.add(testMesh2);

const mesh = new InstancedMesh(circleGeo, mat, COUNT);
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );

const dummy = new THREE.Object3D();
for (let i = 0; i < COUNT; i++) {
  dummy.position.set(Math.random()*2-1, Math.random()*2-1,0);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}
mesh.instanceMatrix.needsUpdate = true;

sketch.scene.add(mesh);
// const mesh = new Mesh(geo, mat);
// sketch.scene.position.z = -4;
// sketch.camera = new OrthographicCamera(-1, 1, 1, -1, .000001, 50);
// sketch.camera.updateProjectionMatrix();
sketch.camera.position.z = -2;

const orbit = new OrbitControls(sketch.camera, sketch.renderer.domElement);
orbit.listenToKeyEvents( window );

debugger;

sketch.initStats();
sketch.startRaf(({ now, elapsed, delta }) => {
  sketch.render();
});