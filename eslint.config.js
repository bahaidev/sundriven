import ashNazg from 'eslint-config-ash-nazg';

export default [
  {
    ignores: [
      'vendor',
      'dist'
    ]
  },
  ...ashNazg(['sauron', 'browser']),
  {
    files: ['locales/**'],
    rules: {
      '@stylistic/max-len': 0
    }
  },
  {
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
      'promise/prefer-await-to-callbacks': 0,
      'sonarjs/no-intrusive-permissions': 0
    }
  }
];
