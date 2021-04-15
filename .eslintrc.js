'use strict';

module.exports = {
  extends: ['ash-nazg/sauron-overrides'],
  parserOptions: {
    ecmaVersion: 2020
  },
  env: {
    node: false,
    browser: true
  },
  overrides: [{
    files: 'locales/**',
    rules: {
      'max-len': 0
    }
  }],
  settings: {
    polyfills: [
      'navigator.permissions',
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
    'jsdoc/require-returns': 0,
    'jsdoc/require-param-type': 0,
    'promise/prefer-await-to-callbacks': 0
  }
};
