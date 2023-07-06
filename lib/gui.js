import { GUI } from 'dat.gui';

const gui = new GUI();

export function matUniformGui (mat, folder) {
  return {
    add (uName, min = 0, max = 10, step = .1) {
      folder.add(mat.uniforms[uName], 'value', min, max, step).name(uName);
      return this;
    },
  };
}

export function GuiUniforms (folder, uniforms, { prefix = '', open } = {}) {
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
        folder.add(_uniforms[key], 'value', min, max, step).name(prefix + key);
    }
  }

  add(uniforms);

  if (open)
    folder.open();

  Object.defineProperty(_uniforms, 'noGui', {
    value: function (uniforms) {
      add(uniforms, true);
      return _uniforms;
    }
  })

  return _uniforms;
}