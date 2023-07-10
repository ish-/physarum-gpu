import {
  RawShaderMaterial,
  ShaderMaterial,
} from 'three';
import { insertAfter, map } from '/lib/utils';
import { GuiUniforms } from '/lib/gui';
import QuadFrame from '/lib/QuadFrame';
import sketch from '/lib/Sketch';

let count = 0;
export default class SuperFrame extends QuadFrame {
  constructor (_opts = {}) {
    let {
      name = `rawMat${ count }`,

      guiUniforms,
      uniforms = {},

      vertexShader = _vert,
      fragmentShader = _frag,
      ...qfOpts
    } = _opts;

    if (!uniforms.resolution)
      if (qfOpts.width)
        uniforms.resolution = { value: { x: qfOpts.width, y: qfOpts.height } };
      else {
        uniforms.resolution = sketch.size;
      }
    uniforms.time = sketch.timeUniform;

    uniforms = GuiUniforms(name, guiUniforms, uniforms);

    const uniStr = Object.keys(uniforms)
      .map((key) => `uniform ${ uniforms[key].type } ${ key }`)
      .join(';\n')+';\n';

    insertAfter(vertexShader, '// uniforms', uniStr);

    fragmentShader = `
      precision highp float;
      varying vec2 vUv;
    ` + uniStr + fragmentShader;

    const material = new RawShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    super({
      material,
      ...qfOpts,
    });

    this.name = name;
    this.uniforms = uniforms;
  }
}

const _vert = `
precision highp float;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
attribute vec2 uv;
attribute vec3 position;
varying vec2 vUv;
// uniforms

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}

`;
const _frag = `
void main () {
  vec4 col = texture(tColor, vUv);
  gl_FragColor = col;
}
`;
