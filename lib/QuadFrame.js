import Quad from '/lib/Quad';
import Frame from '/lib/Frame';

export default class QuadFrame extends Frame {
  constructor(options = {}) {
    const {
      material,
      ...opts
    } = options;
    super(opts);

    this.quad = new Quad(material);
  }

  render () {
    super.render({ scene: this.quad, camera: this.quad.camera });
    return this;
  }

  setSize (w, h) {
    const { uniforms } = this.material;
    uniforms.resolution.value = { x: w, y: h };
    if (uniforms.aspect) uniforms.aspect.value = w / h;
    super.setSize(w, h);
    return this;
  }

  get material () { return this.quad.material }
  get uniforms () { return this.material.uniforms }
}