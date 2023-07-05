import * as THREE from 'three';

const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.PerspectiveCamera( 70, width/height, .0001, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( width,height);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();

import createSketch from '/scenes/r_pts-insts';
const sketch = createSketch({ scene, renderer, camera, width, height });

const START = Date.now() / 1e3;
let lastNow = START;
function _loop () {
  const NOW = Date.now() / 1e3;

  const {
    renderSketch = true,
  } = sketch.onRender({
    now: NOW,
    delta: NOW - lastNow,
    elapsed: NOW - START,
    render,
  }) || {};
  lastNow = NOW;

  if (renderSketch)
    render();
  requestAnimationFrame(_loop);
}
setTimeout(_loop);

// let lastRT = null;
function render ({ scene: _scene = scene, camera: _camera = camera, target = null } = {}) {
  // if (lastRT !== target)
  renderer.setRenderTarget(target);
  // lastRT = target;

  renderer.render(_scene, _camera);
}