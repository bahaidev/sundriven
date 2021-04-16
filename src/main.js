import {setLocale} from './generic-utils/i18n.js';
import {getStorage} from './generic-utils/storage.js';

import reminderTable from './models/reminderTable.js';
import reminderForm from './models/reminderForm.js';
import settings from './models/settings.js';

import setTemplates from './views/setTemplates.js';

import {getUpdateListeners} from './models/helpers/updateListeners.js';
import {storageGetterErrorWrapper} from './models/helpers/storageWrapper.js';
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
//
// 1. SETUP (SHARED STATE)
//
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

//
// 2. BEGIN TEMPLATE BUILDING
//

Templates.document();
Templates.body();

await settings({_, Templates, getStorage, storageGetterErrorWrapper});

buildReminderTable();
createDefaultReminderForm();

// Set up listeners based on existing timers
getStorage('sundriven', storageGetterErrorWrapper(_, updateListeners));
// install();
})();
