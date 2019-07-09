import resolve from 'rollup-plugin-node-resolve';
import commonJs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { name, homepage, version } from './package.json';

const libName = name.replace(/\.js$/, '');

export default {
  input: 'src/index.js',
  output: [
    {
      format: 'umd',
      name: 'Ip',
      file: `dist/${libName}.js`,
      sourcemap: true,
      banner: `// Version ${version} ${name} - ${homepage}`
    }
  ],
  plugins: [
    babel({ exclude: 'node_modules/**' }),
    resolve({ browser: true }),
    commonJs()
  ]
};
