# sundriven

Very simple
[installable open web app](https://developer.mozilla.org/en-US/Apps)
to provide toaster-style notification reminders given relative to either the
current time or to astronomical events such as dawn, sunrise, or sunset.
Note that the astronomical event times are currently determined
mathematically rather than by querying an online service.

Uses [MeeusSunMoon](https://github.com/janrg/MeeusSunMoon) for astronomical
calculations.

I have experienced Geolocation errors periodically, but that may be
due to my specific location or network settings.

**[Demo](https://brettz9.github.io/sundriven/)**

# Installation
```
npm install .
```

# Higher priority todos

1. Fix Firefox per <https://blog.mozilla.org/futurereleases/2019/11/04/restricting-notification-permission-prompts-in-firefox/>.
1. Ask for notifications permission immediately so it will work the first time
    used!
1. Debug and reinstall "install" button
1. Get ES6 modules working
1. Change cache.manifest to service worker; add `<link>` for Web Manifest
    discovery <https://developer.mozilla.org/en-US/docs/Web/Manifest#Deploying_a_manifest_with_the_link_tag>
    1. Test offline manifest on server, ensuring no dependencies missing
        1. Add content policy directive indicating no Ajax needed, etc. (see
            if Firefox will, with an add-on if not by default, display this
            (for privacy reassurances to user))
1. Modularize and use localization function `_` (and separating out
    the locales as well including in createNotification file),
    so it can be reused across modules); publish to npm

# Possible to-dos
1. Allow fractional minutes (if able to keep input steps)
1. Make geolocation options (and option to use `watchPosition` in
    place of `getCurrentPosition`--the latter being used currently due to
    intermittent Geolocation errors) configurable
1. Option to auto-store latest latitude/longitude from Geolocation in
    order to work next time offline
1. Indicate original expected time on notices? (since geoloc may have
    updated)
1. Config to auto-delete expired timeouts (one-time ones) instead of
    just disabling
1. Display dialogs instead of alerts/confirm for save/delete
1. Optionally change close event (and message for it) to give optional
    prompt to snooze instead of just closing
1. Allow specification of applicable date range or all
1. Presets, e.g., for Baha'i Fast, obligatory prayers (relative to morning,
    noon, or sunset), dawn prayers (though configurable afterward, e.g., in
    relative minutes after or before)

# Credits

Thanks to MeeusSunMoon for a great library and to
[dear_theophilus](http://openclipart.org/user-detail/dear_theophilus) of
[openclipart](http://openclipart.org)
for the
[Rising Sun](http://openclipart.org/detail/122071/rising-sun-by-dear_theophilus)
[public domain](http://openclipart.org/share) clip art.
