'use strict';

module.exports = {
  extends: 'ash-nazg/sauron-overrides',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    node: false,
    browser: true
  },
  rules: {
    // Disable for now
    'max-len': 0
  }
};
