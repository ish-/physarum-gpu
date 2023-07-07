const float PI = 3.141592653589793;

uniform float uSensorAng;
uniform float uSensorLod;
uniform float uSensorDist;
uniform float uSensorFerLimit;
uniform float uTurnAng;
uniform float uSpeed;

uniform vec2 uPointer;
uniform vec4 tFer;

// <functions>

vec4 compute () {
  vec4 prev = texture2D( tPrev, vUv );
  vec4 vel = texture2D( tInput, vUv );

  float SENSOR_ANG = uSensorAng * PI / 180.;
  float TURN_ANG = uTurnAng * PI / 180.;
  float SENSOR_LOD = uSensorLod;
  // vec2 FIELD_SIZE = uTD2DInfos[siFer].res.zw;
  // vec2 FIELD_ASP = vec2(FIELD_SIZE.y / FIELD_SIZE.x, 1.);
  float SPEED = .001;

  vec2 dir = uPointer - prev.xy;
  float dist = length(dir);
  float str = smoothstep(.5, .1, dist) * .005;
  vec2 pos = (prev + vel * .01).xy - normalize(dir) * str;
  pos = toRangeFract(vec2(-aspect, -1), vec2(aspect, 1), pos);
  return vec4(pos, 0., 1.);
}
