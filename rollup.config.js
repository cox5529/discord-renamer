import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: {
    inlineDynamicImports: true,
    file: __dirname + '/build/index.js',
    format: 'es',
  },
  plugins: [
    typescript(),
    nodeResolve(),
    commonjs({
      include: /node_modules/,
    }),
    json(),
    terser()
  ],
};
