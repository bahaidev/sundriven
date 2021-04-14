// get a reference to the install button
let manifestURL;
const apps = navigator.mozApps;

/**
 *
 */
function install () {
  const button = document.getElementById('install');

  /**
   * @param ev
   */
  function _install (ev) {
    ev.preventDefault();
    // install the app
    const installLocFind = apps.install(manifestURL);
    installLocFind.onsuccess = function (data) {
      // App is installed, do something if you like
    };
    installLocFind.addEventListener('error', function () {
      // App wasn't installed, info is in
      // installapp.error.name
      alert(installLocFind.error.name);
    });
  }

  // if browser has support for installable apps, run the install code; if not, hide the install button
  if (apps) {
    // define the manifest URL
    manifestURL = location.href + 'manifest.webapp';

    // if app is already installed, hide button. If not, add event listener to call install() on click
    try {
      const installCheck = apps.checkInstalled(manifestURL);
      installCheck.onsuccess = function () {
        if (installCheck.result) {
          button.style.display = 'none';
        } else {
          button.addEventListener('click', _install);
        }
      };
    } catch (e) {
      alert('Error: ' + e);
    }
  } else {
    button.style.display = 'none';
  }
}

export default install;
