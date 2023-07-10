import {
  WebGLRenderTarget,
  FloatType,
  HalfFloatType,
  NearestFilter,
} from 'three';

import sketch from '/lib/Sketch';

sketch.frames = {};

let count = 0;

export default class Frame extends WebGLRenderTarget {
  static computeOpts = {
    type: sketch.computeTextureType,
    minFilter: NearestFilter, magFilter: NearestFilter,
    depthBuffer: false,
  };

  renderer = sketch?.renderer;
  size = { x: 1, y: 1 };

  constructor(options = {}) {
    let {
      size: _size,
      width = _size,
      dpi = !_size ? sketch.dpi : 1,
      height = _size,
      name = 'Frame' + (count++),
      ...opts
    } = options;

    let isSketchSize;
    if (!width && sketch) {
      isSketchSize = true;
      width = sketch.W * dpi;
      height = sketch.H * dpi;
    }
    super(width, height, opts);

    this.name = name;
    if (isSketchSize) {
      this.isSketchSize = isSketchSize;
      this.dpi = dpi;
      Object.assign(this.size, { x: width, y: height });
      sketch.onResize(this.setSize.bind(this));
    }

    console.log(`new ${this.name}`, this);
  }

  setSize (w, h) {
    console.log(`${this.name}.setSize()`, this);
    Object.assign(this.size, { x: w, y: h });

    super.setSize(w * this.dpi, h * this.dpi);
  }

  render ({ scene, camera } = {}, renderer = this.renderer) {
    renderer.setRenderTarget(this);
    renderer.render(scene, camera);
    return this;
  }
}
