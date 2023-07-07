// uniform sampler2D tSource;
uniform float opacity;
uniform float time;
uniform float seed;
uniform float speed;

uniform float octaves;
uniform float lacunarity;
uniform  float diminish;
uniform  float scale;

varying vec2 vUv;

// <functions>

void main() {
  vec2 cUv = vUv.xy * 2. - 1.;

  vec3 noise = mx_fractal_noise_vec3(vec3(cUv, time*speed + seed) * scale, int(octaves), lacunarity, diminish);
  // noise = (noise * 2.) - 1.;
  // vec4 source = texture2D(tSource, fract(vUv + noise/10.));

  // gl_FragColor = source + vec4(cUv.xy, cUv.y, 1.);
  gl_FragColor = vec4(noise, 1.);
}
