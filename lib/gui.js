export function matUniformGui (mat, folder) {
  return {
    add (uName, min = 0, max = 10, step = .1) {
      folder.add(mat.uniforms[uName], 'value', min, max, step).name(uName);
      return this;
    },
  };
}
