import {$} from '../../vendor/jml-es.js';

import {serializeForm} from '../generic-utils/forms.js';
import {setStorage} from '../generic-utils/storage.js';

import {storageSetterErrorWrapper} from './helpers/storageWrapper.js';
import getGeoPositionWrapper from './helpers/getGeoPositionWrapper.js';
import toggleGrantPermissionButton from
  './helpers/toggleGrantPermissionButton.js';

/**
 * @param {PlainObject} cfg
 * @param {TemplatesObject} cfg.Templates
 * @param {Internationalizer} cfg._
 * @param {GetStorage} cfg.getStorage
 * @param {StorageGetterErrorWrapper} cfg.storageGetterErrorWrapper
 * @returns {Promise<void>}
 */
async function settings ({
  Templates, _,
  getStorage, storageGetterErrorWrapper
}) {
  // Request to get geolocation information to know whether to present the
  //  permission granting button and to alter it when the user makes permission
  //  changes for their browser.
  const result = await navigator.permissions.query({name: 'geolocation'});
  result.addEventListener('change', () => {
    toggleGrantPermissionButton(result.state);
  });

  Templates.settings({
    grantPermissionHidden: result.state === 'granted',
    retrieveCoordinates (e) {
      e.preventDefault();
      $('#retrieving').hidden = false;
      getGeoPositionWrapper(_, ({coords: {latitude, longitude}}) => {
        $('#latitude').value = latitude;
        $('#longitude').value = longitude;
        const evt = new Event('change', {
          cancelable: true
        });
        $('#settings').dispatchEvent(evt);
        $('#retrieving').hidden = true;
      }, (err) => {
        alert(_('geo_error', err.code, err.message));
        $('#retrieving').hidden = true;
      });
    },
    setSettings () {
      const data = serializeForm('settings', {}, {
        inputs: ['geoloc-usage', 'latitude', 'longitude']
      });
      setStorage('sundriven-settings', data, storageSetterErrorWrapper(_));
    },
    async allowNotifications () {
      const status = await Notification.requestPermission();
      if (status === 'denied') {
        alert(_('You will not be able to use the app until permitting this!'));
      } else if (status === 'granted') {
        alert(_('Permission granted; you may now set timers.'));
      }
    }
  });

  // Set up setting defaults
  getStorage('sundriven-settings', storageGetterErrorWrapper(_, (_settings) => {
    Object.entries(_settings).forEach(([key, value]) => {
      $('#' + key).value = value;
    });
  }));
}

export default settings;
