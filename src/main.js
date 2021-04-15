import * as MeeusSunMoon from '../vendor/meeussunmoon.esm.js';
import {DateTime} from '../vendor/luxon.js';
import {$} from '../vendor/jml-es.js';

import {removeElement, removeChild} from './generic-utils/dom.js';
import {serializeForm} from './generic-utils/forms.js';
import {setLocale} from './generic-utils/i18n.js';
import {getStorage, setStorage} from './generic-utils/storage.js';
import {incrementDate} from './generic-utils/date.js';

import setTemplates from './setTemplates.js';
// import install from './install.js';

(async () => {
const {_, locale} = await setLocale();

const Templates = setTemplates(_);

Templates.document();
Templates.body();

let formChanged = false;
const listeners = {}, watchers = {};

/*
function s (obj) {
    alert(JSON.stringify(obj));
}
*/

/**
 * @param {GeolocationPosition} cb
 * @param {GeolocationPositionError} errBack
 * @throws {Error}
 * @returns {void} (Could change in the future if switch to `watchPosition`)
 */
function getGeoPositionWrapper (cb, errBack) {
  if (!navigator.geolocation) {
    alert(
      _('Your browser does not support or does not have Geolocation enabled')
    );
    throw new Error('Discontinue');
  }
  // We could instead use `getCurrentPosition`, but that wouldn't update with
  //   the user's location
  return navigator.geolocation.getCurrentPosition( // watchPosition(
    cb,
    errBack || function geoErrBack (err) {
      alert(_('geo_error', err.code, err.message));
    }
    /* , { // Geolocation options
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        }; */
  );
}
/**
 * @param {string} name Not presently in use
 * @param {string} _body
 * @returns {void}
 */
function notify (name, _body) {
  // show the notification
  // console.log('notifying');
  const notification = new Notification(
    _('Reminder (Click inside me to stop)'),
    {
      body: _body,
      lang: locale,
      requireInteraction: true // Keep open until click
      // Todo: `dir`: Should auto-detect direction based on locale
    }
  ); // tag=string, icon=url, dir (ltr|rtl|auto)

  // eslint-disable-next-line no-console -- Debugging
  console.log('notification', notification);
  /*
    notification.onshow = function(e) {
    };
    */
  // And vibrate the device if it supports vibration API
  if (navigator.vibrate) {
    navigator.vibrate(500);
  }
}

/**
 * @param {StorageSetCallback} cb
 * @returns {StorageSetCallback}
 */
function storageSetterErrorWrapper (cb) {
  return (val) => {
    if (!val) {
      alert(_(
        'ERROR: Problem setting storage; refreshing page to try to resolve...'
      ));
      window.location.reload();
      return;
    }
    if (cb) {
      cb(val);
    }
  };
}

/**
 * @param {StorageGetCallback} cb
 * @returns {StorageGetCallback}
 */
function storageGetterErrorWrapper (cb) {
  return (data) => {
    if (data === null) {
      setStorage('sundriven', {}, storageSetterErrorWrapper(cb));
      // This would loop (and data will be null on first run)
      // alert(_(
      //  'ERROR: Problem retrieving storage; refreshing ' +
      //  'page to try to resolve...')
      // );
      // window.location.reload();
    } else {
      cb(data);
    }
  };
}
/**
 * @returns {void}
 */
function createDefaultReminderForm () {
  createReminderForm({
    name: '',
    enabled: true,
    frequency: 'daily',
    relativeEvent: 'now',
    minutes: '60',
    relativePosition: 'after'
  });
}

/**
 * @returns {void}
 */
function buildReminderTable () {
  /**
   * @returns {void}
   */
  function createReminder () {
    const {name} = this.dataset;
    getStorage('sundriven', storageGetterErrorWrapper((_forms) => {
      createReminderForm(_forms[name]);
    }));
  }
  getStorage('sundriven', storageGetterErrorWrapper((forms) => {
    removeElement('#forms');
    const sortedForms = Object.keys(forms).sort().map((formKey) => {
      return forms[formKey];
    });
    Templates.reminderTable({
      createDefaultReminderForm, createReminder, sortedForms
    });
  }));
}

/**
 * @param {string} name
 * @returns {void}
 */
function clearWatch (name) {
  if (watchers[name]) {
    navigator.geolocation.clearWatch(watchers[name]);
  }
}

/**
 * @returns {{coords: {latitude: string, longitude: string}}}
 */
function getCoords () {
  const latitude = $('#latitude').value;
  const longitude = $('#longitude').value;
  if (
    Number.isNaN(Number.parseFloat(latitude)) ||
    Number.isNaN(Number.parseFloat(longitude))
  ) {
    return false;
  }
  return {coords: {latitude, longitude}};
}

/**
* @typedef {string} ListenerName
*/

/**
* @typedef {PlainObject} ListenerData
* @property {string} minutes
* @property {"after"|"before"} relativePosition
* @property {"now"|AstronomicalEvent} relativeEvent
* @property {boolean} enabled
* @property {string} name
* @property {"daily"|"one-time"} frequency
*/

/**
 * @param {Object<ListenerName,ListenerData>} sundriven
 * @returns {void}
 */
function updateListeners (sundriven) {
  /**
   * @param {GenericArray} root0
   * @param {ListenerName} root0."0" The listener name
   * @param {ListenerData} root0."1" The listener data
   * @returns {void}
   */
  function updateListenerByName ([name, data]) {
    /**
     * @param {Integer} [date]
     * @returns {{date: Date, time: Integer}}
     */
    function checkTime (date) {
      let minutes = Number.parseFloat(data.minutes);
      minutes = data.relativePosition === 'before'
        ? -minutes
        : minutes; // after|before
      const startTime = Date.now();
      // eslint-disable-next-line no-console -- Debugging
      console.log('date', date);
      date = date && typeof date !== 'number' ? date : new Date(startTime);
      return {date, time: (date.getTime() - startTime) + minutes * 60 * 1000};
    }

    /**
    * @typedef {
    * "civilDawn"|"civilDusk"|"nauticalDawn"|"nauticalDusk"|
    * "astronomicalDawn"|"astronomicalDusk"|"sunrise"|"sunset"|
    * "solarNoon"} AstronomicalEvent
    */

    /**
     * @param {Integer} date
     * @param {AstronomicalEvent} astronomicalEvent
     * @returns {void}
     */
    function getRelative (date, astronomicalEvent) {
      const dt = checkTime(date);
      const {time} = dt;
      ({date} = dt);
      clearTimeout(listeners[name]);
      let timeoutID;
      switch (data.frequency) {
      case 'daily':
        timeoutID = setTimeout(() => {
          notify(name, _(
            astronomicalEvent
              ? 'notification_message_daily_astronomical'
              : 'notification_message_daily',
            name,
            date,
            new Date(Date.now() - time),
            new Date(),
            astronomicalEvent ? _(astronomicalEvent) : null
          ));

          if (astronomicalEvent) {
            console.log('aaaa');
            updateListenerByName([name, data]);
          }
        }, time);
        break;
      default: // one-time
        timeoutID = setTimeout(() => {
          notify(
            name,
            _(
              astronomicalEvent
                ? 'notification_message_onetime_astronomical'
                : 'notification_message_onetime',
              name,
              date,
              new Date(Date.now() - time),
              new Date(),
              astronomicalEvent ? _(astronomicalEvent) : null
            )
          );
          delete listeners[name];
          clearWatch(name);
          data.enabled = 'false';
          setStorage('sundriven', sundriven, storageSetterErrorWrapper(() => {
            if ($('#name').value === name) {
              $('#enabled').checked = false;
            }
            buildReminderTable();
          }));
        }, time);
        break;
      }
      listeners[name] = timeoutID;
    }
    /**
    * @callback getTimesForCoordsCallback
    * @param {PlainObject} root
    * @param {string} root.latitude
    * @param {string} root.longitude
    * @returns {void}
    */
    /**
     * @param {AstronomicalEvent} relativeEvent
     * @returns {getTimesForCoordsCallback}
     */
    function getTimesForCoords (relativeEvent) {
      return function ({coords: {latitude, longitude}}) {
        const date = DateTime.now();
        let time;
        switch (relativeEvent) {
        case 'civilDawn': case 'civilDusk':
        case 'nauticalDawn': case 'nauticalDusk':
        case 'astronomicalDawn': case 'astronomicalDusk':
        case 'sunrise': case 'sunset':
          time = MeeusSunMoon[relativeEvent](date, latitude, longitude);
          break;
        case 'solarNoon':
          time = MeeusSunMoon[relativeEvent](date, longitude);
          break;
        default:
          break;
        }
        if (time < 0) {
          time = MeeusSunMoon[relativeEvent](
            DateTime.fromJSDate(incrementDate()),
            latitude,
            longitude
          );
        }
        time = time.valueOf();
        console.log('111', time, new Date(time));
        getRelative(time, relativeEvent);
      };
    }

    if (data.enabled) {
      clearWatch(name);
      const {relativeEvent} = data;
      switch (relativeEvent) {
      case 'now':
        getRelative(checkTime().time < 0 ? incrementDate() : null);
        break;
      default: // sunrise, etc.
        if ($('#geoloc-usage').value === 'never') { // when-available|always
          const coords = getCoords();
          if (!coords) {
            alert(
              _(
                'Per your settings, Geolocation is ' +
                'disallowed, and the manual coordinates are ' +
                'not formatted correctly, so the ' +
                'astronomical event cannot be determined ' +
                'at this time.'
              )
            );
            return;
          }
          getTimesForCoords(relativeEvent)(coords);
        } else {
          console.log('4444');
          watchers[name] = getGeoPositionWrapper(
            getTimesForCoords(relativeEvent),
            (($('#geoloc-usage').value === 'when-available')
              ? function () {
                const coords = getCoords();
                if (!coords) {
                  alert(
                    _(
                      'Geolocation is not currently ' +
                      'available, and the manual ' +
                      'coordinates are not formatted ' +
                      'correctly in your settings, so the ' +
                      'astronomical event cannot be ' +
                      'determined at this time.'
                    )
                  );
                  return;
                }
                getTimesForCoords(relativeEvent)(getCoords());
              }
              : null)
          );
        }
        break;
      }
    }
  }
  Object.entries(sundriven).forEach((nameData) => {
    updateListenerByName(nameData);
  });
}

/**
 * @param {Object<string,string|boolean>} settings
 * @returns {void}
 */
function createReminderForm (settings = {}) {
  if (formChanged) {
    const continueWithNewForm = confirm(
      _(
        'You have unsaved changes; are you sure you wish to ' +
                'continue and lose your unsaved changes?'
      )
    );
    if (!continueWithNewForm) {
      return;
    }
    formChanged = false;
  }
  removeChild('#table-container');
  const formID = 'set-reminder';
  Templates.reminderForm({
    formID,
    settings,
    sortOptions (options) {
      return options.sort((a, b) => {
        return a[2][0] > b[2][0];
      });
    },
    formChanged (e) {
      const {target} = e;
      if (target.id === 'name' && target.defaultValue !== '') {
        const renameReminder = confirm(
          _(
            'Are you sure you wish to rename this reminder? If you ' +
            'wish instead to create a new one, click "cancel" now ' +
            'and then click "save" when you are ready.'
          )
        );
        if (!renameReminder) {
          const data = serializeForm(formID, {}, {
            inputs: ['name', 'frequency', 'relativeEvent', 'minutes'],
            checkboxes: ['enabled'],
            radios: ['relativePosition']
          });
          // Temporarily indicate the changes are not changed
          formChanged = false;
          createReminderForm(data);
        }
      }
      formChanged = true;
    },
    saveReminder (e) {
      e.preventDefault();
      const data = serializeForm(formID, {}, {
        inputs: ['name', 'frequency', 'relativeEvent', 'minutes'],
        checkboxes: ['enabled'],
        radios: ['relativePosition']
      });
      // Firefox will ask for the user to fill out the required field
      if (!data.name) {
        // alert(_('ERROR: Please supply a name'));
        return;
      }

      getStorage('sundriven', storageGetterErrorWrapper((sundriven) => {
        if (
          // If this form was for creating new as opposed to editing old
          //   reminders
          !settings.name &&
                    sundriven[data.name]
        ) {
          alert(_('ERROR: Please supply a unique name'));
          return;
        }
        const originalName = $('#name').defaultValue;
        if (![$('#name').value, ''].includes(originalName)) {
          // If this is a rename, we warned the user earlier about it,
          //   so go ahead and delete now
          clearTimeout(listeners[originalName]);
          delete sundriven[originalName];
        }
        sundriven[data.name] = data;
        setStorage('sundriven', sundriven, storageSetterErrorWrapper(() => {
          formChanged = false;
          buildReminderTable();
          updateListeners(sundriven);
          alert(_('Saved!'));
        }));
      }));
    },
    deleteReminder (e) {
      e.preventDefault();
      const name = $('#name').value;
      if (!name) { // Required field will be used automatically
        // alert(_('Please supply a reminder name for deletion.'));
        return;
      }
      const okDelete = confirm(_(
        'Are you sure you wish to delete this reminder?'
      ));
      if (okDelete) {
        clearTimeout(listeners[name]);
        getStorage('sundriven', storageGetterErrorWrapper((sundriven) => {
          delete sundriven[name];
          setStorage('sundriven', sundriven, storageSetterErrorWrapper(() => {
            formChanged = false;
            buildReminderTable();
            createDefaultReminderForm();
            alert(_('Reminder deleted!'));
          }));
        }));
      }
    }
  });
}

/**
 *
 * @param {"granted"|"prompt"|"denied"} state
 * @returns {void}
 */
function toggleButton (state) {
  switch (state) {
  case 'granted':
    $('#grantPermission').hidden = true;
    break;
  case 'denied':
    $('#grantPermission').hidden = false;
    break;
  case 'prompt':
  default:
    $('#grantPermission').hidden = false;
    break;
  }
}
const result = await navigator.permissions.query({name: 'geolocation'});
result.addEventListener('change', () => {
  toggleButton(result.state);
});

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
    setStorage('sundriven-settings', data, storageSetterErrorWrapper());
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

getStorage('sundriven-settings', storageGetterErrorWrapper((settings) => {
  Object.entries(settings).forEach(([key, value]) => {
    $('#' + key).value = value;
  });
}));

window.addEventListener('beforeunload', (e) => {
  if (formChanged) {
    const msg = _(
      'You have unsaved changes; are you sure you wish to leave the page?'
    ); // Not utilized in Mozilla
    e.returnValue = msg;
    e.preventDefault();
    return msg;
  }
  return undefined;
});

buildReminderTable();
createDefaultReminderForm();
getStorage('sundriven', storageGetterErrorWrapper(updateListeners));
// install();
})();
