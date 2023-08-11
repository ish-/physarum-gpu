import sketch from '/lib/Sketch';

import { GUI } from 'lil-gui';
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
  MeshBasicMaterial,
  DoubleSide,
  BoxGeometry,
  DynamicDrawUsage,
  Object3D,
} from 'three';
import { insertAfter } from '/lib/utils';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

import QuadFrame from '/lib/QuadFrame';
import defaultUvVertGlsl from '/shaders/defaultUv.vert.glsl?raw';

import _circlesData from './circles.json';
sketch.initKeys();
const circlesData = _circlesData.reduce((m, d, i) => {
  if (!(i % 2)) m.push(d);
  return m;
}, []);

const COUNT = circlesData.length;
console.log({COUNT})

const gui = new GUI({ title: 'Controls', closeFolders: true });
const PARS = {
  size: .4,
  rotate: 0,
};
gui.add(PARS, 'size', .0001, 10, .001).listen()
  .onChange(v => modifyTransforms(({ scale }) =>
    scale.set(v, v, 1)));
gui.add(PARS, 'rotate', 0, 360, .1).listen()
  .onChange(v => {
    const rad = v / Math.PI;
    modifyTransforms(({ rotation }, i) =>
      rotation.set(0, 0, i * rad / 1000))
  });

const circleGeo = new CircleGeometry(PARS.size, 48);
const offsetAttr = new Float32Array(COUNT * 3);
for (let k = 0; k < COUNT; k += 3) {
  const i = k * 3;
  offsetAttr[i] = circlesData[k][0];
  offsetAttr[i+1] = circlesData[k][1];
  offsetAttr[i+2] = 0;
}
// geo.setAttribute('offset', new InstancedBufferAttribute(offsetAttr, 3));
circleGeo.setAttribute('offset', new BufferAttribute(offsetAttr, 3));

// const inxAttr = new InstancedBufferAttribute(new Float32Array(COUNT), 1);
// for (let i = 0; i < COUNT; i++)
//   inxAttr.array[i] = i;
// geo.setAttribute('instanceId', inxAttr);

const albedo = new QuadFrame({
  size: 500,
  material: new ShaderMaterial({
    uniforms: {},
    fragmentShader: `
      varying vec2 vUv;

      void main() {
        vec3 color = mix(
          vec3(0.07450980392156863, 0.13333333333333333, 0.3176470588235294),
          vec3(0.18823529411764706, 0.3254901960784314, 0.4823529411764706),
          vUv.x
        );
        gl_FragColor = vec4(color, 1.);
      }`,
    vertexShader: defaultUvVertGlsl,
  }),
}).render();

const mat = new MeshBasicMaterial({ side: DoubleSide,
  map: albedo.texture });
const matUTime = { value: 0 };
mat.onBeforeCompile = shader => {
  console.log(shader);
  shader.uniforms.uTime = matUTime;
  shader.vertexShader = 'varying float vInstanceZ;\n' +
    insertAfter(shader.vertexShader, '#include <uv_vertex>', `
      vInstanceZ = instanceMatrix[3][2];
    `);
  shader.fragmentShader = 'uniform float uTime; varying float vInstanceZ;' +
    insertAfter(shader.fragmentShader, '#include <map_fragment>', `
      float modu = uTime * 5. + vInstanceZ * 8.;
      diffuseColor *= sin(min(1.5,max(-.5, (vInstanceZ + fract(-uTime/3.) *2.) *25. - 30. ))*3.1415)/2. + 1.5;
    `);
};
// const mat = new RawShaderMaterial({
//   uniforms: {
//     time: { value: sketch.timeUniform },
//   },
//   side: DoubleSide,
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

// const testMesh = new Mesh(
//   new BoxGeometry(),
//   new MeshBasicMaterial({ color: 0xff6600, wireframe: true }),
// );
// // testMesh.rotation.x = 45;
// // testMesh.rotation.y = 45;
// const testMesh2 = testMesh.clone();
// testMesh2.scale.multiplyScalar(.5);
// sketch.scene.add(testMesh);
// sketch.scene.add(testMesh2);

const mesh = new InstancedMesh(circleGeo, mat, COUNT);
// mesh.instanceMatrix.setUsage( DynamicDrawUsage );

const instanceIds = new BufferAttribute(new Float32Array(COUNT), 1);
mesh.set

const transforms = new Array(COUNT).fill(0).map((_, i) => new Object3D());
modifyTransforms((t, i) => {
  t.position.set(
    circlesData[i][0] * .001,
    circlesData[i][1] * .001,
    1 - i / COUNT,
  );
})

function modifyTransforms (fn) {
  transforms.forEach((t, i) => {
    fn(t, i);
    t.updateMatrix();
    // console.log(t.matrix);
    // debugger;
    mesh.setMatrixAt(i, t.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

sketch.scene.add(mesh);
// const mesh = new Mesh(geo, mat);
// sketch.scene.position.z = -4;
sketch.camera = new OrthographicCamera(-1, 1, 1, -1, .000001, 50);
sketch.camera.position.z = -2;

const orbit = new OrbitControls(sketch.camera, sketch.renderer.domElement);
orbit.listenToKeyEvents( window );

function handleResize ({ size } = sketch) {
  console.log('handleResize', size)
  const aspect = size.x / size.y;
  sketch.camera.right = aspect;
  sketch.camera.left = -aspect;
  sketch.camera.updateProjectionMatrix();
}
handleResize();
sketch.on('resize', handleResize);

sketch.initStats();
sketch.startRaf(({ now, elapsed, delta }) => {
  matUTime.value = elapsed;
  sketch.render();
});