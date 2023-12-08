export const DEV = (() => {
  const h = window.location.hostname;
  return h.includes('localhost') || h.includes('127.0.0.1');
})();
