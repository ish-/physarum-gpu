import { GUI } from 'lil-gui';

const gui = new GUI({ title: 'Controls', closeFolders: true });

export { gui };

export function Presets () {
  const DEFAULT_PRESET_NAME = '! Default';
  let presets = Object.assign({
    [DEFAULT_PRESET_NAME]: {},
  }, JSON.parse(localStorage.getItem('gui.presets') || null) || {});

  const pars = {
    preset: localStorage.getItem('gui.curPreset') || DEFAULT_PRESET_NAME,
    savePreset () {
      const tmpName = pars.preset === DEFAULT_PRESET_NAME
        ? (new Date).toLocaleDateString() + ' ' + (new Date).toLocaleTimeString()
        : pars.preset;
      const presetName = window.prompt('Preset name', tmpName);
      if (!presetName)
        return;
      pars.preset = presetName;
      const preset = gui.save();
      preset.controllers.preset = presetName;
      presets[presetName] = preset;
      updatePresetDisplay(presetName);
      saveLocal();
    },
    deletePreset () {
      console.log('deletePreset()', pars.preset)
      if (pars.preset === DEFAULT_PRESET_NAME)
        return;
      delete presets[pars.preset];
      updatePresetDisplay(DEFAULT_PRESET_NAME);
      saveLocal();
    }
  };
  setTimeout(() => {
    presets[DEFAULT_PRESET_NAME] = gui.save();
    loadPreset(pars.preset);
  }, 50);

  let _lastLoaded;
  let _lastLoadedTime;
  function loadPreset (presetName) {
    console.log('loadPreset()', presetName);
    const now = Date.now();
    if (presetName === _lastLoaded || now < _lastLoadedTime + 1e3)
      return console.warn('loadPreset()', 'rejected', presetName);
    _lastLoaded = presetName;
    _lastLoadedTime = now;
    const preset = presets[presetName];
    console.log('loadPreset()', presetName, preset);
    gui.load(preset);
    updatePresetDisplay(presetName);
    saveLocal();
  }

  function updatePresetDisplay (presetName) {
    if (presetName)
      pars.preset = presetName;
    presetCtrl._values = Object.keys(presets).sort();
    presetCtrl._names = presetCtrl._values;
    presetCtrl.$select.innerHTML = presetCtrl._names.map((name, i) =>
      `<option value="${ presetCtrl._values[i] }">${ name }</option>`).join('');
    if (presetName)
      presetCtrl.setValue(presetName);
    presetCtrl.updateDisplay();
  }

  function saveLocal () {
    const _presets = { ...presets };
    delete _presets[DEFAULT_PRESET_NAME];
    localStorage.setItem('gui.presets', JSON.stringify(_presets));
    localStorage.setItem('gui.curPreset', pars.preset);
  }

  const presetCtrl = gui.add(pars, 'preset', Object.keys(presets)).onChange((v) => {
    if (!v)
      return console.warn(`presetCtrl.onChange() === `, undefined)
    loadPreset(v)
  })
  ctrlWidth(60, presetCtrl);
  ctrlWidth(20, gui.add(pars, 'savePreset').name('💾'));
  ctrlWidth(20, gui.add(pars, 'deletePreset').name('❌'));
}

export function ctrlWidth (w, ctrl) {
  Object.assign(ctrl.domElement.style, {
    width: `${ w }%`,
    display: 'inline-block',
  });
  return ctrl;
}

// export function matUniformGui (mat, folder) {
//   return {
//     add (uName, min = 0, max = 10, step = .1) {
//       folder.add(mat.uniforms[uName], 'value', min, max, step).name(uName);
//       return this;
//     },
//   };
// }

let skipGui = false;
export function setSkipGui (bool) { skipGui = bool }

export function GuiUniforms (folder, uniforms, noGuiUniforms) {
  const _uniforms = {};

  if (!skipGui && typeof folder === 'string')
    folder = gui.addFolder(folder);
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

      if (!skipGui && !noGui && folder) {
        if (isSelect) {
          const prox = { value, opts: { ...opts } };
          Object.keys(opts).forEach((k, i) => {
            if (value === opts[k])
              prox.value = k;
            prox.opts[k] = k;
          });

          folder.add(prox, 'value', prox.opts).name(key).onChange(k => {
            // console.log(_uniforms[key].value, opts[k])
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

  Object.defineProperties(_uniforms, {
    open: { value () { folder.open(); return _uniforms; } },
    hide: { value () { folder.hide(); return _uniforms; } },
  })

  return _uniforms;
}