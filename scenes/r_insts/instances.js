import {
  InstancedMesh,
  BoxGeometry,
  MeshBasicMaterial,
  DynamicDrawUsage,
  Object3D,
  Vector2,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
} from 'three';

export default function (amountSq, tPos) {
  // console.log(tPos)
  const amount = amountSq**2;
  const geo = new BoxGeometry(.1, .1, .1);
  geo.computeVertexNormals();
  const mat = new MeshBasicMaterial({
    color: 0xFF8800,
    onBeforeCompile (shader) {
      shader.uniforms.tPos = { value: tPos };
      shader.uniforms.tPosSize = { value: new Vector2(amountSq, amountSq) };
      let vs = shader.vertexShader;
      vs = insertAfter(vs, '#include <common>', `
        uniform sampler2D tPos;
        uniform vec2 tPosSize;
        attribute int instanceId;
      `);
      vs = insertAfter(vs, '#include <worldpos_vertex>', `
        //vec4 worldPosition = instanceMatrix * worldPosition;
        vec4 pos = texture2D(tPos,  );
        //worldPosition += pos;
        //gl_Position = projectionMatrix * modelViewMatrix * pos;
      `);
      shader.vertexShader = vs;
    },
  });

  // const igeo = new InstancedBufferGeometry();
  // igeo.index = geo.index;
  // igeo.attributes = geo.attributes;
  // const attr = new InstancedBufferAttribute(new Float32Array(amount), 1);
  // for (let i = 0; i < amount; i = i + 4) {
  //   attr.array[i] = i;
  // }
  // igeo.setAttribute('instanceId', attr);

  // const translateArray = new Float32Array( amount * 3 );
  // for ( let i = 0, i3 = 0, l = amount; i < l; i ++, i3 += 3 ) {
  //   translateArray[ i3 + 0 ] = Math.random() * 2 - 1;
  //   translateArray[ i3 + 1 ] = Math.random() * 2 - 1;
  //   translateArray[ i3 + 2 ] = Math.random() * 2 - 1;
  // }
  // igeo.setAttribute( 'translate', new InstancedBufferAttribute( translateArray, 3 ) );

  // const mesh = new Mesh(igeo, mat);

  const mesh = new InstancedMesh(
    geo,
    mat,
    amount,
  );
  const transform = new Object3D();
  for (let i = 0; i < amount; i++) {
    transform.position.x = Math.random();
    transform.position.y = Math.random();
    transform.position.z = Math.random();
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
  }
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);

  return mesh;
};

function insertAfter (input, search, str) {
  return input.replace(search, `${ search } ${ str }`);
}