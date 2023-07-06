uniform float damp;

uniform sampler2D tPrev;
uniform sampler2D tInput;
uniform int thisFrame;
uniform vec4 resetColor;

varying vec2 vUv;

#ifdef defineCompute
// compute
#endif

// vec3 blendAdd(vec3 base, vec3 blend) {
//   return min(base+blend,vec3(1.0));
// }
// vec3 blendAdd(vec3 base, vec3 blend, float opacity) {
//   return (blendAdd(base, blend) * opacity + base * (1.0 - opacity));
// }

void main() {
  if (thisFrame == -1) {
    gl_FragColor = resetColor;
    return;
  }

  vec4 prev = texture2D( tPrev, vUv );

  vec4 res = vec4(0.);
  #ifdef defineCompute
    res = _compute(prev);
  #endif
  // #ifndef defineCompute
  //   vec4 inp = texture2D( tInput, vUv );
  //   res = prev + inp * .01;
  // #endif

  // #ifdef damping
  //   res = vec4(blendAdd(prev.rgb, res.rgb, damp), prev.a);
  // #endif

  gl_FragColor = res;
}