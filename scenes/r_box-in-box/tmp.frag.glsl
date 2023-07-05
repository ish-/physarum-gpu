uniform sampler2D tSource;
uniform float opacity;
uniform float time;

uniform float octaves;
uniform float lacunarity;
uniform  float diminish;
uniform  float scale;

varying vec2 vUv;

// <functions>

void main() {
  vec2 cUv = vUv.xy * 2. - 1.;

  vec2 noise = mx_fractal_noise_vec2(vec3(cUv, time) * scale, int(octaves), lacunarity, diminish);
  vec4 source = texture2D(tSource, fract(vUv + noise/10.));

  // gl_FragColor = source + vec4(cUv.xy, cUv.y, 1.);
  gl_FragColor = max(source, vec4(noise, 0., 0.));
}
