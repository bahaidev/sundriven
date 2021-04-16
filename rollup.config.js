import {terser} from 'rollup-plugin-terser';

import nodeResolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';

// import babel from '@rollup/plugin-babel';
// import packageJson from './package.json';

/**
 * @external RollupConfig
 * @type {PlainObject}
 * @see {@link https://rollupjs.org/guide/en#big-list-of-options}
 */

/**
 * @param {PlainObject} [config={}]
 * @param {boolean} [config.minifying=false]
 * @param {string} [config.format="umd"]
 * @param {boolean} [config.lite=false]
 * @returns {external:RollupConfig}
 */
function getRollupObject ({
  minifying = false, format = 'umd', lite = false
} = {}) {
  const nonMinified = {
    input: './node_modules/meeussunmoon/dist/meeussunmoon.mjs',
    output: {
      format,
      sourcemap: minifying,
      file: [
        'vendor/meeussunmoon',
        lite ? '.lite' : '',
        format === 'umd' ? '' : `.${format}`,
        minifying ? '.min' : '',
        '.js'
      ].join('')
    },
    plugins: [
      nodeResolve()
      /*
      babel({
        babelHelpers: 'bundled'
      })
      */
    ]
  };
  /*
  if (lite) {
    nonMinified.external = Object.keys(packageJson.dependencies);
  }
  */
  /*
  if (minifying) {
    nonMinified.plugins.push(terser());
  }
  */
  return nonMinified;
}

export default [
  getRollupObject({minifying: false, format: 'esm'}),
  {
    input: './node_modules/luxon/src/luxon.js',
    output: {
      format: 'esm',
      sourcemap: false,
      file: 'vendor/luxon.js'
    },
    plugins: [
      nodeResolve()
      /*
      babel({
        babelHelpers: 'bundled'
      })
      */
    ]
  },
  {
    input: 'src/main.js',
    output: {
      format: 'esm',
      sourcemap: true,
      file: 'dist/sundriven.js'
    },
    plugins: [
      terser()
    ]
  }
];
