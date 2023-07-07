import sketch, { debug } from '/lib/Sketch';

import {
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
} from 'three';

const geo = new BoxGeometry(1, 1);
const mat = new MeshBasicMaterial({ color: 0xFF0000 });
const mesh = new Mesh(geo, mat);
mesh.position.z = -3.1;

sketch.scene.add(mesh);

sketch.startRaf(({ elapsed }) => {
  const speed = elapsed / 1e2;
  mesh.rotation.x += speed;
  mesh.rotation.y += speed / 3 * 2;
  sketch.render();
});