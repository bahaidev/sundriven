# sundriven

Very simple [installable open web app](https://developer.mozilla.org/en-US/Apps)
to provide toaster-style notification reminders given relative to either the
current time or to astronomical events such as dawn, sunrise, or sunset.
Note that the astronomical event times are currently determined
mathematically rather than by querying an online service.

Uses [suncalc](https://github.com/mourner/suncalc) for astronomical
calculations and [localforage](https://github.com/mozilla/localForage)
for local storage (IndexedDB or WebSQL where available; localStorage
otherwise).

I have experienced Geolocation errors periodically, but that may be
due to my specific location or network settings.

**[Demo](http://brett-zamir.me/sundriven/)**

# Installation
```
npm install .
```


# Higher priority todos
1. Keep a memory on whether the reminders already executed for the day or not (unless the time is modified).
1. Retry fresh installation of suncalc via npm for [npm issue](https://github.com/npm/npm/issues/5291)
1. Add ES6 module polyfill, requirejs, or browserify to devDependencies and utilize instead of hard-coded script tags (also modularize and use localization function `_` (and separating out the locales as well), so it can be reused across modules); add bower.json and submit?
1. Waiting on [FF Marketplace](https://marketplace.firefox.com/app/sundriven/)
1. Test offline manifest on server, ensuring no dependencies missing
    1. Add content policy directive indicating no Ajax needed, etc. (see if Firefox will, with an add-on if not by default, display this (for privacy reassurances to user))

# Possible Todos
1. Allow fractional minutes (if able to keep input steps)
1. Make geolocation options (and option to use watchPosition in place of getCurrentPosition--the latter being used currently due to intermittent Geolocation errors) configurable
1. Option to store latitude/longitude from Geolocation in order to work next time offline
1. Indicate original expected time on notices? (since geoloc may have updated)
1. Config to auto-delete expired timeouts (one-time ones) instead of just disabling
1. Display dialogs instead of alerts/confirm for save/delete
1. Optionally change close event (and message for it) to give optional prompt to snooze instead of just closing
1. Allow specification of applicable date range or all
1. Presets, e.g., for Baha'i Fast, obligatory prayers, dawn prayers (though configurable afterward, e.g., in relative minutes after or before)

# Credits

Thanks to suncalc and localforage for great libraries and to
[dear_theophilus](http://openclipart.org/user-detail/dear_theophilus) of
[openclipart](http://openclipart.org)
for the
[Rising Sun](http://openclipart.org/detail/122071/rising-sun-by-dear_theophilus)
[public domain](http://openclipart.org/share) clip art.
