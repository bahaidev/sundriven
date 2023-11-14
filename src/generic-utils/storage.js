/**
 * @typedef {any} AnyValue
 */
/**
* @callback StorageGetCallback
* @param {AnyValue} value
* @returns {void}
*/

/**
* @callback StorageSetCallback
* @param {AnyValue} value
* @returns {void}
*/

/**
 * @callback GetStorage
 * @param {string} item
 * @param {StorageGetCallback} cb
 * @returns {void}
 */

/**
 * @type {GetStorage}
 */
function getStorage (item, cb) {
  const itemVal = localStorage.getItem(item);
  cb(JSON.parse(itemVal));
}
/**
 * @param {string} item
 * @param {AnyValue} value
 * @param {StorageSetCallback} cb
 * @returns {void}
 */
function setStorage (item, value, cb) {
  localStorage.setItem(item, JSON.stringify(value));
  cb(value);
}

export {getStorage, setStorage};
