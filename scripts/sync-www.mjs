#!/usr/bin/env node
/** index.html, app.js va sozluk_data.json ni www/ ga nusxalaydi (Capacitor webDir). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const www = join(root, 'www');
mkdirSync(www, { recursive: true });

const files = ['index.html', 'app.js', 'sozluk_data.json'];
for (const f of files) {
  try {
    const src = readFileSync(join(root, f));
    writeFileSync(join(www, f), src);
    console.log('OK:', f, `(${(src.length/1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error('XATO:', f, e.message);
    process.exit(1);
  }
}
console.log('www/ tayyor');
