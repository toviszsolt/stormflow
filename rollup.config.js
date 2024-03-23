const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');

const dist = './dist';
const plugins = [resolve({ preferBuiltins: true }), commonjs(), json()];

module.exports = [
  {
    input: 'src/stormflow.js',
    output: [
      { name: 'stormflow-mjs', file: `${dist}/stormflow.js`, format: 'es', generatedCode: 'es2015' },
      { name: 'stormflow-cjs', file: `${dist}/stormflow.cjs`, format: 'cjs', generatedCode: 'es2015' },
    ],
    plugins,
  },
];
