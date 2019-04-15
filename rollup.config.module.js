import babel from 'rollup-plugin-babel';
import { name, dependencies } from './package.json';

const libName = name.replace(/\.js$/, '');

export default {
  input: 'src/index.js',
  output: [
    {
      format: 'cjs',
      file: `dist/${libName}.common.js`
    },
    {
      format: 'es',
      file: `dist/${libName}.module.js`
    }
  ],
  external: Object.keys(dependencies),
  plugins: [
    babel()
  ]
};