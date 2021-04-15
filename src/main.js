import {$} from '../vendor/jml-es.js';

import {setLocale} from './generic-utils/i18n.js';
import {getStorage} from './generic-utils/storage.js';

import reminderTable from './models/reminderTable.js';
import reminderForm from './models/reminderForm.js';
import settings from './models/settings.js';

import setTemplates from './views/setTemplates.js';

import {getUpdateListeners} from './models/helpers/updateListeners.js';
import {storageGetterErrorWrapper} from './models/helpers/storageWrapper.js';
import toggleButton from './models/helpers/toggleButton.js';
// import install from './install.js';

/**
 * Keyed to timeout ID.
 * @typedef {Object<string,Integer>} Listeners
*/

const
  /**
   * @type {Listeners}
   */
  listeners = {},
  // For a circular dependency
  builder = {};

(async () => {
// SETUP
const {_, locale} = await setLocale();

const updateListeners = getUpdateListeners({_, locale, builder, listeners});
const Templates = setTemplates(_);
const {
  createReminderForm, createDefaultReminderForm
} = reminderForm({_, Templates, updateListeners, listeners, builder});
const buildReminderTable = reminderTable({
  _, Templates, createReminderForm, createDefaultReminderForm
});
// For circular dependencies
builder.buildReminderTable = buildReminderTable;

// BEGIN TEMPLATE BUILDING

Templates.document();
Templates.body();

const result = await navigator.permissions.query({name: 'geolocation'});
result.addEventListener('change', () => {
  toggleButton(result.state);
});

settings({_, Templates, result});

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
