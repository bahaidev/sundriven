import {$} from '../../vendor/jml-es.js';

/**
 * @param {string} elemSel
 * @returns {void}
 */
function removeElement (elemSel) {
  if ($(elemSel)) {
    $(elemSel).remove();
  }
}
/**
 * @param {string} childSel
 * @returns {void}
 */
function removeChild (childSel) {
  if ($(childSel).firstElementChild) {
    $(childSel).firstElementChild.remove();
  }
}

export {removeElement, removeChild};
