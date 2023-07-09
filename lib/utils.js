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