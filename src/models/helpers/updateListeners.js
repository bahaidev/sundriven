import {$} from '../../../vendor/jml-es.js';
import * as MeeusSunMoon from '../../../vendor/meeussunmoon.esm.js';
import {DateTime} from '../../../vendor/luxon.js';

import {setStorage} from '../../generic-utils/storage.js';
import {incrementDate} from '../../generic-utils/date.js';

import {storageSetterErrorWrapper} from './storageWrapper.js';
import getGeoPositionWrapper from './getGeoPositionWrapper.js';

const watchers = {};

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
 * Uses minutes and `relativePosition` (before/after) specified for a reminder
 * to add an offset to a supplied date (or the current time if none is
 * supplied) and subtracting the current time to find the time left to
 * expiry; also returns `date` which, if originally missing, will reflect
 * a new `Date` just begun.
 * @param {ListenerData} data
 * @param {Integer} [date]
 * @returns {{date: Date, time: Integer}}
 */
function getMillisecondsTillExpiry (data, date) {
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
 * @param {PlainObject} cfg
 * @param {Internationalizer} cfg._
 * @param {Locale} cfg.locale
 * @param {{builder: BuildReminderTable}} cfg.builder
 * @param {Listeners} cfg.listeners
 * @returns {UpdateListeners}
 */
function getUpdateListeners ({
  _,
  locale,
  builder,
  listeners
}) {
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
   * @type {UpdateListeners}
   */
  return function updateListeners (sundriven) {
    /**
     * @param {GenericArray} root0
     * @param {ListenerName} root0."0" The listener name
     * @param {ListenerData} root0."1" The listener data
     * @returns {void}
     */
    function updateListenerByName ([name, data]) {
      /**
       * @param {Integer|Date} date
       * @param {AstronomicalEvent} astronomicalEvent
       * @returns {void}
       */
      function getRelative (date, astronomicalEvent) {
        const dt = getMillisecondsTillExpiry(data, date);
        const {time} = dt;
        ({date} = dt); // Also may give us new date if none supplied.
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
                builder.buildReminderTable();
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
          const luxonDate = DateTime.now();
          let luxonTime;
          switch (relativeEvent) {
          case 'civilDawn': case 'civilDusk':
          case 'nauticalDawn': case 'nauticalDusk':
          case 'astronomicalDawn': case 'astronomicalDusk':
          case 'sunrise': case 'sunset':
            luxonTime = MeeusSunMoon[relativeEvent](
              luxonDate, latitude, longitude
            );
            break;
          case 'solarNoon':
            luxonTime = MeeusSunMoon[relativeEvent](luxonDate, longitude);
            break;
          default:
            break;
          }
          if (luxonTime < 0) {
            luxonTime = MeeusSunMoon[relativeEvent](
              DateTime.fromJSDate(incrementDate()),
              ...(relativeEvent === 'solarNoon'
                ? [longitude]
                : [
                  latitude,
                  longitude
                ])
            );
          }
          const timestamp = luxonTime.valueOf();
          console.log('111', timestamp, new Date(timestamp));
          getRelative(timestamp, relativeEvent);
        };
      }

      if (!data.enabled) {
        return;
      }
      clearWatch(name);
      const {relativeEvent} = data;
      switch (relativeEvent) {
      case 'now':
        getRelative(getMillisecondsTillExpiry(data).time < 0 ? incrementDate() : null);
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
            _,
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
    Object.entries(sundriven).forEach((nameData) => {
      updateListenerByName(nameData);
    });
  };
}

export {getUpdateListeners};
