import { debounce } from '/lib/utils';

import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  HalfFloatType,
  FloatType,
  EventDispatcher,
} from 'three';

import { onTouchStart, onTouchEnd, onTouchMove, guiCtrlWidth } from '/lib/utils';

class Sketch extends EventDispatcher {
  scene = new Scene();
  exts = {};
  size = { x: window.innerWidth, y: window.innerHeight};
  timeUniform = { value: {x: 0, y: 0, z: 0, w: 0} };
  debug = true;

  constructor ({
    antialias = true,
    canvas = document.querySelector('#canvas'),
    camera = new PerspectiveCamera( 70, 1, .0001, 1000 ),
  } = {}) {
    super();

    this.renderer = new WebGLRenderer({ antialias, canvas });
    this.dpi = Math.min(2, window.devicePixelRatio);

    this.render = this.render.bind(this);

    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', debounce(
      this._onResize.bind(this),
      800,
    ));
    this.camera = camera;
    this._onResize({ silent: true });
    this.camera.position.z = -1;

    this.computeTextureType = this.renderer.extensions.has('OES_texture_float_linear')
      ? FloatType : HalfFloatType;

    // window.addEventListener('blur', e => { this._paused = true });
    // window.addEventListener('focus', e => { this._paused = false });
  }

  _dpi = 1;
  get dpi () { return this._dpi }
  set dpi (dpi) {
    this._dpi = dpi;
    this.renderer.setPixelRatio(dpi);
  }

  get W () { return this.size.x }
  get H () { return this.size.y }
  _onResize ({ silent }) {
    console.log('Sketch._onResize()');
    const { size } = this;
    const { x: W, y: H } = this.size = { x: window.innerWidth, y: window.innerHeight }/*.multiplyScalar(this.dpi)*/;
    this.renderer.setSize(W, H, false);
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = W / H;
      this.camera.updateProjectionMatrix();
    }
    this.dispatchEvent({ type: 'resize', size, dpi: this.dpi });
  }

  on (eventName, fn) { this.addEventListener(eventName, fn) }
  off (eventName, fn) { this.removeEventListener(eventName, fn) }

  onResize (fn) {
    this.addEventListener('resize', e => {
      const { width, height } = this.size;
      const { dpi } = this;
      fn(width, height, dpi);
    });
  }

  render ({ scene = this.scene, camera = this.camera, target = null } = {}) {
    if (this.renderer.getRenderTarget() !== target)
      this.renderer.setRenderTarget(target);
    this.renderer.render(scene, this.camera, target);
  }

  // link (obj) {
  //   obj.$root = sketch;
  //   obj.$parent = this;
  //   obj.$link = this.link.bind(obj);
  //   return obj;
  // }

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
    const now = Date.now() / 1e3;

    const delta = now - this.lastNow;
    const elapsed = now - this.START;

    this.timeUniform.value.x = elapsed;
    this.timeUniform.value.y = delta;
    this.timeUniform.value.z = now;

    if (!this.paused) {
      // if (this.stats)
      //   this.stats.begin();
      const payload = {
        render: this.render,
        now,
        elapsed,
        delta,
      };
      this.dispatchEvent({ type: 'render', ...payload });
      const {
        renderSketch = true,
      } = onRender(payload) || {};
      this.lastNow = now;

      if (this.stats)
        this.stats.update();
      // if (this.stats)
      //   this.stats.end();
    }

    // if (renderSketch)
    //   render();
    requestAnimationFrame(this._raf);
  }

  setFullscreen () {
    document.body.requestFullscreen();
  }

  _hidden = false;
  hidePanels (bool) {
    this._hidden = bool ?? !this._hidden;
    this.stats.domElement.style.display = this._hidden ? 'none' : '';
    if (this.gui)
      this.gui.domElement.style.display = this._hidden ? 'none' : '';
  }

  reset () {
    this.dispatchEvent({ type: 'reset' });
  }

  async initStats () {
    const Stats = (await import('three/addons/libs/stats.module')).default;
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    return this;
  }

  async initGui ({ reset = true } = {}) {
    const { GUI } = await import('lil-gui');
    const gui = new GUI({ title: 'ISh- Sketch', closeFolders: true });
    this.gui = gui;

    guiCtrlWidth(50, gui.add(this, 'setFullscreen').name('fullscreen (F)'));
    guiCtrlWidth(50, gui.add(this, 'hidePanels').name('hide panels (H)'));
    if (reset)
      gui.add(this, 'reset').name('reset (R)');

    return gui;
  }

  initKeys () {
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'input')
        return;

      if (e.code === 'KeyR') this.reset();
      if (e.code === 'KeyF') this.setFullscreen();
      if (e.code === 'KeyH') this.hidePanels();
      if (e.code === 'Space') {
        e.preventDefault();
        this.paused = !this.paused;
      }
    });
    return this;
  }

  initPointer () {
    this.pointer = { x: -10, y: -10, z: 0 };

    let touchDown = 0;
    const handleTouch = (e, z = 1) => {
      const touch = e.pageX != null ? e : e.changedTouches[0];
      let { pageX: x, pageY: y } = touch;
      this.pointer.x = ((x / sketch.W));
      this.pointer.y = (1 - (y / sketch.H));
      this.pointer.z = touchDown;
    }
    onTouchStart(window, e => handleTouch(e, touchDown = 1));
    onTouchEnd(window, e => handleTouch(e, touchDown = 0));
    onTouchMove(window, handleTouch);

    return this;
  }

  async initOrbitCtrl () {
    const { OrbitControls } = (await import('three/addons/controls/OrbitControls'));
    const orbit = new OrbitControls(sketch.camera, sketch.renderer.domElement);
    orbit.listenToKeyEvents( window );
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

// if ( ! sketch.renderer.extensions.has( "OES_texture_float" ) ) {
//   console.warn("No OES_texture_float support for float textures.");
// }

// if ( sketch.renderer.capabilities.maxVertexTextures === 0 ) {
//   console.warn("No support for vertex shader textures.");
// }

// const exts = [
//   'ANGLE_instanced_arrays',
//   'EXT_shader_texture_lod',
//   'EXT_blend_minmax',
//   'EXT_color_buffer_half_float',
//   'EXT_disjoint_timer_query',
//   'EXT_frag_depth',
//   'EXT_sRGB',
//   'EXT_texture_filter_anisotropic',
//   'OES_draw_buffers_indexed',
//   'OES_element_index_uint',
//   'OES_standard_derivatives',
//   'OES_texture_float',
//   'OES_texture_float_linear',
//   'OES_texture_half_float',
//   'OES_texture_half_float_linear',
//   'OES_vertex_array_object',
//   'WEBGL_color_buffer_float',
//   'WEBGL_compressed_texture_etc1',
//   'WEBGL_compressed_texture_pvrtc',
//   'WEBGL_compressed_texture_s3tc',
//   'WEBGL_compressed_texture_s3tc_srgb',
//   'WEBGL_debug_renderer_info',
//   'WEBGL_debug_shaders',
//   'WEBGL_depth_texture',
//   'WEBGL_draw_buffers',
//   'WEBGL_lose_context',
//   'WebGL2RenderingContext',
//   'WebGLActiveInfo',
//   'WebGLBuffer',
//   'WebGLContextEvent',
//   'WebGLFramebuffer',
//   'WebGLObject',
//   'WebGLProgram',
//   'WebGLQuery',
//   'WebGLRenderbuffer',
//   'WebGLRenderingContext',
//   'WebGLSampler',
//   'WebGLShader',
//   'WebGLShaderPrecisionFormat',
//   'WebGLSync',
//   'WebGLTexture',
//   'WebGLTransformFeedback',
//   'WebGLUniformLocation',
//   'WebGLVertexArrayObject',
// ];
// exts.forEach(ext => sketch.exts[ext] = sketch.renderer.extensions.has(ext));
// console.log(sketch)