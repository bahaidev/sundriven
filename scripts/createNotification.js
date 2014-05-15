/*globals Notification*/
(function () { 'use strict';

function createNotification(notify) {
    // Let's check if the browser supports notifications
    if (!window.Notification) {
        alert("This browser does not support notifications.");
    }
    // Let's check if the user is okay to get some notification
    else if (Notification.permission === 'granted') {
        // If it's okay let's create a notification
        notify();
    }
    // Otherwise, we need to ask the user for permission
    // Note, Chrome does not implement the permission static property
    // So we have to check for NOT 'denied' instead of 'default'
    else if (Notification.permission !== 'denied') {
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
}

// EXPORTS
window.createNotification = createNotification;
}());
