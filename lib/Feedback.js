import {
  HalfFloatType,
  FloatType,
  MeshBasicMaterial,
  NearestFilter,
  LinearFilter,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderTarget,
  Vector2,
  RawShaderMaterial,
} from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

import fragmentShader from './feedback.frag.glsl?raw';
import vertexShader from '/shaders/defaultUv.vert.glsl?raw';

import sketch from '/lib/sketch';

export default class FeedbackPass{
  frame = 0;

  constructor({
    damp = 0.96,
    renderer = sketch.renderer,
    size: _size,
    width = _size,
    height = _size,
    target,
    wrap,
    type = sketch.computeTextureType,
    uniforms,
    filter = NearestFilter,
    shader: {
      damping = true,
      compute,
      resetColor = [0, 0, 0, 0],
    } = {},
    initTexture,
  }) {
    const size = new Vector2(); renderer?.getSize(size);
    width = width || size?.x || window.innerWidth;
    height = height || size?.y || window.innerHeight;

    this.initTexture = initTexture;

    if (target instanceof WebGLRenderTarget)
      this.target = target;
    else if (target)
      this.target = new WebGLRenderTarget( width, height, {
        magFilter: filter,
        minFilter: filter,
        type,
      } );

    this.renderer = renderer;

    this.textureComp = new WebGLRenderTarget( width, height, {
      magFilter: filter,
      minFilter: filter,
      wrapS: wrap,
      wrapT: wrap,
      type,
    } );

    this.textureOld = new WebGLRenderTarget( width, height, {
      magFilter: filter,
      minFilter: filter,
      wrapS: wrap,
      wrapT: wrap,
      type,
    } );

    this.compFsMaterial = new ShaderMaterial( {
      defines: {
        damping: !!damping,
        defineCompute: !!compute,
      },

      uniforms: Object.assign({
        tPrev: { value: null },
        tInput: { value: null },
        damp: { value: damp },
        resolution: { value: { x: width, y: height } },
        aspect: { value: width / height },

        thisFrame: { value: 0 },
        resetColor: { value: resetColor },
        ...uniforms,
      }),
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    } );

    if (compute) {
      compute = compute.replace('compute', '_compute');
      this.compFsMaterial.fragmentShader = this.compFsMaterial.fragmentShader
        .replace('// compute', compute);
    }

    this.compFsQuad = new FullScreenQuad( this.compFsMaterial );

    this.copyFsMaterial = new MeshBasicMaterial();
    this.copyFsQuad = new FullScreenQuad( this.copyFsMaterial );

    if (initTexture)
      this.initWithTexture(initTexture);
  }

  initWithTexture (texture = this.initTexture) {
    // renderer.copyTextureToTexture(new Vector2(0, 0), initTexture, this.textureOld.texture);
    this.renderer.setRenderTarget( this.textureOld );
    this.copyFsQuad.material.map = texture;
    this.copyFsQuad.render(this.renderer);
  }

  setSize (w, h) {
    this.target?.setSize(w, h);
    this.textureComp.setSize(w, h);
    this.textureOld.setSize(w, h);
    this.uniforms.resolution.value = { x: w, y: h };
    this.uniforms.aspect.value = w / h;
  }

  reset (frame = -1)  {
    this.frame = frame;
  }

  render( writeBuffer = this.target, readBuffer/*, deltaTime, maskActive*/ ) {

    this.uniforms[ 'tPrev' ].value = this.textureOld.texture;
    if (readBuffer)
      this.uniforms[ 'tInput' ].value = readBuffer.texture;
    this.uniforms[ 'thisFrame' ].value = this.frame;

    this.frame++;
    // console.time('feedback.render');
    this.renderer.setRenderTarget( this.textureComp );
    this.compFsQuad.render( this.renderer );
    // console.timeEnd('feedback.render');
    this.copyFsQuad.material.map = this.textureComp.texture;

    if ( this.renderToScreen ) {

      this.renderer.setRenderTarget( null );
      this.copyFsQuad.render( this.renderer );

    } else if (writeBuffer) {

      // console.time('feedback.writeBuffer');
      this.renderer.setRenderTarget( writeBuffer );

      if ( this.clear ) this.renderer.clear();

      this.copyFsQuad.render( this.renderer );
      // console.timeEnd('feedback.writeBuffer');

    }

    // Swap buffers.
    const temp = this.textureOld;
    this.textureOld = this.textureComp;
    this.textureComp = temp;
    // Now textureOld contains the latest image, ready for the next frame.

  }

  get texture () {
    return this.target?.texture || this.textureOld.texture;
  }

  get uniforms () { return this.compFsMaterial.uniforms }

  dispose() {

    this.textureComp.dispose();
    this.textureOld.dispose();

    this.compFsMaterial.dispose();
    this.copyFsMaterial.dispose();

    this.compFsQuad.dispose();
    this.copyFsQuad.dispose();

  }

}
