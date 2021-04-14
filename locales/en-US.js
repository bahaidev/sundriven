const localeEnUs = {
  // MeeusSunMoon items:
  solarNoon: 'Noon (Solar noon)',
  sunrise: 'Sunrise',
  sunset: 'Sunset',
  civilDawn: 'Civil dawn',
  civilDusk: 'Civil dusk',
  nauticalDawn: 'Nautical dawn',
  nauticalDusk: 'Nautical dusk',
  astronomicalDawn: 'Astronomical dawn',
  astronomicalDusk: 'Astronomical dusk',
  /*
    nadir: 'Nadir',
    sunriseEnd: 'Sunrise end',
    sunsetStart: 'Sunrise start',
    goldenHourEnd: 'Golden hour end',
    goldenHour: 'Golden hour',
    */
  // i18n functions to allow reordering of dynamic arguments (without string substitutions)
  geo_error: 'ERROR ({code}): {msg}',
  notification_message_onetime: 'NOTICE: Your reminder, {name}, has expired; recent time launched: {alarmDateTime}; current time: {nowDateTime}; relative to: {date}',
  notification_message_onetime_astronomical: 'NOTICE: Your reminder, {name}, has expired; recent time launched: {alarmDateTime}; current time: {nowDateTime}; relative to {astronomicalEvent}: {date}',
  notification_message_daily: 'NOTICE: Your reminder, {name}, has expired for today; recent time launched: {alarmDateTime}; current time: {nowDateTime}; relative to: {date}',
  notification_message_daily_astronomical: 'NOTICE: Your reminder, {name}, has expired for today; recent time launched: {alarmDateTime}; current time: {nowDateTime}; relative to {astronomicalEvent}: {date}',

  browser_not_support_notifications: 'This browser does not support notifications.',
  click_allow_notifications: 'Click to allow notifications (required)'
};

export default localeEnUs;
