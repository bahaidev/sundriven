// Need to hard-code locales as no build script
const locales = [
  'en-US'
];

let localeObj;

/**
 * @callback Internationalizer
 * @param {string} s
 * @param {...any} args
 * @returns {string}
 */

/**
 * @type {Internationalizer}
 */
function _ (s, ...args) {
  // Todo: Provide proper i18n keys so we can drop the fallback behavior
  const msg = localeObj[s] || s;
  return msg.replaceAll(/\{(?:[^\}]*)\}/vg, () => {
    return args.shift();
  });
}

/**
* @typedef {string} Locale
*/

/**
* @typedef {PlainObject} LocaleInfo
* @property {Internationalizer} _
* @property {Locale} locale
*/

/**
 * @returns {LocaleInfo}
 */
async function setLocale () {
  const loc = location.href;
  // Todo: Use `URLSearchParams`; could use history state
  const frag = '#lang=';
  const langInURLPos = loc.indexOf(frag);
  const langInURL = (langInURLPos !== -1)
    ? loc.slice(langInURLPos + frag.length)
    : false;

  let locale = langInURL || navigator.language || 'en-US';
  document.documentElement.lang = locale;
  if (!locales.includes(locale)) {
    locale = 'en-US';
  }
  // // eslint-disable-next-line no-unsanitized/method -- Is sanitized
  localeObj = (await import(`../../locales/${locale}.js`)).default;
  return {_, locale};
}

export {setLocale};
