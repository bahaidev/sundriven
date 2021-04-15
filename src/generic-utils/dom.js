import {$} from '../../vendor/jml-es.js';

/**
 * @param elemSel
 */
function removeElement (elemSel) {
  if ($(elemSel)) {
    $(elemSel).remove();
  }
}
/**
 * @param childSel
 */
function removeChild (childSel) {
  if ($(childSel).firstElementChild) {
    $(childSel).firstElementChild.remove();
  }
}

export {removeElement, removeChild};
