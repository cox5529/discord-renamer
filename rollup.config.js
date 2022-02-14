import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    dir: __dirname + '/build',
    format: 'es',
  },
  preserveEntrySignatures: false,
  plugins: [
    typescript(),
    commonjs({
      include: /node_modules/,
    }),
    json(),
    terser()
  ],
};
