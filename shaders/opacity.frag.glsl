uniform sampler2D tSource;
uniform float opacity;

varying vec2 vUv;

void main() {
  vec4 source = texture2D( tSource, vUv );
  source.a *= opacity;

  gl_FragColor = source;
}
