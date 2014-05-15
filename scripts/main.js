/*globals createNotification, Notification */
/*jslint vars:true */
(function () { 'use strict';
document.title = "Sun Driven";
var body = document.body;

// Copied from internals of suncalc.js : https://github.com/mourner/suncalc/issues/17
var times = [
    [-0.83, 'sunrise',       'sunset'      ],
    [ -0.3, 'sunriseEnd',    'sunsetStart' ],
    [   -6, 'dawn',          'dusk'        ],
    [  -12, 'nauticalDawn',  'nauticalDusk'],
    [  -18, 'nightEnd',      'night'       ],
    [    6, 'goldenHourEnd', 'goldenHour'  ]
];

function _ (s) {
    return {
        en: {}
    }[s] || s;
}

jml('fieldset', [
    ['legend', [_("Set Reminder")]],
    ['select', [
        ['option', [_("Daily")]],
        ['option', [_("One-time")]]
    ]],
    ['br'],
    ['label', [
        _("Relative to") + ' ',
        ['select', times.reduce(function (arr, time) {
            arr.push(
                ['option', {value: time[1]}, [_(time[1])]],
                ['option', {value: time[2]}, [_(time[2])]]
            );
            return arr;
        }, [['option', {value: 'now'}, [_("now")]]])]
    ]],
    '\u00a0 ',
    ['label', [
        ['input', {type: 'number', step: 1, value: 60}],
        _("Minutes")
    ]],
    '\u00a0 ',
    ['label', [
        _("after"),
        ['input', {type:'radio', name:'before-after', checked: 'checked'}]
    ]],
    ['label', [
        _("before"),
        ['input', {type:'radio', name:'before-after'}]
    ]]
], body);

/*
Todos:
1. Interface to add (and store) reminders based on sunrise, sunset, dawn, or nothing, before or after; applicable date range or all; enabled or disabled
    1. Presets for Baha'i Fast, obligatory prayers, dawn prayers (though configurable in relative minutes after or before)
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
