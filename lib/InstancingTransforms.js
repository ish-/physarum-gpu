import {
  Object3D,
} from 'three';

export default class InstancingTransforms extends Array {
  constructor (count, mesh) {
    super(count);

    this.mesh = mesh;

    for (let i = 0; i < count; i++)
      this[i] = new Object3D();
  }

  forEach (fn, mesh = this.mesh) {
    for (let i = 0; i < this.length; i++) {
      const t = this[i];
      fn(t, i);
      t.updateMatrix();
      mesh.setMatrixAt(i, t.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
