// float lerp (float x, float y, float a) { return x * (1. - a) + y * a; }
// float toRange (float x1, float y1, float x2, float y2, float a) { return lerp(x2, y2, invlerp(x1, y1, a)); }
float invlerp (float x, float y, float a) { return (a - x) / (y - x); }
float toRange (float x1, float y1, float x2, float y2, float a) { return mix(x2, y2, invlerp(x1, y1, a)); }

float toRangeFract(float min, float max, float v) {
  return mix(min, max, fract(invlerp(min, max, v)));
}

vec2 toRangeFract(vec2 min, vec2 max, vec2 v) {
  return vec2(
    toRangeFract(min.x, max.x, v.x),
    toRangeFract(min.y, max.y, v.y)
  );
}

