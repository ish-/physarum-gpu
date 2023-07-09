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

      const isArr = Array.isArray(uniform);
      const isObj = uniform && !isArr && typeof uniform === 'object' && uniform.value !== undefined;
      const isSelect = isObj && uniform.opts;
      var value = uniform, min = 0, max = 10, step = .01, opts;

      if (isArr)
        [value, min , max , step] = uniform;
      else if (isObj) {
        value = uniform.value;
        opts = uniform.opts;
      }
      _uniforms[key] = { value };

      if (!noGui && folder) {
        if (isSelect) {
          const prox = { value, opts: { ...opts } };
          Object.keys(opts).forEach((k, i) => {
            if (value === opts[k])
              prox.value = k;
            prox.opts[k] = k;
          });

          folder.add(prox, 'value', prox.opts).name(key).onChange(k => {
            console.log(_uniforms[key].value, opts[k])
            _uniforms[key].value = opts[k];
          });
        } else {
          folder.add(_uniforms[key], 'value', min, max, step).name(key);
        }
      }
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