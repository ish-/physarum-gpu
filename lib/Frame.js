import {
  WebGLRenderTarget,
  FloatType,
  HalfFloatType,
  NearestFilter,
} from 'three';

import sketch from '/lib/Sketch';

export default class Frame extends WebGLRenderTarget {
  static computeOpts = {
    type: sketch.computeTextureType,
    minFilter: NearestFilter, magFilter: NearestFilter,
    depthBuffer: false,
  };

  renderer = sketch?.renderer;

  constructor(options = {}) {
    const {
      size: _size,
      width = _size || sketch.W * sketch.dpi,
      height = _size || sketch.H * sketch.dpi,
      ...opts
    } = options;
    super(width, height, opts);
  }

  render ({ scene, camera } = {}, renderer = this.renderer) {
    renderer.setRenderTarget(this);
    renderer.render(scene, camera);
    return this;
  }
}
