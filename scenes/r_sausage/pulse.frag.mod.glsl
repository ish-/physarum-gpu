//! PREPEND
uniform vec3 uTime;
uniform float pulseWidth;
uniform float pulseLerp;
varying float vInstanceZ;

//! INSERT_AFTER #include <map_fragment>
float r = 1. / pulseWidth;
float lerp = (1. - pulseLerp);
lerp = lerp*(1.+r)-r + vInstanceZ*r;
diffuseColor *= 1. + smoothstep(0., .5, lerp) * smoothstep(1., .5, lerp) * 2.;