export function GuiUniforms (folder, uniforms, noGuiUniforms) {
  const _uniforms = {};
  const { gui, skip } = GuiUniforms;

  if (gui && !skip && typeof folder === 'string')
    (async () => { return folder = (await gui).addFolder(folder) })();
  // folder.open(false);

  function add (uniforms, noGui = false) {
    for (let key in uniforms) {
      const uniform = uniforms[key];

      const isArr = Array.isArray(uniform);
      const isObj = uniform && !isArr && typeof uniform === 'object' && uniform.value !== undefined;
      const isSelect = isObj && uniform.opts;
      var value = uniform, min = 0, max = 10, step = .01, opts, type;

      if (isArr)
        [value, min , max , step] = uniform;
      else if (isObj) {
        value = uniform.value;
        opts = uniform.opts;
        type = uniform.type;
      }

      if (!type) {
        if (Number.isFinite(value)) type = 'float';
        else if (typeof value === 'boolean') type = 'bool';
        else if (Array.isArray(value)) {}
        else if ('isTexture' in value) type = 'sampler2D';
        else if ('w' in value) type = 'vec4';
        else if ('z' in value) type = 'vec3';
        else if ('y' in value) type = 'vec2';
      }

      _uniforms[key] = { type, value };

      if (gui && !skip && !noGui && folder) {
        (async function _add () {
          await gui;
          if (isSelect) {
            const prox = { value, opts: { ...opts } };
            Object.keys(opts).forEach((k, i) => {
              if (value === opts[k])
                prox.value = k;
              prox.opts[k] = k;
            });

            folder.add(prox, 'value', prox.opts).name(key).onChange(k => {
              // console.log(_uniforms[key].value, opts[k])
              if (typeof k !== 'string')
                return;
              _uniforms[key].value = opts[k];
            });
          } else {
            folder.add(_uniforms[key], 'value', min, max, step).name(key);
          }
        })();
      }
    }
  }

  add(noGuiUniforms, true);
  add(uniforms);

  Object.defineProperties(_uniforms, {
    open: { value () { gui.then(() => folder.open()); return _uniforms; } },
    hide: { value () { gui.then(() => folder.hide()); return _uniforms; } },
  })

  return _uniforms;
}
