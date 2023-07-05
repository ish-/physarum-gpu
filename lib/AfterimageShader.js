/**
 * Afterimage shader
 * I created this effect inspired by a demo on codepen:
 * https://codepen.io/brunoimbrizi/pen/MoRJaN?page=1&
 */
import fragmentShader from './feedback.frag.glsl?raw';

const AfterimageShader = {

  uniforms: {

    'damp': { value: 0.96 },
    'tOld': { value: null },
    'tNew': { value: null }

  },

  vertexShader: /* glsl */`

    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

  fragmentShader,

};

export { AfterimageShader };
