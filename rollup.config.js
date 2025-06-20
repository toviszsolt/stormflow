import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import { terser } from 'rollup-plugin-terser';

const dist = './dist';
const terserOptions = { format: { comments: false } };
const outputOptions = { generatedCode: 'es2015' };

const plugins = [
  del({ targets: dist, runOnce: true, verbose: true }),
  resolve({ preferBuiltins: true }),
  commonjs(),
  json(),
  terser(terserOptions),
  copy({
    targets: [
      { src: 'src/stormflow.d.ts', dest: dist, rename: 'stormflow.d.ts' },
      { src: 'src/storage/fileStorageAdapter.d.ts', dest: `${dist}/adapters` },
      { src: 'src/storage/fileBackupAdapter.d.ts', dest: `${dist}/adapters` },
    ],
  }),
];

export default [
  {
    input: 'src/stormflow.js',
    output: [
      { file: `${dist}/stormflow.js`, format: 'es', ...outputOptions },
      { file: `${dist}/stormflow.cjs`, format: 'cjs', ...outputOptions },
    ],
    plugins,
  },
  {
    input: 'src/storage/fileStorageAdapter.js',
    output: [
      { file: `${dist}/adapters/fileStorageAdapter.js`, format: 'es', ...outputOptions },
      { file: `${dist}/adapters/fileStorageAdapter.cjs`, format: 'cjs', ...outputOptions },
    ],
    plugins,
  },
  {
    input: 'src/storage/fileBackupAdapter.js',
    output: [
      { file: `${dist}/adapters/fileBackupAdapter.js`, format: 'es', ...outputOptions },
      { file: `${dist}/adapters/fileBackupAdapter.cjs`, format: 'cjs', ...outputOptions },
    ],
    plugins,
  },
];
