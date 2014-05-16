# sundriven

**This project is not yet functional!**

An [installable open web app](https://developer.mozilla.org/en-US/Apps)
allowing toaster-style notification reminders to be given relative to
dawn, sunrise, or sunset times.

Uses [suncalc](https://github.com/mourner/suncalc) for astronoical
calculations.

# Installation
```
npm install .
```

# Todos
1. Set up listeners for previously set reminders (setTimeout which calls another setTimeout with recalced time?)
    1. Have notification indicate alarm time and current time (and modified time if geoloc caused change?)
    1. Ensure alarms cancelled if deleted or updated if modified
1. Retry fresh installation (problems with npm on suncalc gone?)

1. Add browserify to devDependencies and utilize instead of hard-coded script tags (also modularize and use localization function `_` (and separating out the locales as well), so it can be reused across modules); add bower.json and submit?
1. Reenable web app installation code and test; try mobile simulator; try FF Marketplace and own site?
1. Enable offline manifest and test on server, ensuring no dependencies loaded

# Possible Todos
1. Allow fractional minutes (if able to keep input steps)
1. Make geolocation options (and option to use getCurrentPosition in place of watchPosition) configurable
1. Allow manual provision of latitude and longitude for people who do not wish to use Geolocation
1. Display text messages instead of alerts/confirm for save/delete
1. Optionally change close event (and message for it) to give optional prompt to snooze instead of just closing
1. Allow specification of applicable date range or all
1. Presets for Baha'i Fast, obligatory prayers, dawn prayers (though configurable afterward, e.g., in relative minutes after or before)
1. Add content policy directive indicating no Ajax needed, etc. (see if Firefox will display this (for privacy reassurances to user))
