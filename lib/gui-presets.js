import { guiCtrlWidth } from '/lib/utils';

export async function GuiPresets (gui, builtinPresets = null) {
  gui = await gui;
  const DEFAULT_PRESET_NAME = '! Default';
  let presets = Object.assign({
      [DEFAULT_PRESET_NAME]: {},
    },
    JSON.parse(localStorage.getItem('gui.presets') || null) || {},
    builtinPresets
  );

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

  const presetCtrl = gui.add(pars, 'Preset', Object.keys(presets)).onChange((v) => {
    if (!v)
      return console.warn(`presetCtrl.onChange() === `, undefined)
    loadPreset(v)
  })
  guiCtrlWidth(60, presetCtrl);
  guiCtrlWidth(20, gui.add(pars, 'savePreset').name('💾'));
  guiCtrlWidth(20, gui.add(pars, 'deletePreset').name('❌'));
}
