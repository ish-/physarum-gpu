export function insertAfter (input, search, str) {
  return input.replace(search, `${ search } ${ str }`);
}
export function insertBefore (input, search, str) {
  return input.replace(search, `${ str } ${ search }`);
}

let _uid = 0;
export function uid () {
  return _uid++;
}

export const DEFAULT_DEBOUNCE_DURATION = 500;
export function debounce (method, duration = DEFAULT_DEBOUNCE_DURATION) {
  let timeoutId;

  function debounceWrapper (...args) {
    debounceWrapper.clear();

    timeoutId = setTimeout(() => {
      timeoutId = null;
      method.apply(this, args);
    }, duration);
  }

  debounceWrapper.clear = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounceWrapper.fn = method;

  return debounceWrapper;
}

// import pulseGlsl from '/scenes/r_sausage/pulse.glsl?raw';
// console.log(modifyShader('#include <map_fragment>', pulseGlsl));
export function modifyMatShader (mat, {
  uniforms,
  vertex,
  fragment,
}) {
  mat.onBeforeCompile = shader => {
    if (uniforms)
      Object.assign(shader.uniforms, uniforms);
    if (vertex) {
      shader.vertexShader = vertex.startsWith('//! ') ?
        modifyShader(shader.vertexShader, vertex)
      : vertex;
    }
    if (fragment) {
      shader.fragmentShader = fragment.startsWith('//! ') ?
        modifyShader(shader.fragmentShader, fragment)
      : fragment;
    }
  };
}

export function modifyShader (shader, payload) {
  const mutate = Array.isArray(shader);
  let shaderStr = mutate ? shader[0][shader[1]] : shader;

  const chunks = payload.split('//! ');

  chunks.forEach(chunk => {
    if (!chunk) return;

    const act = chunk.match(/(.+)\n/i)?.[1];
    if (act === 'PREPEND')
      return shaderStr = '\n//! ' + chunk + shaderStr;

    const [, cmd, arg] = act.match(/([.\S]+) (.+)/) || [];
    if (cmd === 'INSERT_AFTER')
      return shaderStr = insertAfter(shaderStr, arg, '\n//! ' + chunk);

    if (cmd === 'INSERT_BEFORE')
      return shaderStr = insertBefore(shaderStr, arg, '\n//! ' + chunk);
  });

  if (mutate)
    shader[0][shader[1]] = shaderStr;
  return shaderStr;
}

export const PROD = process.env.NODE_ENV === 'production';

export function $ (s) { return ((!this || this === window) ? document : this).querySelector(s) }

export function $$ (s) { return [...((!this || this === window) ? document : this).querySelectorAll(s)] }

export function createEl (tag, props, children) {
  if (Array.isArray(tag)) {
    children = tag;
    props = undefined;
    tag = -1;
  }
  if (typeof tag === 'object') {
    children = props;
    props = tag;
    tag = 'div';
  }
  let $el = tag === -1 ? document.createDocumentFragment() : document.createElement(tag);
  if (props)
    Object.keys(props).forEach((key) => {
      const val = props[key];
      if ((key === 'style' || key === 'dataset') && typeof val === 'object')
        return Object.assign($el.style, val);
      $el[key] = val;
    });
  if (children)
    children.forEach($child => $el.append($child));
  return $el;
}

export function px (v) { return `${v}px` }

export function Arr (length, fill = 0) {
  return (new Array(length)).fill(0);
}

export function map (obj, iter) {
  let i = 0;
  for (let k in obj) {
    const res = iter(obj[k], k, i);
    if (res !== undefined)
      obj[k] = res;
    i++;
  }
  return obj;
}

export function toFixed (n, fixed = 2) {
  return Math.round (n * 10 ** fixed) / 10 ** fixed;
}

export function callnpass (fn, ...args) {
  fn(...args);
  return fn;
}

export class Callbacks {
  constructor (fn) {
    this._cbs = [];
    if (fn)
      this._cbs.push(fn);
  }

  call (...args) {
    this._cbs.forEach(fn => fn(...args));
    return this;
  }

  add (fn) {
    this._cbs.push(fn);
    return this;
  }

  remove (fn) {
    const i = this._cbs.indexOf(fn);
    if (~i)
      this._cbs.splice(i, 1);
    else
      throw new Error('Callbacks.remove(): cant find fn', fn);
    return this;
  }
}

export function rand (min = 0, max = 1) {
  return min + Math.random() * (max - min);
}

rand.int = function randInt (min, max) {
  return Math.floor(rand(max + 1, min));
};

export const lerp = (x, y, a) => x * (1 - a) + y * a;
export const invlerp = (x, y, a) => (a - x) / (y - x);
export const rerange = (x1,  y1,  x2,  y2,  a) => lerp(x2, y2, invlerp(x1, y1, a));

// const { userAgent } = window.navigator;
// export const WIN = 'Win';
// export const MAC = 'Mac';
// export const IOS = 'iOS';
// export const ANDROID = 'Android';
//
// export const OS = userAgent.includes('Mac') ? MAC
//   : userAgent.includes('Win') ? WIN
//   : userAgent.includes('iP') ? ISO
//   : userAgent.includes('Android') ? ANDROID
//   : null;

export const touchable = (() => {
  if ('ontouchstart' in window)
    return window.navigator.maxTouchPoints;
  return false;
})();
console.log({touchable})

export function onTouchStart ($el, fn) {
  if (touchable)
    $el.addEventListener('touchstart', fn);
  else
    $el.addEventListener('pointerdown', fn);
}

export function onTouchMove ($el, fn) {
  if (touchable)
    $el.addEventListener('touchmove', fn);
  else
    $el.addEventListener('pointermove', fn);
}

export function onTouchEnd ($el, fn) {
  if (touchable)
    $el.addEventListener('touchend', fn);
  else
    $el.addEventListener('pointerup', fn);
}

export function hash (x) {
  x = x ^ 61 ^ (x >> 16);
  x += x << 3;
  x ^= x >> 4;
  x *= 0x27d4eb2d;
  return x ^= x >> 15;
}

export function hash2 (p) {
  return (1e4 * Math.sin(17.0 * p.x + p.y * 0.1) * (0.1 + Math.abs(Math.sin(p.y * 13.0 + p.x)))) % 1;
}