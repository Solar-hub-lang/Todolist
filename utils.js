let storageSupportedCache = {};

/**
 * Tjekker om localStorage/sessionStorage er tilgængelig og virker
 * @param {string} type 'localStorage' eller 'sessionStorage' (default: 'localStorage')
 * @returns {boolean}
 */
export function storageAvailable(type = 'localStorage') {
  if (type in storageSupportedCache) {
    return storageSupportedCache[type];
  }
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    storageSupportedCache[type] = true;
    return true;
  } catch (e) {
    console.error(`Fejl ved adgang til ${type}:`, e);
    storageSupportedCache[type] = false;
    return false;
  }
}

/**
 * Safe skrivning til localStorage/sessionStorage
 * @param {string} key 
 * @param {string} value 
 * @param {string} type 'localStorage' eller 'sessionStorage' (default: 'localStorage')
 * @returns {boolean} true hvis succes
 */
export function safeSetItem(key, value, type = 'localStorage') {
  if (!storageSupportedCache.hasOwnProperty(type)) {
    storageAvailable(type);
  }
  if (storageSupportedCache[type]) {
    try {
      window[type].setItem(key, value);
      return true;
    } catch (e) {
      console.error(`Fejl ved skrivning til ${type}:`, e);
    }
  }
  return false;
}

/**
 * Safe læsning fra localStorage/sessionStorage
 * @param {string} key 
 * @param {string} type 'localStorage' eller 'sessionStorage' (default: 'localStorage')
 * @returns {string|null}
 */
export function safeGetItem(key, type = 'localStorage') {
  if (!storageSupportedCache.hasOwnProperty(type)) {
    storageAvailable(type);
  }
  if (storageSupportedCache[type]) {
    try {
      return window[type].getItem(key);
    } catch (e) {
      console.error(`Fejl ved læsning fra ${type}:`, e);
    }
  }
  return null;
}

/**
 * Safe fjernelse af key fra localStorage/sessionStorage
 * @param {string} key 
 * @param {string} type 'localStorage' eller 'sessionStorage' (default: 'localStorage')
 * @returns {boolean}
 */
export function safeRemoveItem(key, type = 'localStorage') {
  if (!storageSupportedCache.hasOwnProperty(type)) {
    storageAvailable(type);
  }
  if (storageSupportedCache[type]) {
    try {
      window[type].removeItem(key);
      return true;
    } catch (e) {
      console.error(`Fejl ved fjernelse af ${key} i ${type}:`, e);
    }
  }
  return false;
}
