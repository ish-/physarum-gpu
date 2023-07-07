import { ShaderMaterial } from 'three';
import QuadFrame from '/lib/QuadFrame';
import { uid } from '/lib/utils';
import { GuiUniforms } from '/lib/gui';

import defaultUvVertGlsl from '/shaders/defaultUv.vert.glsl?raw';
import noiseFragGlsl from '/shaders/noise.frag.glsl?raw';
import mxNoiseGlsl from '/lib/mx-noise.glsl?raw';

const _noiseFragGlsl = noiseFragGlsl.replace('// <functions>', mxNoiseGlsl);

export default function NoiseFrame ({
  name,
  uniforms = {},
  size,
}) {
  const _uid = uid();
  name ??= 'noiseFrame' + _uid;

  const noiseMat = new ShaderMaterial({
    uniforms: GuiUniforms(name, {
      octaves: 2,
      lacunarity: 5,
      diminish: .5,
      scale: 3,
      speed: 1,
      ...uniforms,
    }, {
      seed: Math.random() * 1e2,
      time: 0,
    }),
    vertexShader: defaultUvVertGlsl,
    fragmentShader: _noiseFragGlsl,
  });

  const noiseFrame = new QuadFrame({
    ...QuadFrame.computeOpts,
    size,
    material: noiseMat,
  });

  return noiseFrame;
}