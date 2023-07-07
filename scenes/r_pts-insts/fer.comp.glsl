uniform float opacity;

vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  color += texture2D(image, uv) * 0.29411764705882354;
  color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
  color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
  return color;
}

vec4 myBlur (sampler2D img, vec2 uv, vec2 res, vec2 direction) {
  vec4 color = vec4(0.);
  color += texture2D(img, uv);
  color += texture2D(img, uv + vec2(0., res.y)); //N
  color += texture2D(img, uv - vec2(0., res.y)); //S
  color += texture2D(img, uv - vec2(res.x, 0.)); //W
  color += texture2D(img, uv + vec2(res.x, 0.)); //E
  return color / 5.;
}

vec3 blendAdd(vec3 base, vec3 blend) {
  return min(base+blend,vec3(1.0));
}
vec3 blendAdd(vec3 base, vec3 blend, float opacity) {
  return (blendAdd(base, blend) * opacity + base * (1.0 - opacity));
}
vec4 compute () {
  // prev = blur5( tPrev, vUv, resolution.xy, normalize(vUv*2.-1.));
  vec4 prev = myBlur( tPrev, vUv, 1./resolution.xy, vec2(1., 0.));
  vec4 inp = texture2D( tInput, vUv /* / vec2(aspect, 1.) */ );

  return vec4(blendAdd(inp.rgb, prev.rgb, opacity), 1.);
}
