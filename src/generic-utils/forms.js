import {$} from '../../vendor/jml-es.js';

/**
* @typedef {Object<string,string|boolean>} TargetObject
*/

/**
 * @param {string} formID
 * @param {TargetObject} targetObj
 * @param {{inputs: string[], checkboxes: string[], radios: string[]}} controls
 * @returns {TargetObject}
 * @todo Use `FormData`?
 * @todo If no controls array is present, we could just iterate over
 * all form controls
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

export {serializeForm};
