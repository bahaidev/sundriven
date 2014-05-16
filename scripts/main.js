/*globals SunCalc, jml, localforage, createNotification, Notification */
/*jslint vars:true */
(function () { 'use strict';

var locale;
var body = document.body;
var times = SunCalc.times;

function s (obj) {
    alert(JSON.stringify(obj));
}
function $ (sel) {
    return document.querySelector(sel);
}
function setLocale () {
    var loc = window.location.href;
    var frag = '#lang=';
    var langInURLPos = loc.indexOf(frag);
    var langInURL = (langInURLPos > -1) ? loc.slice(langInURLPos + frag.length) : false;
    locale = langInURL || navigator.language || 'en-US';
    document.documentElement.lang = locale;
}
function _ (s) {
    var messages = {
        "en-US": {}
    };
    return (messages[locale] || messages['en-US'])[s] || s;
}
function removeElement (elemSel) {
    if ($(elemSel)) {
        $(elemSel).parentNode.removeChild($(elemSel));
    }
}
function removeChild (childSel) {
    if ($(childSel).firstElementChild) {
        $(childSel).removeChild($(childSel).firstElementChild);
    }
}

function createReminderForm (settings) {
    settings = settings || {};
    function radioGroup (groupName, radios, selected) {
        return ['span', radios.reduce(function (arr, radio) {
            var radioObj = {type:'radio', name: groupName, id: radio.id};
            if (radio.id === selected) {
                radioObj.checked = true; // For some reason, we can't set this successfully on a jml() DOM object below, so we do it here
            }
            var rad = ['label', [
                ['input', radioObj],
                radio.label
            ]];
            arr.push(rad);
            return arr;
        }, [])];
    }
    function select (id, options) {
        var sel = jml('select', {id: id}, options, null);
        sel.value = settings[id] || '';
        return sel;
    }
    function checkbox (id) {
        var inputObj = {type: 'checkbox', id: id};
        if (settings[id]) {
            inputObj.checked = true;
        }
        return ['input', inputObj];
    }
    /**
    * @todo If no controls array is present, we could just iterate over all form controls
    */
    function serializeForm (formID, targetObj, controls) {
        // Selects, text/numeric inputs
        controls.inputs.forEach(function (setting) {
            targetObj[setting] = $('#' + setting).value;
        });
        // Checkboxes
        controls.checkboxes.forEach(function (setting) {
            targetObj[setting] = $('#' + setting).checked;
        });
        // Radio buttons
        controls.radios.forEach(function (setting) {
            targetObj[setting] = [].slice.call($('#' + formID)[setting]).filter(function (radio) {
                return radio.checked;
            })[0].id;
        });
        return targetObj;
    }
    
    removeChild('#table-container');   
    var formID = 'set-reminder';
    jml('form', {id: formID}, [['fieldset', [
        ['legend', [_("Set Reminder")]],
        ['label', [
            _("Name") + ' ',
            ['input', {id: 'name', required: true, value: settings.name || ''}]
        ]],
        ['label', [
            checkbox('enabled'),
            _("Enabled")
        ]],
        ['br'],
        ['label', [
            _("Frequency") + ' ',
            select('frequency', [
                    ['option', {value: 'daily'}, [_("Daily")]],
                    ['option', {value: 'one-time'}, [_("One-time")]]
            ])
        ]],
        ['br'],
        ['label', [
            _("Relative to") + ' ',
            select('relativeEvent', times.reduce(function (arr, time) {
                arr.push(
                    ['option', {value: time[1]}, [_(time[1])]],
                    ['option', {value: time[2]}, [_(time[2])]]
                );
                return arr;
            }, [['option', {value: 'now'}, [_("now")]]]))
        ]],
        '\u00a0 ',
        ['label', [
            ['input', {id: 'minutes', type: 'number', step: 1, value: settings.minutes}],
            ' ' + _("Minutes")
        ]],
        '\u00a0 ',
        radioGroup('relativePosition', [
            {label: _("after"), id: 'after'},
            {label: _("before"), id: 'before'}
        ], settings.relativePosition),
        ['br'],
        ['input', {type: 'submit', value: _("Save"), $on: {click: function () {
            var data = serializeForm(formID, {}, {
                inputs: ['name', 'frequency', 'relativeEvent', 'minutes'],
                checkboxes: ['enabled'],
                radios: ['relativePosition']
            });
            if (!data.name) { // Firefox will ask for the user to fill out the required field
//                alert(_("Please supply a name"));
                return;
            }
            localforage.getItem('sundriven', function (sundriven) {
                if (!sundriven) {
                    alert(_("Problem retrieving storage; refreshing page to try to resolve..."));
                    window.location.refresh();
                    return;
                }
                if (sundriven[data.name]) {
                    alert(_("ERROR: Please supply a unique name"));
                    return;
                }
                sundriven[data.name] = data;
                localforage.setItem('sundriven', sundriven, function () {
                    alert(_("Saved!"));
                });
            });
        }}}]
    ]]], $('#table-container'));
}
function createDefaultReminderForm () {
    createReminderForm({
        name: '',
        enabled: true,
        frequency: 'daily',
        relativeEvent: 'now',
        minutes: 60,
        relativePosition: 'after'
    });
}

setLocale();
document.title = _("Sun Driven");

localforage.getItem('sundriven', function (forms) {
    if (forms === null) {
        localforage.setItem('sundriven', {}, function (val) {
            if (!val) {
                alert(_("Error setting storage"));
            }
        });
        return;
    }

    // Todo: rebuild table upon each addition or editing of a reminder form
    
    removeElement('#forms');
    var table = jml('table', {id: 'forms'}, [
        ['tbody',
            Object.keys(forms).sort().reduce(function (rows, formKey) {
                var form = forms[formKey];
                rows.push(['tr', {dataset: {name: form.name}, $on: {
                    click: function (e) {
                        var name = this.dataset.name;
                        localforage.getItem('sundriven', function (forms) {
                            createReminderForm(forms[name]);
                        });
                    }}}, [
                        ['td', [form.name]], ['td', {'class': 'focus'}, [form.enabled ? 'x' : '']]
                    ]
                ]);
                return rows;
            }, [
                ['tr', [
                    ['th', [_("Name")]],
                    ['th', [_("Enabled")]]
                ]],
                ['tr', [
                    ['td', {colspan: 2, 'class': 'focus', $on: {click: createDefaultReminderForm}}, [_("(Create new reminder)")]]
                ]]
            ])
        ]
    ], $('#forms-container'));
    
    createDefaultReminderForm();
});

/*
Todos:
1. Interface to add (and store) reminders based on sunrise, sunset, dawn, or nothing, before or after; applicable date range or all; enabled or disabled
    1. Presets for Baha'i Fast, obligatory prayers, dawn prayers (though configurable in relative minutes after or before)
1. Interface to edit previously added reminders
1. Set up listeners for previously set reminders (setTimeout which calls another setTimeout with recalced time?)
    1. Have notification indicate alarm time and current time
1. Optionally change close event (and message for it) to give optional prompt to snooze instead of just closing
1. Add content policy directive indicating no Ajax needed, etc. (see if Firefox will display this (for privacy reassurances to user))
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
// createNotification(notify);

// EXPORTS
// window. = ;
}());
