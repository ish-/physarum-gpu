import {
  InstancedMesh,
  BoxGeometry,
  MeshBasicMaterial,
  DynamicDrawUsage,
  Object3D,
  Vector2,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Float32BufferAttribute,
  Mesh,
  RawShaderMaterial,
  Vector4,
} from 'three';
import rotate3dGlsl from '/lib/rotate3d.glsl?raw';

export default function (amountSq, tPos) {
  // console.log(tPos)
  const amount = amountSq**2;
  const geo = new BoxGeometry(.1, .1, .1);
  geo.computeVertexNormals();
  // const mat = new MeshBasicMaterial({
  //   // wireframe: true,
  //   color: 0xFF8800,
  //   onBeforeCompile (shader) {
  //     console.log(shader)
  //     // shader.instancing = true;
  //     shader.uniforms.tPos = { value: tPos };
  //     shader.uniforms.tPosSize = { value: new Vector2(amountSq, amountSq) };
  //     let vs = shader.vertexShader;
  //     vs = vs.replace('#define USE_INSTANCING', '');
  //     vs = insertAfter(vs, '#include <common>', `
  //       uniform sampler2D tPos;
  //       uniform vec2 tPosSize;
  //       attribute float instanceId;
  //       attribute vec3 translate;
  //     `);
  //     vs = insertAfter(vs, '#include <worldpos_vertex>', `
  //       // adgasd
  //       vec2 posUv = vec2(
  //         mod(instanceId, tPosSize.y),
  //         floor(instanceId / tPosSize.x)
  //       );
  //       vec4 pos = texture2D(tPos, posUv);
  //       //worldPosition += pos;
  //       // gl_Position = projectionMatrix * modelViewMatrix * vec4(instanceId, 0., 0., 1.);
  //     `);
  //     shader.vertexShader = vs;
  //   },
  // });

  var mat = new RawShaderMaterial({
    uniforms: {
      tPos: { value: tPos },
      tPosSize: { value: new Vector2(amountSq, amountSq) },
    },
    vertexShader: `precision highp float;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform sampler2D tPos;
      uniform vec2 tPosSize;
      attribute vec3 position;
      attribute vec3 translate;
      attribute float instanceId;
      attribute vec4 orientation;
      varying float vInstanceId;
      varying vec3 vColor;

      void main(){
          vInstanceId = instanceId;
          vec3 pos = translate + position;
          // vec2 posUv = vec2(
          //   mod(instanceId, tPosSize.x) / tPosSize.x,
          //   floor(instanceId / tPosSize.x) / tPosSize.x
          // );
          // vec4 offset = texture2D(tPos, posUv);
          // pos += offset.xyz;
          // vec3 vcV = cross( orientation.xyz, pos );
          // pos = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + pos );
          vec3 temp = cross(orientation.xyz, pos) + orientation.w * pos;
          pos += 2.0*cross(orientation.xyz, temp);


          vColor = pos;

          gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

      }`,
    fragmentShader: `precision highp float;
      varying float vInstanceId;
      uniform vec2 tPosSize;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor.rg, vInstanceId / (tPosSize.x * tPosSize.y), 1.0);
      }`,
    // side: THREE.DoubleSide
  });

  const igeo = new InstancedBufferGeometry();
  igeo.index = geo.index;
  igeo.attributes = geo.attributes;
  // igeo.instanceCount = amount;

  // const gridBox = new BoxGeometry(1, 1, 1, 5, 5, 1);
  // console.log(gridBox)
  // igeo.instanceCount = amount;

  const inxAttr = new InstancedBufferAttribute(new Float32Array(amount), 1);
  for (let i = 0; i < amount; i++)
    inxAttr.array[i] = i;
  igeo.setAttribute('instanceId', inxAttr);

  const translateArray = new Float32Array( amount * 3 );
  const orientArray = new Float32Array( amount * 3 );
  const v4 = new Vector4();
  for ( let i = 0, i3 = 0, l = amount; i < l; i ++, i3 += 3 ) {
    translateArray[ i3 + 0 ] = Math.random() * 2;
    translateArray[ i3 + 1 ] = Math.random() * 2;
    translateArray[ i3 + 2 ] = Math.random() * 2;

    v4.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    v4.normalize();
    orientArray[ i3 + 0 ] = v4.x;
    orientArray[ i3 + 1 ] = v4.y;
    orientArray[ i3 + 2 ] = v4.z;
    orientArray[ i3 + 3 ] = v4.w;
  }
  igeo.setAttribute( 'translate', new InstancedBufferAttribute( translateArray, 3 ) );
  igeo.setAttribute( 'orientation', new InstancedBufferAttribute( orientArray, 3 ) );

  const mesh = new Mesh(igeo, mat);

  return mesh;
};
