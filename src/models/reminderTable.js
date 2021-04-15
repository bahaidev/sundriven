import {removeElement} from '../generic-utils/dom.js';
import {getStorage} from '../generic-utils/storage.js';

import {storageGetterErrorWrapper} from './helpers/storageWrapper.js';

/**
 * @callback BuildReminderTable
 * @returns {void}
 */

/**
 * @param {PlainObject} cfg
 * @param {Internationalizer} cfg._
 * @param {TemplatesObject} cfg.Templates
 * @param {ReminderFormCreator} cfg.createReminderForm
 * @param {CreateDefaultReminderForm} cfg.createDefaultReminderForm
 * @returns {BuildReminderTable}
 */
function reminderTable ({
  _, Templates, createReminderForm, createDefaultReminderForm
}) {
  /**
   * @type {BuildReminderTable}
   */
  return function buildReminderTable () {
    /**
     * @returns {void}
     */
    function createReminder () {
      const {name} = this.dataset;
      getStorage('sundriven', storageGetterErrorWrapper(_, (_forms) => {
        createReminderForm(_forms[name]);
      }));
    }
    getStorage('sundriven', storageGetterErrorWrapper(_, (forms) => {
      removeElement('#forms');
      const sortedForms = Object.keys(forms).sort().map((formKey) => {
        return forms[formKey];
      });
      Templates.reminderTable({
        createDefaultReminderForm, createReminder, sortedForms
      });
    }));
  };
}

export default reminderTable;
