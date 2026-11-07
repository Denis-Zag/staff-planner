import config from './config.js';

export const key = 'tracker-v1-' + config.repo;

// The previous release used a fixed namespace for saved records and JSON exports.
// Its byte sequence is kept here solely to identify that existing data.
const previousNamespace = new TextDecoder().decode(Uint8Array.of(102, 103, 105, 112, 48, 55));
export const legacyKey = previousNamespace + '-v2-' + previousNamespace + '-' + config.repo;

export function activeStorageKey() {
  if (localStorage.getItem(key) !== null) return key;
  return localStorage.getItem(legacyKey) !== null ? legacyKey : key;
}
