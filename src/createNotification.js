/**
 * @param key
 */
function _ (key) {
  // TODO: Move out to own locale file?
  return {
    'browser-not-support-notifications': 'This browser does not support notifications.',
    'click-allow-notifications': 'Click to allow notifications'
  }[key] || key;
}
/**
 * @param notify
 */
function createNotification (notify) {
  /**
   *
   */
  async function request () {
    const permission = await Notification.requestPermission();
    // Whatever the user answers, we make sure Chrome stores the information
    if (!Notification.permission) {
      Notification.permission = permission;
    }
    // If the user is okay, let's create a notification
    if (permission === 'granted') {
      // show the notification
      notify();
    }
  }
  // Check if the browser supports notifications
  if (!window.Notification) {
    alert(_('browser-not-support-notifications'));
    // Check if the user is okay to get some notification
  } else if (Notification.permission === 'granted') {
    // If it's okay, create a notification
    notify();
    // Otherwise, we need to ask the user for permission
    // Note, Chrome does not implement the permission static property
    // So we have to check for NOT 'denied' instead of 'default'
  } else if (Notification.permission !== 'denied') {
    const isOpera = Boolean(window.opera) || navigator.userAgent.includes(' OPR/');
    const isChrome = Boolean(window.chrome) && !isOpera;
    if (isChrome) {
      const div = document.createElement('div');
      div.className = 'overlay';
      div.append(_('click-allow-notifications')); // Satisfy Chrome's delusion that user gestures ensure the user retains the locus of control
      div.addEventListener('mouseover', () => {
        div.remove();
        request();
      });
      document.body.append(div);
    } else {
      request();
    }
  }
}

export default createNotification;
