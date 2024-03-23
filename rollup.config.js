// const { terser } = require('rollup-plugin-terser');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');

const buildFolder = './dist';
const configResolve = { preferBuiltins: true };
// const configTerser = { format: { comments: false } };
const basePlugins = [resolve(configResolve), commonjs(), json()];

module.exports = [
  {
    input: 'src/stormflow.js',
    output: [
      {
        name: 'stormflow-mjs',
        file: `${buildFolder}/stormflow.js`,
        format: 'es',
        generatedCode: 'es2015',
      },
      {
        name: 'stormflow-cjs',
        file: `${buildFolder}/stormflow.cjs`,
        format: 'cjs',
        generatedCode: 'es2015',
      },
    ],
    plugins: [...basePlugins],
  },
];
