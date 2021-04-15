/**
 * @callback GeoPositionWrapperGetter
 * @param {Internationalizer} _
 * @param {GeolocationPosition} cb
 * @param {GeolocationPositionError} errBack
 * @throws {Error}
 * @returns {void} (Could change in the future if switch to `watchPosition`)
 */

/**
 * @type {GeoPositionWrapperGetter}
 */
function getGeoPositionWrapper (_, cb, errBack) {
  if (!navigator.geolocation) {
    alert(
      _('Your browser does not support or does not have Geolocation enabled')
    );
    throw new Error('Discontinue');
  }
  // We could instead use `getCurrentPosition`, but that wouldn't update with
  //   the user's location
  return navigator.geolocation.getCurrentPosition( // watchPosition(
    cb,
    errBack || function geoErrBack (err) {
      alert(_('geo_error', err.code, err.message));
    }
    /* , { // Geolocation options
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        }; */
  );
}
export default getGeoPositionWrapper;
