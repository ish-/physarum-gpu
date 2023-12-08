//! PREPEND
uniform vec3 uTime;
uniform float pulseWidth;
uniform float pulseSmooth;
// uniform float pulseIntensity;
uniform vec3 pulseColor;
uniform float pulseLerp;
varying float vInstanceZ;

//! INSERT_AFTER #include <map_fragment>
float r = 1. / pulseWidth;
float lerp = (1. - pulseLerp);
lerp = lerp*(1.+r)-r + vInstanceZ*r;
float pulse = smoothstep(0., pulseSmooth, lerp)
    * smoothstep(1., 1. - pulseSmooth, lerp) * 2.;
vec4 _pulseColor = vec4(pulseColor, 1.) * pulse;
// diffuseColor = mix(diffuseColor, _pulseColor, pulse / 2.);
diffuseColor *= vec4(1.) - pulse / 2. + _pulseColor;