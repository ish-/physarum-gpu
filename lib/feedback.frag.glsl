uniform float damp;

uniform sampler2D tOld;
uniform sampler2D tNew;
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
    vec4 texelOld = texture2D( tOld, vUv );
    vec4 texelNew = texture2D( tNew, vUv );
    gl_FragColor = texelNew* .01 + texelOld;
      #ifdef damping
        texelOld *= damp * when_gt( texelOld, 0.1 );
      #endif
  #endif

}