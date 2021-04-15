import * as MeeusSunMoon from '../vendor/meeussunmoon.esm.js';
import {DateTime} from '../vendor/luxon.js';
import {jml, $, nbsp} from '../vendor/jml-es.js';
import {removeElement, removeChild} from './dom.js';

import {_, setLocale} from './i18n.js';
import {getStorage, setStorage} from './storage.js';
import Templates from './templates.js';
// import install from './install.js';

(async () => {
const locale = await setLocale();

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
 * @param formID
 * @param targetObj
 * @param controls
 * @todo Use `FormData`?
 * @todo If no controls array is present, we could just iterate over all form controls
 */
function serializeForm (formID, targetObj, controls) {
  // Selects, text/numeric inputs
  if (controls.inputs) {
    controls.inputs.forEach((setting) => {
      targetObj[setting] = $('#' + setting).value;
    });
  }
  // Checkboxes
  if (controls.checkboxes) {
    controls.checkboxes.forEach((setting) => {
      targetObj[setting] = $('#' + setting).checked;
    });
  }
  // Radio buttons
  if (controls.radios) {
    controls.radios.forEach((setting) => {
      targetObj[setting] = [...$('#' + formID)[setting]].find((radio) => {
        return radio.checked;
      }).id;
    });
  }
  return targetObj;
}

/**
 * @param cb
 * @param errBack
 * @throws {Error}
 */
function getGeoPositionWrapper (cb, errBack) {
  if (!navigator.geolocation) {
    alert(_('Your browser does not support or does not have Geolocation enabled'));
    throw new Error('Discontinue');
  }
  // We could instead use getCurrentPosition, but that wouldn't update with the user's location
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
 * @param name
 * @param _body
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
 * @param cb
 */
function storageSetterErrorWrapper (cb) {
  return (val) => {
    if (!val) {
      alert(
        _('ERROR: Problem setting storage; refreshing page to try to resolve...')
      );
      window.location.reload();
      return;
    }
    if (cb) {
      cb(val);
    }
  };
}

/**
 * @param cb
 */
function storageGetterErrorWrapper (cb) {
  return (data) => {
    if (data === null) {
      setStorage('sundriven', {}, storageSetterErrorWrapper(cb));
      // This would loop (and data will be null on first run)
      // alert(_('ERROR: Problem retrieving storage; refreshing page to try to resolve...'));
      // window.location.reload();
    } else {
      cb(data);
    }
  };
}
/**
 *
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
 *
 */
function buildReminderTable () {
  getStorage('sundriven', storageGetterErrorWrapper((forms) => {
    removeElement('#forms');
    jml('table', {id: 'forms'}, [
      ['tbody', {class: 'ui-widget-header'}, [
        ['tr', [
          ['th', [_('Name')]],
          ['th', [_('Enabled')]]
        ]]
      ]],
      ['tbody', {class: 'ui-widget-content'}, [
        ['tr', [
          ['td', {colspan: 2, class: 'focus', $on: {
            click: createDefaultReminderForm
          }}, [_('(Create new reminder)')]]
        ]],
        ...Object.keys(forms).sort().map((formKey) => {
          const form = forms[formKey];
          return ['tr', {
            dataset: {name: form.name},
            $on: {
              click () {
                const {name} = this.dataset;
                getStorage('sundriven', storageGetterErrorWrapper((_forms) => {
                  createReminderForm(_forms[name]);
                }));
              }
            }
          }, [
            ['td', [form.name]],
            ['td', {class: 'focus'}, [
              form.enabled ? 'x' : ''
            ]]
          ]];
        })
      ]]
    ], $('#forms-container'));
  }));
}

/**
 * @param name
 */
function clearWatch (name) {
  if (watchers[name]) {
    navigator.geolocation.clearWatch(watchers[name]);
  }
}

/**
 * @param date
 */
function incrementDate (date) {
  if (!date) {
    date = new Date();
  }
  date.setDate(date.getDate() + 1);
  return date;
}

/**
 *
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
 * @param sundriven
 */
function updateListeners (sundriven) {
  /**
   * @param root0
   * @param root0."0"
   * @param root0."1"
   */
  function updateListenerByName ([name, data]) {
    /**
     * @param date
     */
    function checkTime (date) {
      let minutes = Number.parseFloat(data.minutes);
      minutes = data.relativePosition === 'before' ? -minutes : minutes; // after|before
      const startTime = Date.now();
      // eslint-disable-next-line no-console -- Debugging
      console.log('date', date);
      date = date && typeof date !== 'number' ? date : new Date(startTime);
      return {date, time: (date.getTime() - startTime) + minutes * 60 * 1000};
    }
    /**
     * @param date
     * @param astronomicalEvent
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
     * @param relativeEvent
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
 * @param settings
 */
function createReminderForm (settings = {}) {
  /**
   * @param groupName
   * @param radios
   * @param selected
   */
  function radioGroup (groupName, radios, selected) {
    return ['span', radios.map(({id, label}) => {
      return ['label', [
        ['input', {
          type: 'radio',
          name: groupName,
          id,
          // For some reason, we can't set this successfully on a
          //   jml() DOM object below, so we do it here
          checked: id === selected
        }],
        label
      ]];
    })];
  }
  /**
   * @param id
   * @param options
   */
  function select (id, options) {
    return jml('select', {
      id,
      value: settings[id] || ''
    }, options, null);
  }
  /**
   * @param id
   */
  function checkbox (id) {
    return ['input', {
      id,
      type: 'checkbox',
      checked: settings[id]
    }];
  }

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
  jml('form', {id: formID, $on: {change (e) {
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
        formChanged = false; // Temporarily indicate the changes are not changed
        createReminderForm(data);
      }
    }
    formChanged = true;
  }}}, [['fieldset', [
    ['legend', [_('Set Reminder')]],
    ['label', [
      _('Name') + ' ',
      ['input', {
        id: 'name',
        required: true,
        defaultValue: settings.name || '',
        value: settings.name || ''
      }]
    ]],
    ['label', [
      checkbox('enabled'),
      _('Enabled')
    ]],
    ['br'],
    ['label', [
      _('Frequency') + ' ',
      select('frequency', [
        ['option', {value: 'daily'}, [_('Daily')]],
        ['option', {value: 'one-time'}, [_('One-time')]]
      ])
    ]],
    ['br'],
    ['label', [
      _('Relative to') + ' ',
      select('relativeEvent', [
        ['option', {value: 'now'}, [_('now')]],
        // Others not included within MeeusSunMoon
        ...([
          'sunrise', 'sunset',
          'solarNoon',
          'civilDawn', 'civilDusk',
          'nauticalDawn', 'nauticalDusk',
          'astronomicalDawn', 'astronomicalDusk'
          /*
          // Not present in MSM: https://github.com/janrg/MeeusSunMoon/issues/3
          'nadir', 'sunriseEnd', 'sunsetStart',
          'goldenHourEnd', 'goldenHour'
          */
        ].map((eventType) => {
          return ['option', {value: eventType}, [_(eventType)]];
        }).sort((a, b) => {
          return a[2][0] > b[2][0];
        }))
      ])
    ]],
    nbsp.repeat(2),
    ['label', [
      ['input', {id: 'minutes', type: 'number', step: 1, value: settings.minutes}],
      ' ' + _('Minutes')
    ]],
    ['br'],
    radioGroup('relativePosition', [
      {label: _('after'), id: 'after'},
      {label: _('before'), id: 'before'}
    ], settings.relativePosition),
    ['br'],
    ['button', {$on: {click (e) {
      e.preventDefault();
      const data = serializeForm(formID, {}, {
        inputs: ['name', 'frequency', 'relativeEvent', 'minutes'],
        checkboxes: ['enabled'],
        radios: ['relativePosition']
      });
      if (!data.name) { // Firefox will ask for the user to fill out the required field
        // alert(_('ERROR: Please supply a name'));
        return;
      }

      getStorage('sundriven', storageGetterErrorWrapper((sundriven) => {
        if (
        // If this form was for creating new as opposed to editing old reminders
          !settings.name &&
                    sundriven[data.name]
        ) {
          alert(_('ERROR: Please supply a unique name'));
          return;
        }
        const originalName = $('#name').defaultValue;
        if (![$('#name').value, ''].includes(originalName)) {
          // If this is a rename, we warned the user earlier about it, so go ahead and delete now
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
    }}}, [_('Save')]],
    ['button', {class: 'delete', $on: {click (e) {
      e.preventDefault();
      const name = $('#name').value;
      if (!name) { // Required field will be used automatically
        // alert(_('Please supply a reminder name for deletion.'));
        return;
      }
      const okDelete = confirm(_('Are you sure you wish to delete this reminder?'));
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
    }}}, [_('Delete')]]
  ]]], $('#table-container'));
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

jml('div', [
  ['button', {$on: {click () {
    $('#settings-holder').hidden = !$('#settings-holder').hidden;
  }}}, [_('Settings')]],
  ' ',
  ['button', {
    id: 'grantPermission',
    hidden: result.state === 'granted',
    $on: {
      async click () {
        const status = await Notification.requestPermission();
        if (status === 'denied') {
          alert(_('You will not be able to use the app until permitting this!'));
        } else if (status === 'granted') {
          alert(_('Permission granted; you may now set timers.'));
        }
      }
    }
  }, [
    _('click_allow_notifications')
  ]],
  ['div', {id: 'settings-holder', hidden: true}, [
    ['form', {id: 'settings', $on: {change () {
      const data = serializeForm('settings', {}, {
        inputs: ['geoloc-usage', 'latitude', 'longitude']
      });
      setStorage('sundriven-settings', data, storageSetterErrorWrapper());
    }}}, [
      ['fieldset', [
        ['select', {id: 'geoloc-usage'}, [
          ['option', {
            value: 'when-available',
            title: _(
              'Fall back to the coordinates below when ' +
                            'offline or upon Geolocation errors'
            )
          }, [_('Use Geolocation when available')]],
          ['option', {
            value: 'never',
            title: _(
              'Avoids a trip to the server but may not be ' +
              'accurate if you are traveling out of the ' +
              'area with your device.'
            )
          }, [_('Never use Geolocation; always use manual coordinates.')]],
          ['option', {
            value: 'always',
            title: _(
              'Will report errors instead of falling back ' +
              '(not recommended)'
            )
          }, [_('Always use Geolocation; do not fall back to manual coordinates')]]
        ]],
        ['fieldset', {
          title: _(
            'Use these coordinates for astronomical ' +
            'event-based reminders when offline or upon errors'
          )
        }, [
          ['legend', [_('Manual coordinates')]],
          ['label', [
            _('Latitude') + ' ',
            ['input', {id: 'latitude', size: 20}]
          ]],
          ['br'],
          ['label', [
            _('Longitude') + ' ',
            ['input', {id: 'longitude', size: 20}]
          ]],
          ['br'],
          ['button', {
            title: 'Retrieve coordinates now using Geolocation ' +
                    'for potential later use when offline or upon ' +
                    'errors (depends on the selected pull-down ' +
                    'option).',
            $on: {
              click (e) {
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
              }
            }
          }, [
            _('Retrieve coordinates for manual storage')
          ]],
          nbsp,
          ['span', {id: 'retrieving', hidden: true}, [_('Retrieving...')]]
        ]]
      ]]
    ]]
  ]],
  ['br']
], $('#settings-container'));

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
