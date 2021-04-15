import {setStorage} from '../../generic-utils/storage.js';

/**
 * @param {Internationalizer} _
 * @param {StorageGetCallback} cb
 * @returns {StorageGetCallback}
 */
function storageGetterErrorWrapper (_, cb) {
  return (data) => {
    if (data === null) {
      setStorage('sundriven', {}, storageSetterErrorWrapper(_, cb));
      // This would loop (and data will be null on first run)
      // alert(_(
      //  'ERROR: Problem retrieving storage; refreshing ' +
      //  'page to try to resolve...')
      // );
      // location.reload();
    } else {
      cb(data);
    }
  };
}

/**
* @param {Internationalizer} _
 * @param {StorageSetCallback} cb
 * @returns {StorageSetCallback}
 */
function storageSetterErrorWrapper (_, cb) {
  return (val) => {
    if (!val) {
      alert(_(
        'ERROR: Problem setting storage; refreshing page to try to resolve...'
      ));
      location.reload();
      return;
    }
    if (cb) {
      cb(val);
    }
  };
}

export {storageGetterErrorWrapper, storageSetterErrorWrapper};
