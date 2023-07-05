uniform float damp;

uniform sampler2D tOld;
uniform sampler2D tNew;
uniform int frame;
uniform vec4 resetColor;

varying vec2 vUv;

// main

vec4 when_gt( vec4 x, float y ) {

  return max( sign( x - y ), 0.0 );

}

void main() {

  vec4 texelOld;
  if (frame == -1) {
    // texelOld = resetColor;
    gl_FragColor = resetColor;
    return;
  } else {
    texelOld = texture2D( tOld, vUv );
  }
  vec4 texelNew = texture2D( tNew, vUv );

  #ifdef __main
  vec4 res = _main(texelOld, texelNew);
  #endif

  // #ifdef damping
  texelOld *= damp * when_gt( texelOld, 0.1 );
  // #endif


  gl_FragColor = max(texelNew, texelOld);

}