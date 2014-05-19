/*globals SunCalc, jml, localforage, createNotification, Notification */
/*jslint vars:true */

(function () { 'use strict';

var locale;
var formChanged = false;
var notificationsClosed = {};
var body = document.body;
var times = SunCalc.times;
var listeners = {}, watchers = {};

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
        "en-US": {
            // Suncalc items:
            sunrise: "Sunrise",
            sunset: "Sunset",
            sunriseEnd: "Sunrise end",
            sunsetStart: "Sunrise start",
            dawn: "Dawn",
            dusk: "Dusk",
            nauticalDawn: "Nautical dawn",
            nauticalDusk: "Nautical dusk",
            nightEnd: "Night end",
            night: "Night",
            goldenHourEnd: "Golden hour end",
            goldenHour: "Golden hour",
            // i18n functions to allow reordering of dynamic arguments (without string substitutions)
            geo_error: function (code, msg) {
                return "ERROR (" + code + "): " + msg;
            },
            notification_message_onetime: function (name, date, alarmDateTime, nowDateTime) {
                return "NOTICE: Your reminder, " + name + ", has expired; recent time launched: " + alarmDateTime + "; current time: " + nowDateTime + "; relative to: " + date;
            },
            notification_message_onetime_astronomical: function (name, date, alarmDateTime, nowDateTime, astronomicalEvent) {
                return "NOTICE: Your reminder, " + name + ", has expired; recent time launched: " + alarmDateTime + "; current time: " + nowDateTime + "; relative to " + _(astronomicalEvent) + ": " + date;
            },
            notification_message_daily: function (name, date, alarmDateTime, nowDateTime) {
                return "NOTICE: Your reminder, " + name + ", has expired for today; recent time launched: " + alarmDateTime + "; current time: " + nowDateTime + "; relative to: " + date;
            },
            notification_message_daily_astronomical: function (name, date, alarmDateTime, nowDateTime, astronomicalEvent) {
                return "NOTICE: Your reminder, " + name + ", has expired for today; recent time launched: " + alarmDateTime + "; current time: " + nowDateTime + "; relative to " + _(astronomicalEvent) + ": " + date;
            }
        }
    };
    var msg = (messages[locale] || messages['en-US'])[s] || s;
    return typeof msg === 'function' ? msg.apply(null, [].slice.call(arguments, 1)) : msg;
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
/**
* @todo If no controls array is present, we could just iterate over all form controls
*/
function serializeForm (formID, targetObj, controls) {
    // Selects, text/numeric inputs
    if (controls.inputs) {
        controls.inputs.forEach(function (setting) {
            targetObj[setting] = $('#' + setting).value;
        });
    }
    // Checkboxes
    if (controls.checkboxes) {
        controls.checkboxes.forEach(function (setting) {
            targetObj[setting] = $('#' + setting).checked;
        });
    }
    // Radio buttons
    if (controls.radios) {
        controls.radios.forEach(function (setting) {
            targetObj[setting] = [].slice.call($('#' + formID)[setting]).filter(function (radio) {
                return radio.checked;
            })[0].id;
        });
    }
    return targetObj;
}

function getGeoPositionWrapper (cb, errBack) {
    if (!navigator.geolocation) {
        alert(_("Your browser does not support or does not have Geolocation enabled"));
        return;
    }
    // We could instead use getCurrentPosition, but that wouldn't update with the user's location
    return navigator.geolocation.getCurrentPosition( // watchPosition(
        cb,
        errBack || function geoErrBack (err) {
            alert(_("geo_error", err.code, err.message));
        }
        /*, { // Geolocation options
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        };*/
    );
}
function notify (name, body) {
    // show the notification
    var notification = new Notification('Reminder (Click inside me to stop)', {body: body, lang: locale}); // lang=string, body=string, tag=string, icon=url, dir (ltr|rtl|auto)
    notification.onclick = function(e) {
        notificationsClosed[name] = true;
    };
    notification.onclose = function(e) {
        if (!notificationsClosed[name]) { // Only apparent way to keep it open
            notify(name, body);
        }
        else { // In case notice runs again
            delete notificationsClosed[name];
        }
    };
    /*
    notification.onshow = function(e) {
    };
    */
    // And vibrate the device if it supports vibration API
    window.navigator.vibrate(500);
}

function storageSetterErrorWrapper (cb) {
    return function (val) {
        if (!val) {
            alert(_("ERROR: Problem setting storage; refreshing page to try to resolve..."));
            window.location.reload();
            return;
        }
        if (cb) {
            cb(val);
        }
    };
}

function storageGetterErrorWrapper (cb) {
    return function (data) {
        if (data === null) {
            localforage.setItem('sundriven', {}, storageSetterErrorWrapper(function (val) {cb(val);}));
            // This would loop (and data will be null on first run)
            // alert(_("ERROR: Problem retrieving storage; refreshing page to try to resolve..."));
            // window.location.reload();
        }
        else {
            cb(data);
        }
    };
}

function createDefaultReminderForm () {
    createReminderForm({
        name: '',
        enabled: true,
        frequency: 'daily',
        relativeEvent: 'now',
        minutes: '60',
        relativePosition: 'after'
    });
}

function buildReminderTable () {
    localforage.getItem('sundriven', storageGetterErrorWrapper(function (forms) {
        removeElement('#forms');
        var table = jml('table', {id: 'forms'}, [
            ['tbody',
                Object.keys(forms).sort().reduce(function (rows, formKey) {
                    var form = forms[formKey];
                    rows.push(['tr', {dataset: {name: form.name}, $on: {
                        click: function (e) {
                            var name = this.dataset.name;
                            localforage.getItem('sundriven', storageGetterErrorWrapper(function (forms) {
                                createReminderForm(forms[name]);
                            }));
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
    }));
}

function updateListeners (sundriven) {
    Object.keys(sundriven).forEach(function (name) {
        var data = sundriven[name];
        function clearWatch (name) {
            if (watchers[name]) {
                navigator.geolocation.clearWatch(watchers[name]);
            }
        }
        function getRelative (date, astronomicalEvent) {
            var timeoutID;
            var minutes = parseFloat(data.minutes);
            minutes = data.relativePosition === 'before' ? -minutes : minutes; // after|before
            var startTime = Date.now();
            date = date || new Date(startTime);
            var time = (date.getTime() - startTime) + minutes * 60 * 1000;
            if (time < 0) {
                time = 0;
            }
            clearTimeout(listeners[name]);
            switch(data.frequency) {
                case 'daily':
                    timeoutID = setTimeout((function (name, time, date, astronomicalEvent) {
                        return function () {
                            createNotification(function () {
                                notify(name, _(astronomicalEvent ? "notification_message_daily_astronomical" : "notification_message_daily", name, date, new Date(Date.now() - time), new Date(), astronomicalEvent));
                            });
                            getRelative(new Date(Date.now() + 24 * 60 * 60 * 1000), astronomicalEvent);
                        };
                    }(name, time, date, astronomicalEvent)), time);
                    break;
                default: // one-time
                    timeoutID = setTimeout((function (name, time, date, astronomicalEvent) {
                        return function () {
                            createNotification(function () {
                                notify(name, _(astronomicalEvent ? "notification_message_onetime_astronomical" : "notification_message_onetime", name, date, new Date(Date.now() - time), new Date(), astronomicalEvent));
                            });
                            delete listeners[name];
                            clearWatch(name);
                            data.enabled = 'false';
                            localforage.setItem('sundriven', sundriven, storageSetterErrorWrapper(function () {
                                if ($('#name').value === name) {
                                    $('#enabled').checked = false;
                                }
                                buildReminderTable();
                            }));
                        };
                    }(name, time, date, astronomicalEvent)), time);
                    break;
            }
            listeners[name] = timeoutID;
        }

        function getTimesForCoords (relativeEvent) {
            return function (pos) {
                var times = SunCalc.getTimes(new Date(), pos.coords.latitude, pos.coords.longitude);
                getRelative(times[relativeEvent], relativeEvent);
            };
        }
        function getCoords () {
            var latitude = $('#latitude').value;
            var longitude = $('#longitude').value;
            if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
                return false;
            }
            return {coords: {latitude: latitude, longitude: longitude}};
        }
        if (data.enabled) {
            clearWatch(name);
            var relativeEvent = data.relativeEvent;
            switch (relativeEvent) {
                case 'now':
                    getRelative();
                    break;
                default: // sunrise, etc.
                    if ($('#geoloc-usage').value === 'never') { // when-available|always
                        var coords = getCoords();
                        if (!coords) {
                            alert(_("Per your settings, Geolocation is disallowed, and the manual coordinates are not formatted correctly, so the astronomical event cannot be determined at this time."));
                            return;
                        }
                        getTimesForCoords(relativeEvent)(coords);
                    }
                    else {
                        watchers[name] = getGeoPositionWrapper(
                            getTimesForCoords(relativeEvent),
                            (($('#geoloc-usage').value === 'when-available') ? function () {
                                var coords = getCoords();
                                if (!coords) {
                                    alert(_("Geolocation is not currently available, and the manual coordinates are not formatted correctly in your settings, so the astronomical event cannot be determined at this time."));
                                    return;
                                }
                                getTimesForCoords(relativeEvent)(getCoords());
                            } : null)
                        );
                    }
                    break;
            }
        }
    });
}


function createReminderForm (settings, allowRename) {
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
    
    if (formChanged) {
        var continueWithNewForm = confirm("You have unsaved changes; are you sure you wish to continue and lose your unsaved changes?");
        if (!continueWithNewForm) {
            return;
        }
        formChanged = false;
    }
    settings = settings || {};
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
        ['br'],
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

            localforage.getItem('sundriven', storageGetterErrorWrapper(function (sundriven) {
                if (!settings.name && // If this form was for creating new as opposed to editing old reminders
                    sundriven[data.name]) {
                    alert(_("ERROR: Please supply a unique name"));
                    return;
                }
                var originalName = $('#name').defaultValue;
                if ([$('#name').value, ''].indexOf(originalName) === -1) {
                    // If this is a rename, we warned the user earlier about it, so go ahead and delete now
                    clearTimeout(listeners[originalName]);
                    delete sundriven[originalName];
                }
                sundriven[data.name] = data;
                localforage.setItem('sundriven', sundriven, storageSetterErrorWrapper(function () {
                    formChanged = false;
                    buildReminderTable();
                    updateListeners(sundriven);
                    alert(_("Saved!"));
                }));
            }));
        }}}],
        ['button', {'class': 'delete', $on: {click: function (e) {
            e.preventDefault();
            var name = $('#name').value;
            if (!name) { // Required field will be used automatically
                // alert(_("Please supply a reminder name for deletion."));
                return;
            }
            var okDelete = confirm(_("Are you sure you wish to delete this reminder?"));
            if (okDelete) {
                clearTimeout(listeners[name]);
                localforage.getItem('sundriven', storageGetterErrorWrapper(function (sundriven) {
                    delete sundriven[name];
                    localforage.setItem('sundriven', sundriven, storageSetterErrorWrapper(function () {
                        formChanged = false;
                        buildReminderTable();
                        createDefaultReminderForm();
                        alert(_("Reminder deleted!"));
                    }));
                }));
            }
        }}}, [_("Delete")]]
    ]]], $('#table-container'));
}

jml('div', [
        ['button', {$on: {click: function () {
            $('#settings-holder').hidden = !$('#settings-holder').hidden;
        }}}, [_("Settings")]],
        ['div', {id: 'settings-holder', hidden: true}, [
            ['form', {id: 'settings', $on: {change: function () {
                var data = serializeForm('settings', {}, {
                    inputs: ['geoloc-usage', 'latitude', 'longitude']
                });
                localforage.setItem('sundriven-settings', data, storageSetterErrorWrapper());
            }}}, [
                ['fieldset', [
                    ['select', {id: 'geoloc-usage'}, [
                        ['option', {value: 'when-available', title: _("Fall back to the coordinates below when offline or upon Geolocation errors")}, [_("Use Geolocation when available")]],
                        ['option', {value: 'never', title: _("Avoids a trip to the server but may not be accurate if you are traveling out of the area with your device.")}, [_("Never use Geolocation; always use manual coordinates.")]],
                        ['option', {value: 'always', title: _("Will report errors instead of falling back (not recommended)")}, [_("Always use Geolocation; do not fall back to manual coordinates")]]
                    ]],
                    ['fieldset', {title: _("Use these coordinates for astronomical event-based reminders when offline or upon errors")}, [
                        ['legend', [_("Manual coordinates")]],
                        ['label', [
                            _("Latitude") + ' ',
                            ['input', {id: 'latitude', size: 20}]
                        ]],
                        ['br'],
                        ['label', [
                            _("Longitude") + ' ',
                            ['input', {id: 'longitude', size: 20}]
                        ]],
                        ['br'],
                        ['button', {title: "Retrieve coordinates now using Geolocation for potential later use when offline or upon errors (depends on the selected pull-down option).", $on: {click: function (e) {
                            e.preventDefault();
                            $('#retrieving').hidden = false;
                            getGeoPositionWrapper(function (pos) {
                                $('#latitude').value = pos.coords.latitude;
                                $('#longitude').value = pos.coords.longitude;
                                var evt = document.createEvent('HTMLEvents');
                                evt.initEvent('change', false, true);
                                $('#settings').dispatchEvent(evt);
                                $('#retrieving').hidden = true;
                            }, function (err) {
                                alert(_("geo_error", err.code, err.message));
                                $('#retrieving').hidden = true;
                            });
                        }}}, [
                            _("Retrieve coordinates for manual storage")
                        ]],
                        nbsp(),
                        ['span', {id: 'retrieving', hidden: true}, [_("Retrieving...")]]
                    ]]
                ]]
            ]]
        ]],
        ['br']
    ],
    $('#settings-container')
);
localforage.getItem('sundriven-settings', storageGetterErrorWrapper(function (settings) {
    Object.keys(settings).forEach(function (key) {
        $('#' + key).value = settings[key];
    });
}));

setLocale();
document.title = _("Sun Driven");

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
localforage.getItem('sundriven', storageGetterErrorWrapper(function (sundriven) {
    updateListeners(sundriven);
}));

// EXPORTS
// window. = ;
}());
