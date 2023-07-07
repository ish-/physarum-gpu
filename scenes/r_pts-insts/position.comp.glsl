const float PI = 3.141592653589793;

uniform float uSensorAng;
uniform float uSensorLod;
uniform float uSensorDist;
uniform float uSensorFerLimit;
uniform float uTurnAng;
uniform float uSpeed;

uniform vec2 uPointer;
uniform vec4 tFer;

vec2 limit (vec2 pos) {
  return fract(sign(pos) * pos);
}

vec4 compute (vec4 prevPos) {
  vec4 vel = texture2D( tInput, vUv );

  float SENSOR_ANG = uSensorAng * PI / 180.;
  float TURN_ANG = uTurnAng * PI / 180.;
  float SENSOR_LOD = uSensorLod;
  // vec2 FIELD_SIZE = uTD2DInfos[siFer].res.zw;
  // vec2 FIELD_ASP = vec2(FIELD_SIZE.y / FIELD_SIZE.x, 1.);
  float SPEED = .001;

  vec2 dir = uPointer - prevPos.xy;
  float dist = length(dir);
  float str = smoothstep(.5, .1, dist) * .005;
  vec2 pos = (prevPos + vel * .01).xy - normalize(dir) * str;
  // pos = limit(pos);
  return vec4(pos, 0., 1.);
}
