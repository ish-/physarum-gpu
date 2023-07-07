export function insertAfter (input, search, str) {
  return input.replace(search, `${ search } ${ str }`);
}

let _uid = 0;
export function uid () {
  return _uid++;
}
