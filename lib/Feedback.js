import {
  HalfFloatType,
  FloatType,
  MeshBasicMaterial,
  NearestFilter,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderTarget
} from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import defaultUvVert from '/shaders/defaultUv.vert.glsl?raw';
import opacityFrag from '/shaders/opacity.frag.glsl?raw';
import { AfterimageShader } from './AfterimageShader.js';

export default class FeedbackPass extends Pass {
  frame = 0;

  constructor({
    damp = 0.96,
    renderer,
    width,
    height,
    shader: {
      damping = true,
      main,
      resetColor = [0, 0, 0, 0],
    } = {},
  }) {
    super();

    const size = renderer?.getSize();
    width = width || size?.x || window.innerWidth;
    height = height || size?.y || window.innerHeight;

    this.renderer = renderer;
    this.shader = AfterimageShader;

    if (main) {
      main = main.replace('main', '_main');
      this.shader.AfterimageShader.fragmentShader = this.shader.AfterimageShader.fragmentShader.replace('// main', main);
    }

    this.uniforms = UniformsUtils.clone( this.shader.uniforms );

    this.uniforms[ 'damp' ].value = damp;

    this.textureComp = new WebGLRenderTarget( width, height, {
      magFilter: NearestFilter,
      // type: HalfFloatType
      type: FloatType,
    } );

    this.textureOld = new WebGLRenderTarget( width, height, {
      magFilter: NearestFilter,
      // type: HalfFloatType
      type: FloatType,
    } );

    this.compFsMaterial = new ShaderMaterial( {
      defines: {
        damping: !!damping,
        __main: !!main,
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

  render( renderer, writeBuffer, readBuffer/*, deltaTime, maskActive*/ ) {

    this.uniforms[ 'tOld' ].value = this.textureOld.texture;
    this.uniforms[ 'tNew' ].value = readBuffer.texture;
    this.uniforms[ 'thisFrame' ].value = this.frame;

    this.frame++;

    renderer.setRenderTarget( this.textureComp );
    this.compFsQuad.render( renderer );

    this.copyFsQuad.material.map = this.textureComp.texture;

    if ( this.renderToScreen ) {

      renderer.setRenderTarget( null );
      this.copyFsQuad.render( renderer );

    } else {

      renderer.setRenderTarget( writeBuffer );

      if ( this.clear ) renderer.clear();

      this.copyFsQuad.render( renderer );

    }

    // Swap buffers.
    const temp = this.textureOld;
    this.textureOld = this.textureComp;
    this.textureComp = temp;
    // Now textureOld contains the latest image, ready for the next frame.

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
