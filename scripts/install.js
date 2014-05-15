/*jslint vars:true*/
(function () { 'use strict';

// get a reference to the install button
var manifest_url;
var apps = navigator.mozApps;
var button = document.getElementById('install');

function install(ev) {
    ev.preventDefault();
    // install the app
    var installLocFind = apps.install(manifest_url);
    installLocFind.onsuccess = function (data) {
        // App is installed, do something if you like
    };
    installLocFind.onerror = function() {
        // App wasn't installed, info is in
        // installapp.error.name
        alert(installLocFind.error.name);
    };
}

// if browser has support for installable apps, run the install code; if not, hide the install button
if (apps) {
        // define the manifest URL
        manifest_url = location.href + 'manifest.webapp';
        
        // if app is already installed, hide button. If not, add event listener to call install() on click
        try {
            var installCheck = apps.checkInstalled(manifest_url);
            installCheck.onsuccess = function () {
                if (installCheck.result) {
                    button.style.display = 'none';
                }
                else {
                    button.addEventListener('click', install, false);
                }
            };
        }
        catch (e) {
            alert("Error: " + e);
        }
}
else {
    button.style.display = 'none';
}

}());
