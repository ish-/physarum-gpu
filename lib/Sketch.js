import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  HalfFloatType,
  FloatType,
} from 'three';

class Sketch {
  scene = new Scene();
  exts = {};

  constructor () {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.dpi = Math.min(2, window.devicePixelRatio);
    this.renderer.setPixelRatio(this.dpi);

    document.body.appendChild(this.renderer.domElement);
    this.render = this.render.bind(this);
    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();

    this.computeTextureType = this.renderer.extensions.has( "OES_texture_float_linear" )
      ? FloatType : HalfFloatType;
  }

  async initStats () {
    const Stats = (await import('three/addons/libs/stats.module')).default;
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  onResize () {
    this.W = window.innerWidth * this.dpi;
    this.H = window.innerHeight * this.dpi;
    this.renderer.setSize(this.W, this.H, false);
    this.camera = new PerspectiveCamera( 70, this.W / this.H, .0001, 1000 );

    window.addEventListener('blur', e => { this._paused = true });
    window.addEventListener('focus', e => { this._paused = false });
  }

  render ({ scene = this.scene, camera = this.camera, target = null } = {}) {
    if (this.renderer.getRenderTarget() !== target)
      this.renderer.setRenderTarget(target);
    this.renderer.render(scene, this.camera, target);
  }

  link (obj) {
    obj.$root = sketch;
    obj.$parent = this;
    obj.$link = this.link.bind(obj);
    return obj;
  }

  resetTime () {
    this.START = Date.now() / 1e3;
    this.lastNow = this.START;
  }

  startRaf (fn) {
    this.resetTime();

    this._rafFn = fn;
    this._raf = this.__raf.bind(this, fn);
    setTimeout(this._raf);
  }

  __raf (onRender) { // requestAnimationFrame
    const NOW = Date.now() / 1e3;

    if (!this._paused) {
      const {
        renderSketch = true,
      } = onRender({
        now: NOW,
        delta: NOW - this.lastNow,
        elapsed: NOW - this.START,
        render: this.render,
      }) || {};
      this.lastNow = NOW;

      if (this.stats)
        this.stats.update();
    }

    // if (renderSketch)
    //   render();
    requestAnimationFrame(this._raf);
  }
}

const sketch = new Sketch();
window.$sketch = sketch;

export default sketch;

import { ShaderMaterial } from 'three'
import { CopyShader } from 'three/addons/shaders/CopyShader';
import Quad from '/lib/Quad.js';
let debugQuad;
export function debug (inRT) {
  if (!debugQuad)
    debugQuad = new Quad(new ShaderMaterial(CopyShader));
  debugQuad.material.uniforms.tDiffuse.value = inRT.texture;
  debugQuad.render();
}

if ( ! sketch.renderer.extensions.has( "OES_texture_float" ) ) {
  console.warn("No OES_texture_float support for float textures.");
}

if ( sketch.renderer.capabilities.maxVertexTextures === 0 ) {
  console.warn("No support for vertex shader textures.");
}

const exts = [
  'ANGLE_instanced_arrays',
  'EXT_shader_texture_lod',
  'EXT_blend_minmax',
  'EXT_color_buffer_half_float',
  'EXT_disjoint_timer_query',
  'EXT_frag_depth',
  'EXT_sRGB',
  'EXT_texture_filter_anisotropic',
  'OES_draw_buffers_indexed',
  'OES_element_index_uint',
  'OES_standard_derivatives',
  'OES_texture_float',
  'OES_texture_float_linear',
  'OES_texture_half_float',
  'OES_texture_half_float_linear',
  'OES_vertex_array_object',
  'WEBGL_color_buffer_float',
  'WEBGL_compressed_texture_etc1',
  'WEBGL_compressed_texture_pvrtc',
  'WEBGL_compressed_texture_s3tc',
  'WEBGL_compressed_texture_s3tc_srgb',
  'WEBGL_debug_renderer_info',
  'WEBGL_debug_shaders',
  'WEBGL_depth_texture',
  'WEBGL_draw_buffers',
  'WEBGL_lose_context',
  'WebGL2RenderingContext',
  'WebGLActiveInfo',
  'WebGLBuffer',
  'WebGLContextEvent',
  'WebGLFramebuffer',
  'WebGLObject',
  'WebGLProgram',
  'WebGLQuery',
  'WebGLRenderbuffer',
  'WebGLRenderingContext',
  'WebGLSampler',
  'WebGLShader',
  'WebGLShaderPrecisionFormat',
  'WebGLSync',
  'WebGLTexture',
  'WebGLTransformFeedback',
  'WebGLUniformLocation',
  'WebGLVertexArrayObject',
];
exts.forEach(ext => sketch.exts[ext] = sketch.renderer.extensions.has(ext));
console.log(sketch)