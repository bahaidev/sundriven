'use strict';

module.exports = {
  extends: ['ash-nazg/sauron-overrides'],
  env: {
    node: false,
    browser: true
  },
  settings: {
    polyfills: [
      'Notification',
      'Notification.requestPermission',
      'Number.parseFloat',
      'Object.entries',
      'Promise'
    ]
  },
  rules: {
    // Disable for now
    'no-alert': 0,
    'import/namespace': ['error', {allowComputed: true}],
    'max-len': 0,
    'jsdoc/require-returns': 0,
    'jsdoc/require-param-type': 0,
    'promise/prefer-await-to-callbacks': 0
  }
};
