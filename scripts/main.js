/*globals SunCalc, jml, localforage, createNotification, Notification */
/*jslint vars:true */
/*
Todos:
1. Set up listeners for previously set reminders (setTimeout which calls another setTimeout with recalced time?)
    1. Have notification indicate alarm time and current time
    1. Ensure alarms cancelled if deleted or updated if modified

1. Reenable web app installation code and test

Possible Todos:
1. Display text messages instead of alerts/confirm for save/delete
1. Optionally change close event (and message for it) to give optional prompt to snooze instead of just closing
1. Allow specification of applicable date range or all
1. Presets for Baha'i Fast, obligatory prayers, dawn prayers (though configurable afterward, e.g., in relative minutes after or before)
1. Add content policy directive indicating no Ajax needed, etc. (see if Firefox will display this (for privacy reassurances to user))
*/

(function () { 'use strict';

var locale;
var formChanged = false;
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
function nbsp(ct) {
    return new Array((ct || 1) + 1).join('\u00a0');
}

function createReminderForm (settings, allowRename) {
    if (formChanged) {
        var continueWithNewForm = confirm("You have unsaved changes; are you sure you wish to continue and lose your unsaved changes?");
        if (!continueWithNewForm) {
            return;
        }
        formChanged = false;
    }
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
    jml('form', {id: formID, $on: {change: function (e) {
        var target = e.target;
        if (target.id === 'name' && target.defaultValue !== '') {
            var renameReminder = confirm(_("Are you sure you wish to rename this reminder? If you wish instead to create a new one, click 'cancel' now and then click 'save' when you are ready."));
            if (!renameReminder) {
                var data = serializeForm(formID, {}, {
                    inputs: ['name', 'frequency', 'relativeEvent', 'minutes'],
                    checkboxes: ['enabled'],
                    radios: ['relativePosition']
                });
                formChanged = false; // Temporarily indicate the changes are not changed
                createReminderForm(data, true);
            }
        }
        formChanged = true;
    }}}, [['fieldset', [
        ['legend', [_("Set Reminder")]],
        ['label', [
            _("Name") + ' ',
            ['input', {id: 'name', required: true, defaultValue: settings.name || '', value: settings.name || ''}]
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
        nbsp(2),
        ['label', [
            ['input', {id: 'minutes', type: 'number', step: 1, value: settings.minutes}],
            ' ' + _("Minutes")
        ]],
        nbsp(2),
        radioGroup('relativePosition', [
            {label: _("after"), id: 'after'},
            {label: _("before"), id: 'before'}
        ], settings.relativePosition),
        ['br'],
        ['input', {type: 'submit', value: _("Save"), $on: {click: function (e) {
            e.preventDefault();
            var data = serializeForm(formID, {}, {
                inputs: ['name', 'frequency', 'relativeEvent', 'minutes'],
                checkboxes: ['enabled'],
                radios: ['relativePosition']
            });
            if (!data.name) { // Firefox will ask for the user to fill out the required field
//                alert(_("ERROR: Please supply a name"));
                return;
            }
            localforage.getItem('sundriven', function (sundriven) {
                if (!sundriven) {
                    alert(_("ERROR: Problem retrieving storage; refreshing page to try to resolve..."));
                    window.location.refresh();
                    return;
                }
                if (!settings.name && // If this form was for creating new as opposed to editing old reminders
                    sundriven[data.name]) {
                    alert(_("ERROR: Please supply a unique name"));
                    return;
                }
                var originalName = $('#name').defaultValue;
                if ([$('#name').value, ''].indexOf(originalName) === -1) {
                    // If this is a rename, we warned the user earlier about it, so go ahead and delete now
                    delete sundriven[originalName];
                }
                sundriven[data.name] = data;
                localforage.setItem('sundriven', sundriven, function () {
                    buildReminderTable();
                    alert(_("Saved!"));
                });
            });
        }}}],
        ['button', {'class': 'delete', $on: {click: function (e) {
            if (!$('#name').value) { // Required field will be used automatically
                // alert(_("Please supply a reminder name for deletion."));
                return;
            }
            var okDelete = confirm(_("Are you sure you wish to delete this reminder?"));
            if (okDelete) {
                localforage.getItem('sundriven', function (sundriven) {
                    delete sundriven[$('#name').value];
                    localforage.setItem('sundriven', sundriven, function () {
                        buildReminderTable();
                        createDefaultReminderForm();
                        alert(_("Reminder deleted!"));
                    });
                });
            }
        }}}, [_("Delete")]]
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


function buildReminderTable () {
    formChanged = false; // Repopulating of table should always coincide with readiness to add new content
    localforage.getItem('sundriven', function (forms) {
        if (forms === null) {
            localforage.setItem('sundriven', {}, function (val) {
                if (!val) {
                    alert(_("ERROR: Problem setting storage"));
                }
            });
            return;
        }
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
    });
}

window.addEventListener('beforeunload', function (e) {
    if (formChanged) {
        var msg = _("You have unsaved changes; are you sure you wish to leave the page?"); // Not utilized in Mozilla
        e.returnValue = msg;
        e.preventDefault();
        return msg;
    }
});

buildReminderTable();
createDefaultReminderForm();

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
