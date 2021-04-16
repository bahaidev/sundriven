import {$} from '../../../vendor/jml-es.js';

/**
 *
 * @param {"granted"|"prompt"|"denied"} state
 * @returns {void}
 */
function toggleGrantPermissionButton (state) {
  switch (state) {
  case 'granted':
    $('#grantPermission').hidden = true;
    break;
  case 'denied':
    $('#grantPermission').hidden = false;
    break;
  case 'prompt':
  default:
    $('#grantPermission').hidden = false;
    break;
  }
}

export default toggleGrantPermissionButton;
