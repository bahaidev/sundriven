import {$} from '../../vendor/jml-es.js';

import {serializeForm} from '../generic-utils/forms.js';
import {setStorage} from '../generic-utils/storage.js';

import {storageSetterErrorWrapper} from './helpers/storageWrapper.js';

/**
 * @param {PlainObject} cfg
 * @param {TemplatesObject} cfg.Templates
 * @param {PermissionStatus} cfg.result
 * @param {GeoPositionWrapperGetter} cfg.getGeoPositionWrapper
 * @param {Internationalizer} cfg._
 * @returns {void}
 */
function settings ({Templates, result, getGeoPositionWrapper, _}) {
  Templates.settings({
    grantPermissionHidden: result.state === 'granted',
    retrieveCoordinates (e) {
      e.preventDefault();
      $('#retrieving').hidden = false;
      getGeoPositionWrapper(({coords: {latitude, longitude}}) => {
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
}

export default settings;
