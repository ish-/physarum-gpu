export function insertAfter (input, search, str) {
  return input.replace(search, `${ search } ${ str }`);
}
