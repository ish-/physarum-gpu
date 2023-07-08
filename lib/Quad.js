import {
  // BufferGeometry,
  PlaneGeometry,
  // Float32BufferAttribute,
  OrthographicCamera,
  Mesh,
} from 'three';

// const camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
// camera.position.z = 1;
// const geometry = new BufferGeometry();
// geometry.setAttribute( 'position', new Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
// geometry.setAttribute( 'uv', new Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );
const camera = new OrthographicCamera(-.5, .5, .5, -.5, 0, .25);

export default class Quad extends Mesh {
  constructor (material) {
    const geometry = new PlaneGeometry(1, 1);
    // this.mesh = new Mesh( geometry, material );
    super(geometry, material);

    this.camera = camera;
  }

  dispose () {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  render (target = null, renderer = window.$sketch?.renderer) {
    renderer.setRenderTarget(target);
    renderer.render(this, this.camera);
    return this;
  }
}
