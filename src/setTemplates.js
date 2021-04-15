import {jml, $, nbsp, body} from '../vendor/jml-es.js';

const Templates = (_) => ({
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
          'Click on the relevant row of the table to create/edit a reminder above:'
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
              enabled ? 'x' : ''
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
  }
});

export default Templates;
