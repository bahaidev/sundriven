import {jml, $, nbsp, body} from '../../vendor/jml-es.js';

/**
* @external JamilihArray
*/

/**
* @external JamilihAttributes
*/

/**
 * @param {string} groupName
 * @param {{id: string, label: string}} radios
 * @param {string} selected
 * @returns {external:JamilihArray}
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
 * @callback TemplateFunction
 * @param {...any} any
 * @returns {void}
 */

/**
* @typedef {Object<string,TemplateFunction>} TemplatesObject
*/

/**
 * @function
 * @param {Internationalizer} _
 * @returns {TemplatesObject}
 */
const setTemplates = (_) => ({
  document () {
    document.title = _('Sun Driven');
  },
  body () {
    jml(body, {class: 'ui-widget'}, [
      /* ['button', {id: 'install'}, [
            'Install app on device'
        ]], */
      ['br'],
      ['div', {id: 'settings-container'}],
      ['br'],
      ['div', {id: 'table-container'}],
      ['p', [
        _(
          'Click on the relevant row of the table to ' +
          'create/edit a reminder above:'
        )
      ]],
      ['div', {id: 'forms-container'}]
    ]);
  },
  reminderTable ({
    createDefaultReminderForm, createReminder, sortedForms
  }) {
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
        ...sortedForms.map(({name, enabled}) => {
          return ['tr', {
            dataset: {name},
            $on: {
              click: createReminder
            }
          }, [
            ['td', [name]],
            ['td', {class: 'focus'}, [
              enabled ? '✓' : ''
            ]]
          ]];
        })
      ]]
    ], $('#forms-container'));
  },
  settings ({
    grantPermissionHidden, retrieveCoordinates,
    setSettings, allowNotifications
  }) {
    jml('div', [
      ['button', {$on: {click () {
        $('#settings-holder').hidden = !$('#settings-holder').hidden;
      }}}, [_('Settings')]],
      ' ',
      ['button', {
        id: 'grantPermission',
        hidden: grantPermissionHidden,
        $on: {
          click: allowNotifications
        }
      }, [
        _('click_allow_notifications')
      ]],
      ['div', {id: 'settings-holder', hidden: true}, [
        ['form', {id: 'settings', $on: {
          change: setSettings
        }}, [
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
              }, [_(
                'Always use Geolocation; do not fall back ' +
                'to manual coordinates'
              )]]
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
                  click: retrieveCoordinates
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
  },
  reminderForm ({
    formID, settings, sortOptions, formChanged, saveReminder, deleteReminder
  }) {
    /**
     * @param {string} id
     * @param {JamilihAttributes} options
     * @returns {Element}
     */
    function select (id, options) {
      return jml('select', {
        id,
        value: settings[id] || '',
        defaultValue: settings[id] || ''
      }, options.map((opt) => {
        // Neither the `value` or `defaultValue` setting above
        //  is working, so select here
        if (opt[1].value === settings[id]) {
          opt[1].selected = true;
        }
        return opt;
      }), null);
    }
    /**
     * @param {string} id
     * @returns {external:JamilihArray}
     */
    function checkbox (id) {
      return ['input', {
        id,
        type: 'checkbox',
        checked: settings[id]
      }];
    }

    jml('form', {id: formID, $on: {
      change: formChanged
    }}, [['fieldset', [
      ['legend', [_('Set Reminder')]],
      ['label', [
        _('Name') + ' ',
        ['input', {
          id: 'name',
          required: true,
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
          ...(sortOptions([
            'sunrise', 'sunset',
            'solarNoon',
            'civilDawn', 'civilDusk',
            'nauticalDawn', 'nauticalDusk',
            'astronomicalDawn', 'astronomicalDusk'
            /*
            // Not present in MeeusSunMoon:
            // https://github.com/janrg/MeeusSunMoon/issues/3
            'nadir', 'sunriseEnd', 'sunsetStart',
            'goldenHourEnd', 'goldenHour'
            */
          ].map((eventType) => {
            return ['option', {value: eventType}, [_(eventType)]];
          })))
        ])
      ]],
      nbsp.repeat(2),
      ['label', [
        ['input', {
          id: 'minutes', type: 'number', step: 1,
          value: settings.minutes
        }],
        ' ' + _('Minutes')
      ]],
      ['br'],
      radioGroup('relativePosition', [
        {label: _('after'), id: 'after'},
        {label: _('before'), id: 'before'}
      ], settings.relativePosition),
      ['br'],
      ['button', {
        $on: {
          click: saveReminder
        }}, [
        _('Save')
      ]],
      ['button', {
        class: 'delete',
        $on: {
          click: deleteReminder
        }
      }, [_('Delete')]]
    ]]], $('#table-container'));
  }
});

export default setTemplates;
