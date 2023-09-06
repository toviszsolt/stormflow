const { terser } = require('rollup-plugin-terser');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');

const buildFolder = './dist';
const configResolve = { preferBuiltins: true };
const configTerser = { format: { comments: false } };

const modulePlugins = [resolve(configResolve), commonjs(), json(), terser(configTerser)];

module.exports = [
  {
    input: 'stormflow.js',
    output: [
      { name: 'stormflow-mjs', file: `${buildFolder}/stormflow.js`, format: 'es' },
      { name: 'stormflow-cjs', file: `${buildFolder}/stormflow.cjs`, format: 'cjs' },
    ],
    plugins: modulePlugins,
  },
  {
    input: 'stormflow.js',
    output: [{ name: 'stormflow-bundle', file: `stormflow-bundle.js`, format: 'cjs' }],
    plugins: [commonjs()],
  },
];
