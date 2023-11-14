import terser from '@rollup/plugin-terser';

import {nodeResolve} from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

// import babel from '@rollup/plugin-babel';
// import packageJson from './package.json';

/**
 * @external RollupConfig
 * @type {PlainObject}
 * @see {@link https://rollupjs.org/guide/en#big-list-of-options}
 */

/**
 * @param {PlainObject} [config]
 * @param {boolean} [config.minifying]
 * @param {string} [config.format]
 * @param {boolean} [config.lite]
 * @returns {RollupConfig}
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
    input: 'src/sundriven.js',
    output: {
      format: 'esm',
      sourcemap: true,
      dir: 'dist'
    },
    plugins: [
      dynamicImportVars(),
      terser()
    ]
  }
];
