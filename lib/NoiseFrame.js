import { ShaderMaterial, Vector2 } from 'three';
import QuadFrame from '/lib/QuadFrame';
import { uid, insertAfter } from '/lib/utils';
import { GuiUniforms } from '/lib/gui';

import defaultUvVertGlsl from '/shaders/defaultUv.vert.glsl?raw';
import noiseFragGlsl from '/shaders/noise.frag.glsl?raw';
import mxNoiseGlsl from '/lib/mx-noise.glsl?raw';
import mathGlsl from '/shaders/math.glsl?raw';

const _noiseFragGlsl = noiseFragGlsl
  .replace('// <noise>', mxNoiseGlsl)
  .replace('// <math>', mathGlsl)
const DEFAULT_RANGE = Symbol('DEFAULT_RANGE');

export default function NoiseFrame ({
  name,
  uniforms = {},
  range, // -1, 1
  seed = Math.random() * 1e2,
  normalize,
  ...quadFrameOpts
}) {
  const _uid = uid();
  name ??= 'noiseFrame' + _uid;

  const defines = {};
  if (range) defines.RANGING = true;
  if (range && range.x === 0 && range.y === 1) defines.INVLERP = true;
  if (normalize) defines.NORMALIZE = true;

  const noiseMat = new ShaderMaterial({
    defines,
    uniforms: GuiUniforms(name, {
      octaves: 2,
      lacunarity: 5,
      diminish: .5,
      scale: 3,
      speed: 1,
      ...uniforms,
    }, {
      range: range || { x: -1, y: 1 },
      seed,
      time: 0,
    }),
    vertexShader: defaultUvVertGlsl,
    fragmentShader: _noiseFragGlsl,
  });

  const noiseFrame = new QuadFrame({
    ...QuadFrame.computeOpts,
    material: noiseMat,
    ...quadFrameOpts,
  });

  return noiseFrame;
}