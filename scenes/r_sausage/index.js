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
import { insertAfter, callnpass } from '/lib/utils';
import InstancingTransforms from '/lib/InstancingTransforms';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

import QuadFrame from '/lib/QuadFrame';
import defaultUvVertGlsl from '/shaders/defaultUv.vert.glsl?raw';

import _circlesData from './circles.json';
sketch.initKeys();
sketch.dpi = 1;
// sketch.renderer.domElement.style.filter = 'blur(.5px)';
const circlesData = _circlesData.reduce((m, d, i) => {
  if (!(i % 2)) m.push(d);
  return m;
}, []);

const gui = new GUI({ title: 'Controls', closeFolders: true });
const PARS = {
  size: 1,
  rotate: 0,
};

const COUNT = circlesData.length;
console.log({COUNT})

const circleGeo = new CircleGeometry(.4, 64);
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
mat.onBeforeCompile = shader => {
  shader.uniforms.uTime = sketch.timeUniform;
  shader.vertexShader = 'varying float vInstanceZ;\n' +
    insertAfter(shader.vertexShader, '#include <uv_vertex>', `
      vInstanceZ = instanceMatrix[3][2];
    `);
  shader.fragmentShader = 'uniform vec3 uTime; varying float vInstanceZ;' +
    insertAfter(shader.fragmentShader, '#include <map_fragment>', `
      float modu = uTime.x * 5. + vInstanceZ * 8.;
      diffuseColor *= sin(min(1.5,max(-.5, (vInstanceZ + fract(-uTime.x/10.) *2.) *25. - 30. ))*3.1415)/2. + 1.5;
    `);
};

const mesh = new InstancedMesh(circleGeo, mat, COUNT);
mesh.rotation.z = Math.PI;
mesh.instanceMatrix.setUsage( DynamicDrawUsage );

const instanceIds = new BufferAttribute(new Float32Array(COUNT), 1);

const transforms = new InstancingTransforms(COUNT, mesh);
transforms.forEach((t, i) => {
  t.position.set(
    circlesData[i][0] * .001,
    circlesData[i][1] * .001,
    1 - i / COUNT,
  );
});

gui.add(PARS, 'size', .0001, 10, .001).onChange(
  callnpass(function setScale (v = PARS.size) {
    transforms.forEach(({ scale }, i) => {
      const s = v + (1 - i / COUNT) * .6 * v; // from ref
      scale.set(s, s, 1);
    })
  }));


gui.add(PARS, 'rotate', 0, 360, .1).onChange(
  callnpass(function setRotation (v = PARS.rotate) {
    const rad = v / Math.PI;
    transforms.forEach(({ rotation }, i) => rotation.set(0, 0, i * rad / 1000));
  })
);

mesh.scale.multiplyScalar(1.4);
mesh.position.set(1.8, 1, 0);
sketch.scene.add(mesh);
// const mesh = new Mesh(geo, mat);
// sketch.scene.position.z = -4;
sketch.camera = new OrthographicCamera(-1, 1, 1, -1, .000001, 50);
sketch.camera.position.z = -2;

const testMesh = new Mesh(
  new BoxGeometry(),
  new MeshBasicMaterial({ color: 0xff6600, wireframe: true }),
);
// testMesh.rotation.x = 45;
// testMesh.rotation.y = 45;
const testMesh2 = testMesh.clone();
testMesh2.scale.multiplyScalar(.5);
sketch.scene.add(testMesh);
sketch.scene.add(testMesh2);

const orbit = new OrbitControls(sketch.camera, sketch.renderer.domElement);
orbit.listenToKeyEvents( window );

handleResize();
sketch.on('resize', handleResize);

sketch.initStats();
sketch.startRaf(({ now, elapsed, delta }) => {
  transforms.forEach(t => t.rotation.z += .005);

  sketch.render();
});

function handleResize ({ size } = sketch) {
  console.log('handleResize', size)
  const aspect = size.x / size.y;
  sketch.camera.right = aspect;
  sketch.camera.left = -aspect;
  sketch.camera.updateProjectionMatrix();
}