import { DEV } from '/lib/const';
import { Color } from 'three';

export function paramsToQuery (pars, queryParNames) {
  return queryParNames.map(key => `${key}=${stringifyParam(pars[key])}`)
    .join('&');
}

export function setQueryToParams (pars, query, queryParNames = Object.keys(pars)) {
  queryParNames.forEach(key => {
    if (query[key] == null)
      return;
    if (pars[key] == null) {
      if (DEV)
        throw new Error(`setQueryToParams(): query key "${key}" isnt in 'pars'`);
      return;
    }

    const par = pars[key];
    let queryVal = parseFloat(query[key]);

    if (typeof par === 'object') {
      if (par.value instanceof Color)
        return par.value = new Color(queryVal);
      par.value = queryVal;
    } else
      pars[key] = queryVal;
  });
}

function stringifyParam (par) {
  if (typeof par === 'object') {
    if (par.value instanceof Color) {
      return par.value.getHex();
    } else {
      return par.value;
    }
  } else
    return par;
}
