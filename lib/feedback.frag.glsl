uniform float damp;

uniform sampler2D tPrev;
uniform sampler2D tInput;
uniform int thisFrame;
uniform vec4 resetColor;

varying vec2 vUv;

// main

vec4 when_gt( vec4 x, float y ) {
  return max( sign( x - y ), 0.0 );
}

void main() {
  if (thisFrame == -1) {
    gl_FragColor = resetColor;
    return;
  }

  #ifdef __main
    _main();
  #endif

  #ifndef __main
    vec4 texelOld = texture2D( tPrev, vUv );
    vec4 texelNew = texture2D( tInput, vUv );
    gl_FragColor = texelNew* .01 + texelOld;
      #ifdef damping
        texelOld *= damp * when_gt( texelOld, 0.1 );
      #endif
  #endif

}