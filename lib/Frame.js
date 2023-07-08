import {
  WebGLRenderTarget,
  FloatType,
  HalfFloatType,
  NearestFilter,
} from 'three';

import sketch from '/lib/Sketch';

export default class Frame extends WebGLRenderTarget {
  static computeOpts = { type: sketch.computeTextureType,
    minFilter: NearestFilter, magFilter: NearestFilter };

  renderer = sketch?.renderer;

  constructor(options = {}) {
    const {
      size: _size,
      width = _size || sketch.W,
      height = _size || sketch.H,
      ...opts
    } = options;
    super(width, height, options);
  }

  render ({ scene, camera } = {}, renderer = this.renderer) {
    renderer.setRenderTarget(this);
    renderer.render(scene, camera);
    return this;
  }
}