import {$} from '../../../vendor/jml-es.js';
import * as MeeusSunMoon from '../../../vendor/meeussunmoon.esm.js';
import {DateTime} from '../../../vendor/luxon.js';

import {setStorage} from '../../generic-utils/storage.js';
import {incrementDate} from '../../generic-utils/date.js';

import {storageSetterErrorWrapper} from './storageWrapper.js';
import getGeoPositionWrapper from './getGeoPositionWrapper.js';

const watchers = {};

/**
 * Clears a watched geolocation observer. Not really in use at the moment
 * since we are n updating the timers based on geolocation changes.
 * @param {string} name
 * @returns {void}
 */
function clearWatch (name) {
  if (watchers[name]) {
    navigator.geolocation.clearWatch(watchers[name]);
  }
}

/**
 * Returns the latitude and longitude from the interface or `false`
 * if either value is non-numeric.
 * @returns {false|{coords: {latitude: string, longitude: string}}}
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
 * Returns the `updateListeners` function based on shared listeners and i18n.
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
   * Creates a Notification with the supplied body and vibrates where the
   * API is available.
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
   * Checks reminders to see if a notification should be called) for each
   * `sundriven` entry (obtained from form and set in storage).
   * @type {UpdateListeners}
   */
  return function updateListeners (sundriven) {
    /**
     * Check individual reminders to see if a notification should be called.
     * @param {GenericArray} root0
     * @param {ListenerName} root0."0" The listener name
     * @param {ListenerData} root0."1" The listener data
     * @returns {void}
     */
    function updateListenerByName ([name, data]) {
      /**
       * Sets a notification to execute on a timeout at the reminder's
       * approximate expiry time (relative to the current time and
       * supplied date).
       *
       * If the user's timer frequency is daily, the timed notification will
       * be set to execute, and if the event is not relative to "now", it
       * will recur.
       *
       * If the user's timer frequency is one-time, the timed notification
       * will be set to execute, and the `enabled` value for this timer set
       * to `false` (allowing the user to reuse if desired but not recurring
       * and requiring the user to delete the timer).
       *
       * @param {Integer|Date} date
       * @param {AstronomicalEvent} astronomicalEvent
       * @todo Daily "now" events should recur tomorrow if not already!
       * @todo Could add timer config as to whether to save the timer at all
       * if just a one-time one.
       * @returns {void}
       */
      function timedNotifyRelativeToDateAndReminder (date, astronomicalEvent) {
        const dt = getMillisecondsTillExpiry(data, date);
        const {time} = dt;
        ({date} = dt); // Also may give us new date if none supplied.
        clearTimeout(listeners[name]);
        let timeoutID;
        switch (data.frequency) {
        case 'daily':
          console.log('time', time);
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
       * Checks a single reminder of the relative-to-`now` variety.
       *
       * Increments the date if the expiry relative to the timer has already
       * passed and uses the current time otherwise.
       * @returns {void}
       */
      function handleNowTypeReminderCheck () {
        timedNotifyRelativeToDateAndReminder(
          getMillisecondsTillExpiry(data).time < 0 ? incrementDate() : null
        );
      }

      /**
       * Utility for `handleAstronomicalReminderCheck`.
       * @param {AstronomicalEvent} relativeEvent
       * @returns {getTimesForCoordsCallback}
       */
      function getTimesForCoords (relativeEvent) {
        /**
         * @type {getTimesForCoordsCallback}
         */
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
          timedNotifyRelativeToDateAndReminder(timestamp, relativeEvent);
        };
      }

      /**
       * If coordinates cannot be obtained due to being prohibited and no manual
       * ones have been entered, alert the user.
       *
       * Checks a single reminder of the astronomical variety.
       *
       * @returns {void}
       */
      function handleAstronomicalReminderCheck () {
        if ($('#geoloc-usage').value === 'never') { // when-available|always
          const coords = getCoords();
          if (!coords) {
            alert(_(
              'Per your settings, Geolocation is disallowed, and the ' +
              'manual coordinates are not formatted correctly, so the ' +
              'astronomical event cannot be determined at this time. Please ' +
              'either permit Geolocation or enter valid numeric coordinates ' +
              'manually.'
            ));
            return;
          }
          getTimesForCoords(relativeEvent)(coords);
          return;
        }
        console.log('4444');
        watchers[name] = getGeoPositionWrapper(
          _,
          getTimesForCoords(relativeEvent),
          (($('#geoloc-usage').value === 'when-available')
            ? function () {
              const coords = getCoords();
              if (!coords) {
                alert(_(
                  'Geolocation is not currently available, and the manual ' +
                  'coordinates are not formatted correctly in your ' +
                  'settings, so the astronomical event cannot be ' +
                  'determined at this time.'
                ));
                return;
              }
              getTimesForCoords(relativeEvent)(getCoords());
            }
            : null)
        );
      }

      // BEGIN `updateListenerByName` main code to check single timer

      if (!data.enabled) {
        return;
      }
      clearWatch(name);
      const {relativeEvent} = data;
      switch (relativeEvent) {
      case 'now':
        handleNowTypeReminderCheck();
        break;
      default: // sunrise, etc.
        handleAstronomicalReminderCheck();
        break;
      }
    }
    Object.entries(sundriven).forEach((nameData) => {
      updateListenerByName(nameData);
    });
  };
}

export {getUpdateListeners};
