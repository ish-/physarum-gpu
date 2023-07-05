import {
  // BufferGeometry,
  PlaneGeometry,
  Float32BufferAttribute,
  OrthographicCamera,
  Mesh,
  Scene,
} from 'three';

// const camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
// camera.position.z = 1;
// const geometry = new BufferGeometry();
// geometry.setAttribute( 'position', new Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
// geometry.setAttribute( 'uv', new Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );


export default class Quad {

  constructor( material, renderer ) {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // camera.position.z = 1;
    const geometry = new PlaneGeometry(2, 2);
    this.mesh = new Mesh( geometry, material );
    // this.mesh.position.z = -10;
    this.camera = camera;
    this._renderer = renderer;
    // this.scene = new Scene();
    // this.scene.add(this.mesh);
  }

  dispose() {

    this.mesh.geometry.dispose();

  }

  // render(target = null) {
  //   this._renderer.setRenderTarget(target);
  //   this._renderer.render(this.mesh, this.camera);
  // }

  get material() {

    return this.mesh.material;

  }

  set material( value ) {

    this.mesh.material = value;

  }

}
