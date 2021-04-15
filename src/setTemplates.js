import {jml, $, body} from '../vendor/jml-es.js';

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
  }
});

export default Templates;
