import babel from '@rollup/plugin-babel';

export default {
  input: '.adminjs/entry.js',
  output: {
    file: '.adminjs/bundle.js',
    format: 'iife',
    sourcemap: false,
  },
  plugins: [
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env', '@babel/preset-react'],
    }),
  ],
};
