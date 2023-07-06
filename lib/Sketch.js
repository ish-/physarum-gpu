import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
} from 'three';

class Sketch extends WebGLRenderer {
  scene = new Scene();
  _lastRT = null;

  constructor () {
    super();

    document.body.appendChild(this.domElement);
    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();
  }

  onResize () {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.setSize(this.W, this.H);
    this.camera = new PerspectiveCamera( 70, this.W / this.H, .0001, 1000 );
  }

  render ({ scene = this.scene, camera = this.camera, target = null } = {}) {
    if (this._lastRT !== target)
      super.setRenderTarget(target);
    super.render(scene, this.camera, target);
  }

  link (obj) {
    obj.$root = sketch;
    obj.$parent = this;
    obj.$link = this.link.bind(obj);
  }
}

const sketch = new Sketch();

export default sketch;


