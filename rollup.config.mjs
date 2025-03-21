import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from "@rollup/plugin-terser";
import dts from 'rollup-plugin-dts';

import pkg from './package.json' with { type: 'json' };
const { name, homepage, version, dependencies } = pkg;

const libName = name.replace(/\.js$/, '');

const umdConf = {
  format: 'umd',
  name: 'Ip',
  banner: `// Version ${version} ${name} - ${homepage}`
};

export default [
  {
    input: 'src/index.js',
    output: [
      {
        ...umdConf,
        file: `dist/${libName}.js`,
        sourcemap: true,
      },
      { // minify
        ...umdConf,
        file: `dist/${libName}.min.js`,
        plugins: [terser({
          output: { comments: '/Version/' }
        })]
      }
    ],
    plugins: [
      babel({ exclude: 'node_modules/**' }),
      resolve({ browser: true }),
      commonJs()
    ]
  },
  { // commonJs and ES modules
    input: 'src/index.js',
    output: [
      {
        format: 'cjs',
        file: `dist/${libName}.common.js`,
        exports: 'auto'
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
  },
  { // expose TS declarations
    input: 'src/index.d.ts',
    output: [{
      file: `dist/${libName}.d.ts`,
      format: 'es'
    }],
    plugins: [dts()],
  }
];