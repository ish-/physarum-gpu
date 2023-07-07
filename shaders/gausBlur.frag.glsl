const vec4[] gaussKernel3x3 =
{
  vec4(-1.0, -1.0, 0.0,  1.0 / 16.0),
  vec4(-1.0,  0.0, 0.0,  2.0 / 16.0),
  vec4(-1.0, +1.0, 0.0,  1.0 / 16.0),
  vec4( 0.0, -1.0, 0.0,  2.0 / 16.0),
  vec4( 0.0,  0.0, 0.0,  4.0 / 16.0),
  vec4( 0.0, +1.0, 0.0,  2.0 / 16.0),
  vec4(+1.0, -1.0, 0.0,  1.0 / 16.0),
  vec4(+1.0,  0.0, 0.0,  2.0 / 16.0),
  vec4(+1.0, +1.0, 0.0,  1.0 / 16.0),
};

void main(void)
{
  const vec2 texelSize = vec2(1.0) / textureSize(offscreen, 0);

  vec4 color = vec4(0.0);
  for (int i = 0; i < gaussKernel3x3.length(); ++i)
    color += gaussKernel3x3[i].w * texture(offscreen, IN.uv + texelSize * gaussKernel3x3[i].xy);

  outColor = color;
}