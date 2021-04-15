/**
 * @param item
 * @param cb
 */
function getStorage (item, cb) {
  item = localStorage.getItem(item);
  cb(JSON.parse(item));
}
/**
 * @param item
 * @param value
 * @param cb
 */
function setStorage (item, value, cb) {
  localStorage.setItem(item, JSON.stringify(value));
  cb(value);
}

export {getStorage, setStorage};
