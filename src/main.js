import * as MeeusSunMoon from '../vendor/meeussunmoon.esm.js';
import {DateTime} from '../vendor/luxon.js';
import {$} from '../vendor/jml-es.js';

import {setLocale} from './generic-utils/i18n.js';
import {getStorage, setStorage} from './generic-utils/storage.js';
import {incrementDate} from './generic-utils/date.js';

import reminderTable from './models/reminderTable.js';
import reminderForm from './models/reminderForm.js';
import settings from './models/settings.js';

import setTemplates from './views/setTemplates.js';
import {
  storageGetterErrorWrapper, storageSetterErrorWrapper
} from './models/helpers/storageWrapper.js';
// import install from './install.js';

(async () => {
const {_, locale} = await setLocale();

const Templates = setTemplates(_);

Templates.document();
Templates.body();

/**
 * Keyed to timeout ID.
 * @typedef {Object<string,Integer>} Listeners
*/

const
  /**
   * @type {Listeners}
   */
  listeners = {},
  watchers = {},
  // For a circular dependency
  builder = {};

const {
  createReminderForm, createDefaultReminderForm
} = reminderForm({_, Templates, updateListeners, listeners, builder});
const buildReminderTable = reminderTable({
  _, Templates, createReminderForm, createDefaultReminderForm
});
builder.buildReminderTable = buildReminderTable;

/*
function s (obj) {
    alert(JSON.stringify(obj));
}
*/

/**
 * @callback GeoPositionWrapperGetter
 * @param {GeolocationPosition} cb
 * @param {GeolocationPositionError} errBack
 * @throws {Error}
 * @returns {void} (Could change in the future if switch to `watchPosition`)
 */

/**
 * @type {GeoPositionWrapperGetter}
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
 * @callback UpdateListeners
 * @param {Object<ListenerName,ListenerData>} sundriven
 * @returns {void}
 */

/**
 * @type {UpdateListeners}
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
          setStorage(
            'sundriven', sundriven, storageSetterErrorWrapper(_, () => {
              if ($('#name').value === name) {
                $('#enabled').checked = false;
              }
              buildReminderTable();
            })
          );
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

settings({_, Templates, result, getGeoPositionWrapper});

getStorage('sundriven-settings', storageGetterErrorWrapper(_, (_settings) => {
  Object.entries(_settings).forEach(([key, value]) => {
    $('#' + key).value = value;
  });
}));

buildReminderTable();
createDefaultReminderForm();
getStorage('sundriven', storageGetterErrorWrapper(_, updateListeners));
// install();
})();
