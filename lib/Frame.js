import {
  WebGLRenderTarget,
  FloatType,
  NearestFilter,
} from 'three';

export default class Frame extends WebGLRenderTarget {
  static computeOpts = { type: FloatType, minFilter: NearestFilter, magFilter: NearestFilter };

  renderer = null;

  constructor(options = {}) {
    const {
      size: _size,
      width = _size,
      height = _size,
      ...opts
    } = options;
    super(width, height, options);
  }

  render ({ scene, camera } = {}, renderer = window.$sketch.renderer) {
    renderer.setRenderTarget(this);
    renderer.render(scene, camera);
    return this;
  }
}