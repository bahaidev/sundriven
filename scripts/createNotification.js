/*globals Notification*/
/*jslint vars:true*/
(function () { 'use strict';

function createNotification(notify) {
    function request(notify) {
        Notification.requestPermission(function (permission) {
            // Whatever the user answers, we make sure Chrome stores the information
            if (!Notification.permission) {
                Notification.permission = permission;
            }
            // If the user is okay, let's create a notification
            if (permission === 'granted') {
                // show the notification
                notify();
            }
        });
    }
    // Check if the browser supports notifications
    if (!window.Notification) {
        alert("This browser does not support notifications.");
    }
    // Check if the user is okay to get some notification
    else if (Notification.permission === 'granted') {
        // If it's okay, create a notification
        notify();
    }
    // Otherwise, we need to ask the user for permission
    // Note, Chrome does not implement the permission static property
    // So we have to check for NOT 'denied' instead of 'default'
    else if (Notification.permission !== 'denied') {
        var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        var isChrome = !!window.chrome && !isOpera;
        if (isChrome) {
            var div = document.createElement('div');
            div.className = 'overlay';
            div.appendChild(document.createTextNode("Click to allow notifications")); // Satisfy Chrome's delusion that user gestures ensure the user retains the locus of control
            div.addEventListener('mouseover', function () {
                div.parentNode.removeChild(div);
                request(notify);
            });
            document.body.appendChild(div);
        }
        else {
            request(notify);
        }
    }
}

// EXPORTS
window.createNotification = createNotification;
}());
