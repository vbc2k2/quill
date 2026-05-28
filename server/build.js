#!/usr/bin/env node
const esbuild = require('esbuild');
const path = require('path');

const outfile = path.resolve(__dirname, '..', 'prototypes', 'vendor', 'quill-deps.js');

esbuild.build({
  entryPoints: [path.resolve(__dirname, 'vendor-entry.js')],
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  outfile,
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
}).then(() => {
  console.log('built', outfile);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
