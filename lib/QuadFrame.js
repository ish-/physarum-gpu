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
  }

  get material () { return this.quad.material }
}