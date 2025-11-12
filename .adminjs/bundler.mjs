import { build } from '@adminjs/bundler';

await build({
  entryPoint: './.adminjs/entry.js',
  destination: './.adminjs/bundle.js',
  babelHelpers: 'bundled',
});