const { terser } = require('rollup-plugin-terser');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const copy = require('rollup-plugin-copy');

const buildFolder = './dist';
const configResolve = { preferBuiltins: true };
const configTerser = { format: { comments: false } };
const configCopy = { targets: [{ src: 'stormflow.d.ts', dest: buildFolder }] };
const plugins = [resolve(configResolve), commonjs(), json(), terser(configTerser)];

module.exports = [
  {
    input: 'stormflow.js',
    output: [
      { name: 'stormflow-mjs', file: `${buildFolder}/stormflow.js`, format: 'es' },
      { name: 'stormflow-cjs', file: `${buildFolder}/stormflow.cjs`, format: 'cjs' },
    ],
    plugins: [...plugins, copy(configCopy)],
  },
  {
    input: 'stormflow.js',
    output: [{ name: 'stormflow-bundle', file: `stormflow-bundle.js`, format: 'cjs' }],
    plugins: [resolve(configResolve), commonjs()],
    external: ['crc', 'zlib'],
  },
];
