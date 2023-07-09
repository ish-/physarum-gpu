const float PI = 3.141592653589793;

uniform vec2 sceneRes;

uniform float uSensorAng;
uniform float uSensorLod;
uniform float uSensorDist;
uniform float uSensorFerLimit;
uniform float uTurnAng;
uniform float uSpeed;
uniform float uNoiseStr;

uniform vec3 uPointer;
uniform sampler2D tFer;
uniform sampler2D tPos;
uniform sampler2D tVelNoise;

// <functions>
vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  mat2 m = mat2(c, -s, s, c);
  return m * v;
}


vec4 compute () {
  vec4 sPrevVel = texture2D( tPrev, vUv );
  vec4 sPos = texture2D( tPos, vUv );
  vec2 velNoise = texture2D( tVelNoise, vUv ).xy;

  vec2 prevVel = sPrevVel.xy;
  vec2 pos = sPos.xy;

  vec4 sFer = texture2D( tFer, pos);
  float fer = sFer.r;

  float SENSOR_ANG = uSensorAng * PI / 180.;
  float TURN_ANG = uTurnAng * PI / 180.;
  float SENSOR_LOD = uSensorLod;
  // vec2 FIELD_SIZE = uTD2DInfos[siFer].res.zw;
  vec2 FIELD_ASP = vec2(1. / aspect, 1.);

  vec2 nVel = normalize(prevVel.xy);
  vec2 sensDir1 = rotate(nVel * uSensorDist, SENSOR_ANG);
  vec2 sensDir2 = rotate(nVel * uSensorDist, -SENSOR_ANG);
  float sFer1 = texture2D(tFer, ((pos + 1.)/2. + sensDir1) * FIELD_ASP).r;
  float fer1 = sFer1 > uSensorFerLimit ? sFer1 * -1. : sFer1;
  float sFer2 = texture2D(tFer, ((pos + 1.)/2. + sensDir2) * FIELD_ASP).r;
  float fer2 = sFer2 > uSensorFerLimit ? sFer2 * -1. : sFer2;

  vec2 vel = (nVel + velNoise.xy * uNoiseStr)/*  * uSpeed */;
  vel = rotate(vel, TURN_ANG * sign(fer1 - fer2) * 1.5);

  float pointerDown = uPointer.z;
  vec2 pointer = uPointer.xy * vec2(sceneRes.x/sceneRes.y, 1.);
  vec2 dir = (pos.xy - pointer.xy);
  float dist = length(dir);
  float str = (1. - smoothstep(0., .3, dist)) * 2.;
  vel = vel + normalize(dir) * str * pointerDown;

  vel = normalize(vel) * uSpeed;

  // pos = toRangeFract(vec2(-aspect, -1), vec2(aspect, 1), pos);
  return vec4(vel, 0., 1.);
}
