import {$} from '../../vendor/jml-es.js';

import {removeChild} from '../generic-utils/dom.js';
import {getStorage, setStorage} from '../generic-utils/storage.js';
import {serializeForm} from '../generic-utils/forms.js';

import {
  storageGetterErrorWrapper, storageSetterErrorWrapper
} from './helpers/storageWrapper.js';

let formChanged = false;

/**
* @typedef {Object<string,string|boolean>} Settings
*/

/**
 * @callback ReminderFormCreator
 * @param {Settings} settings
 * @returns {void}
 */

/**
 * @param {PlainObject} cfg
 * @param {Internationalizer} cfg._
 * @param {TemplatesObject} cfg.Templates
 * @param {UpdateListeners} cfg.updateListeners
 * @param {Listeners} cfg.listeners
 * @param {{buildReminderTable: BuildReminderTable}} cfg.builder
 * @returns {ReminderFormCreator}
 */
function reminderForm ({
  _, Templates, updateListeners, listeners, builder
}) {
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

  /**
   * @callback CreateReminderForm
   * @param {Settings} [settings={}]
   * @returns {void}
   */

  /**
   * @type {CreateReminderForm}
   */
  function createReminderForm (settings = {}) {
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
    Templates.reminderForm({
      formID,
      settings,
      sortOptions (options) {
        return options.sort((a, b) => {
          return a[2][0] > b[2][0];
        });
      },
      formChanged (e) {
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
            // Temporarily indicate the changes are not changed
            formChanged = false;
            createReminderForm(data);
          }
        }
        formChanged = true;
      },
      saveReminder (e) {
        e.preventDefault();
        const data = serializeForm(formID, {}, {
          inputs: ['name', 'frequency', 'relativeEvent', 'minutes'],
          checkboxes: ['enabled'],
          radios: ['relativePosition']
        });
        // Firefox will ask for the user to fill out the required field
        if (!data.name) {
          // alert(_('ERROR: Please supply a name'));
          return;
        }

        getStorage('sundriven', storageGetterErrorWrapper(_, (sundriven) => {
          if (
            // If this form was for creating new as opposed to editing old
            //   reminders
            !settings.name &&
                      sundriven[data.name]
          ) {
            alert(_('ERROR: Please supply a unique name'));
            return;
          }
          const originalName = $('#name').defaultValue;
          if (![$('#name').value, ''].includes(originalName)) {
            // If this is a rename, we warned the user earlier about it,
            //   so go ahead and delete now
            clearTimeout(listeners[originalName]);
            delete sundriven[originalName];
          }
          sundriven[data.name] = data;
          setStorage(
            'sundriven', sundriven, storageSetterErrorWrapper(_, () => {
              formChanged = false;
              builder.buildReminderTable();
              updateListeners(sundriven);
              alert(_('Saved!'));
            })
          );
        }));
      },
      deleteReminder (e) {
        e.preventDefault();
        const name = $('#name').value;
        if (!name) { // Required field will be used automatically
          // alert(_('Please supply a reminder name for deletion.'));
          return;
        }
        const okDelete = confirm(_(
          'Are you sure you wish to delete this reminder?'
        ));
        if (okDelete) {
          clearTimeout(listeners[name]);
          getStorage('sundriven', storageGetterErrorWrapper(_, (sundriven) => {
            delete sundriven[name];
            setStorage(
              'sundriven', sundriven, storageSetterErrorWrapper(_, () => {
                formChanged = false;
                builder.buildReminderTable();
                createDefaultReminderForm();
                alert(_('Reminder deleted!'));
              })
            );
          }));
        }
      }
    });
  }

  /**
   * @callback CreateDefaultReminderForm
   * @returns {void}
   */

  /**
   * @type {CreateDefaultReminderForm}
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
   * @type {{
   * createReminderForm: CreateReminderForm,
   * createDefaultReminderForm: CreateDefaultReminderForm
   * }}
   */
  return {
    createReminderForm,
    createDefaultReminderForm
  };
}

export default reminderForm;
