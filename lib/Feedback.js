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

export default class FeedbackPass{
  frame = 0;

  constructor({
    damp = 0.96,
    renderer = window.$sketch?.renderer,
    size: _size,
    width = _size,
    height = _size,
    target,
    uniforms,
    shader: {
      damping = true,
      compute,
      resetColor = [0, 0, 0, 0],
    } = {},
    // initRT,
  }) {
    const size = new Vector2(); renderer?.getSize(size);
    width = width || size?.x || window.innerWidth;
    height = height || size?.y || window.innerHeight;
    const type = renderer?.extensions.has( "OES_texture_float" ) ? FloatType : HalfFloatType;

    this.target = target || new WebGLRenderTarget( width, height, {
      magFilter: NearestFilter,
      type,
    } );;
    this.renderer = renderer;
    this.shader = new RawShaderMaterial({
      uniforms: {
        tPrev: { value: null },
        tInput: { value: null },
        damp: { value: damp },
      },
      vertexShader,
      fragmentShader,
    });

    if (compute) {
      compute = compute.replace('compute', '_compute');
      this.shader.fragmentShader = this.shader.fragmentShader.replace('// compute', compute);
    }

    this.uniforms = UniformsUtils.clone( this.shader.uniforms );

    this.uniforms[ 'damp' ].value = damp;
    Object.assign(this.uniforms, uniforms);

    this.textureComp = new WebGLRenderTarget( width, height, {
      magFilter: NearestFilter,
      type,
    } );

    this.textureOld = new WebGLRenderTarget( width, height, {
      magFilter: NearestFilter,
      type,
    } );

    this.compFsMaterial = new ShaderMaterial( {
      defines: {
        damping: !!damping,
        defineCompute: !!compute,
      },

      uniforms: Object.assign(this.uniforms, {
        thisFrame: { value: 0 },
        resetColor: { value: resetColor }
      }),
      vertexShader: this.shader.vertexShader,
      fragmentShader: this.shader.fragmentShader,
    } );

    this.compFsQuad = new FullScreenQuad( this.compFsMaterial );

    this.copyFsMaterial = new MeshBasicMaterial();
    this.copyFsQuad = new FullScreenQuad( this.copyFsMaterial );

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

    this.renderer.setRenderTarget( this.textureComp );
    this.compFsQuad.render( this.renderer );

    this.copyFsQuad.material.map = this.textureComp.texture;

    if ( this.renderToScreen ) {

      this.renderer.setRenderTarget( null );
      this.copyFsQuad.render( this.renderer );

    } else if (writeBuffer) {

      this.renderer.setRenderTarget( writeBuffer );

      if ( this.clear ) this.renderer.clear();

      this.copyFsQuad.render( this.renderer );

    }

    // Swap buffers.
    const temp = this.textureOld;
    this.textureOld = this.textureComp;
    this.textureComp = temp;
    // Now textureOld contains the latest image, ready for the next frame.

  }

  get texture () {
    return this.target?.texture;
  }

  setSize( width, height ) {

    this.textureComp.setSize( width, height );
    this.textureOld.setSize( width, height );

  }

  dispose() {

    this.textureComp.dispose();
    this.textureOld.dispose();

    this.compFsMaterial.dispose();
    this.copyFsMaterial.dispose();

    this.compFsQuad.dispose();
    this.copyFsQuad.dispose();

  }

}
