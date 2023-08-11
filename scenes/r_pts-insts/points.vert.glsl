precision highp float;

// uniform mat4 modelMatrix;
// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat3 normalMatrix;
// uniform vec3 cameraPosition;
// attribute mat4 instanceMatrix;
// attribute vec3 position;
// attribute vec3 normal;
// attribute vec2 uv;

uniform float pointSize;
uniform float countSq;
uniform float aspect;
uniform sampler2D tPos;

attribute float instanceId;
attribute vec3 gId;

varying vec3 vPos;

void main () {
  vec2 pos = texture2D(tPos, gId.xy).xy;
  // vec4 mvPos = modelViewMatrix * vec4(position, 1.);
  vPos = vec3(pos / vec2(aspect, 1.), 0.);
  // vCamDist = distance(cameraPosition, mvPos);

  // gl_PointSize = 3. * sqrt(size / 2. - length(p));
  gl_PointSize = pointSize;
  // gl_PointSize = size * ( 1. / mvPos.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.);
}