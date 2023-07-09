// uniform sampler2D tSource;
uniform float opacity;
uniform float time;
uniform float seed;
uniform float speed;

uniform float octaves;
uniform float lacunarity;
uniform float diminish;
uniform float scale;
uniform vec2 range;

varying vec2 vUv;

// <noise>
// <math>

void main() {
  // vec2 cUv = vUv.xy * 2. - 1.;

  vec3 noise = mx_fractal_noise_vec3(
    vec3(vUv, time*speed + seed) * scale,
    int(octaves),
    lacunarity,
    diminish
  );

  #ifdef NORMALIZE
    noise = normalize(noise);
  #endif

  #ifdef RANGING
    #ifdef INVLERP
      noise = invlerp(-1., 1., noise);
    #endif
    #ifndef INVLERP
      noise = toRange(-1., 1., range[0], range[1], noise);
    #endif
  #endif

  gl_FragColor = vec4(noise, 1.);
}
