export function insertAfter (input, search, str) {
  return input.replace(search, `${ search } ${ str }`);
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