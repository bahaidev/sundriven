/*globals createNotification, Notification */
/*jslint vars:true */
(function () { 'use strict';
document.title = "Sun Driven";

/*
Todos:
1. Interface to add (and store) reminders based on sunrise, sunset, dawn, or nothing, before or after; applicable date range or all; enabled or disabled
    1. Presets for Baha'i Fast, obligatory prayers, dawn prayers
1. Interface to edit previously added reminders
1. Set up listeners for previously set reminders (setTimeout which calls another setTimeout with recalced time?)
    1. Have notification indicate alarm time and current time
1. Optionally change close event (and message for it) to give optional prompt to snooze instead of just closing
*/
var closed = false;
function notify () {
    // show the notification
    var notification = new Notification('Reminder (Click inside me to stop)', { body: 'not yet implemented' }); // lang=string, body=string, tag=string, icon=url, dir (ltr|rtl|auto)
    notification.onclick = function(e) {
        closed = true;
    };
    notification.onshow = function(e) {
    };
    notification.onclose = function(e) {
        if (!closed) { // Only apparent way to keep it open
            notify();
        }
    };
    // And vibrate the device if it supports vibration API
    window.navigator.vibrate(500);
}
createNotification(notify);

// EXPORTS
// window. = ;
}());
