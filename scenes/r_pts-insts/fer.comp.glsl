uniform float opacity;
uniform float blur;
uniform vec2 uPointer;
uniform float uSensorFerLimit;
// uniform sampler2D tVideo;

vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  color += texture2D(image, uv) * 0.29411764705882354;
  color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
  color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
  return color;
}

float myBlur (sampler2D img, vec2 uv, vec2 pixel, vec2 direction) {
  float res = 0.;
  float neibStr = (1. - blur / 4.);
  res += texture2D(img, uv + vec2(0., pixel.y)).r; //N
  res += texture2D(img, uv - vec2(0., pixel.y)).r; //S
  res += texture2D(img, uv - vec2(pixel.x, 0.)).r; //W
  res += texture2D(img, uv + vec2(pixel.x, 0.)).r; //E
  res *= neibStr;
  res += texture2D(img, uv).r * (1. + blur);
  return res / 5.;
}

// float blendAdd(float base, float blend) {
//   return min(base+blend,1.0);
// }
float blendAdd(float base, float blend) {
  return base+blend;
}

float blendAdd(float base, float blend, float opacity) {
  return (blendAdd(base, blend) * opacity + base * (1.0 - opacity));
}

// vec3 blendAdd(vec3 base, vec3 blend) {
//   return min(base+blend,vec3(1.0));
// }
vec3 blendAdd(vec3 base, vec3 blend) {
  return base+blend;
}
vec3 blendAdd(vec3 base, vec3 blend, float opacity) {
  return (blendAdd(base, blend) * opacity + base * (1.0 - opacity));
}

vec4 compute () {
  vec2 toAspect = vec2(aspect, 1.);
  // prev = blur5( tPrev, vUv, resolution.xy, normalize(vUv*2.-1.));
  // float prevFer = myBlur( tPrev, vUv, 1./resolution.xy, vec2(1., 0.));
  float prevFer = texture2D( tPrev, vUv).r;
  float nextFer = texture2D( tInput, vUv /* / vec2(aspect, 1.) */ ).r;
  // vec3 video = texture2D (tVideo, vUv).rgb;
  // vec3 video = 1. - edge(tVideo, vUv, resolution).rgb;

  float fer = clamp(0., blendAdd(nextFer, prevFer, opacity), uSensorFerLimit * 1.2);
  // float mouse = sdBox(translate(vUv, uPointer)*toAspect, vec2(.02, .02)) < 0. ? 1. : 0.;

  vec4 data = vec4(fer, 0., 0., 1.);

  #ifdef USE_BLOCKS
    float boxes = 0.;
    for (int i = 0; i < 20; i++) {
      vec4 dims = uBlocks[i];
      vec2 uvPos = dims.xy / resolution;
      if (uvPos.x < -100.)
        break;
      uvPos.x = 1. - uvPos.x;
      vec2 uvSize = dims.zw / resolution;
      // vec2 uvSize = vec2(.1, .1);
      float box = sdBox(translate(vUv, 1. - uvPos)/* *toAspect */, uvSize) < 0. ? 20. : 0.;
      boxes += box;
    }
    data.g = boxes;
  #endif

  // fer = fer /*+ mouse *//* + boxes */;
  // vec2 pointer = uPointer * resolution;
  // fer = clamp(0., fer + (1. - smoothstep(3., 7., distance(gl_FragCoord.xy, pointer))) * .3, .99);
  // return vec4(fer, boxes, 0., 1.);
  return data;
}
