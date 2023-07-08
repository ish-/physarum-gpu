import { GUI } from 'dat.gui';

const gui = new GUI();

export { gui };

export function matUniformGui (mat, folder) {
  return {
    add (uName, min = 0, max = 10, step = .1) {
      folder.add(mat.uniforms[uName], 'value', min, max, step).name(uName);
      return this;
    },
  };
}

export function GuiUniforms (folder, uniforms, noGuiUniforms) {
  const _uniforms = {};

  if (typeof folder === 'string')
    folder = gui.addFolder(folder);

  function add (uniforms, noGui = false) {
    for (let key in uniforms) {
      const uniform = uniforms[key];

      let value = uniform, min = 0, max = 10, step = .01;
      if (Array.isArray(uniform))
        [value, min , max , step] = uniform;

      _uniforms[key] = { value };

      if (!noGui && folder)
        folder.add(_uniforms[key], 'value', min, max, step).name(key);
    }
  }

  add(noGuiUniforms, true);
  add(uniforms);

  Object.defineProperty(_uniforms, 'open', {
    value: function () {
      folder.open();
      return _uniforms;
    }
  })

  return _uniforms;
}