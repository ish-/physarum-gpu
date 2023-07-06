import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
} from 'three';

class Sketch {
  scene = new Scene();
  _lastRT = null;

  constructor () {
    this.renderer = new WebGLRenderer();

    document.body.appendChild(this.renderer.domElement);
    this.render = this.render.bind(this);
    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();
  }

  onResize () {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.renderer.setSize(this.W, this.H);
    this.camera = new PerspectiveCamera( 70, this.W / this.H, .0001, 1000 );
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

    this._raf = this.__raf.bind(this, fn);
    setTimeout(this._raf);
  }

  __raf (onRender) { // requestAnimationFrame
    const NOW = Date.now() / 1e3;

    const {
      renderSketch = true,
    } = onRender({
      now: NOW,
      delta: NOW - this.lastNow,
      elapsed: NOW - this.START,
      render: this.render,
    }) || {};
    this.lastNow = NOW;

    // if (renderSketch)
    //   render();
    requestAnimationFrame(this._raf);
  }
}

const sketch = new Sketch();
window.$sketch = sketch;

export default sketch;

import { MeshBasicMaterial } from 'three'
import Quad from '/lib/Quad.js';
let debugQuad;
export function debug (inRT) {
  if (!debugQuad)
    debugQuad = new Quad(new MeshBasicMaterial({ map: inRT.texture }), sketch.renderer);
  debugQuad.render();
}

