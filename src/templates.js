import {jml, body} from '../vendor/jml-es.js';

import {_} from './generic-utils/i18n.js';

const Templates = {
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
  }
};

export default Templates;
