uniform vec3 colorStart;
uniform vec3 colorStop;
varying vec2 vUv;

void main() {
  vec3 color = mix(
    colorStart,
    colorStop,
    vUv.x
  );
  gl_FragColor = vec4(color, 1.);
}
