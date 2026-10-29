#!/usr/bin/env node
/**
 * data/*.jsonl fayllaridan sozluk_data.json yig'adi va validatsiya qiladi.
 * Har bir yozuv JSON obyekt bo'lishi kerak: { tr, uz, pos, ph, exTr, exUz }
 * Yolg'onchi do'stlar: { tr, uz, notTr, notUz, note }
 * Idiomlar: { tr, uz, exTr, exUz }
 * Ishga tushirish: npm run build:data
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dataDir = join(root, 'data');

const sozlukFields = ['tr', 'uz', 'pos', 'ph', 'exTr', 'exUz'];
const sozlukCats = ['aot', 'fel', 'sifat', 'ravish', 'suzlashuv', 'biznes', 'tibbiyot', 'texno'];

function readJsonl(file) {
  const raw = readFileSync(file, 'utf8');
  const items = [];
  for (const [i, line] of raw.split('\n').entries()) {
    const s = line.trim();
    if (!s) continue;
    try {
      items.push(JSON.parse(s));
    } catch (e) {
      throw new Error(`${file}/${i + 1}: invalid JSON — ${e.message}`);
    }
  }
  return items;
}

let entries = [], idioms = [], falseFriends = [];
for (const f of readdirSync(dataDir).sort()) {
  if (!f.endsWith('.jsonl')) continue;
  const path = join(dataDir, f);
  if (f.startsWith('idiom')) idioms.push(...readJsonl(path));
  else if (f.startsWith('falsefriends')) falseFriends.push(...readJsonl(path));
  else entries.push(...readJsonl(path));
}

// ---- Validation ----
const errors = [];
const trKeys = new Set();
for (const [i, it] of entries.entries()) {    for (const f of ['tr', 'uz']) if (!it[f] || typeof it[f] !== 'string') errors.push(`entry[${i}] (${it.tr || '?'}): missing/bad field "${f}"`);
    if (it.ph && typeof it.ph !== 'string') errors.push(`entry[${i}]: bad "ph"`);
    for (const f of ['exTr', 'exUz']) if (it[f] && typeof it[f] !== 'string') errors.push(`entry[${i}]: bad "${f}"`);
  if (!it.tr || !it.uz) continue;
  if (sozlukCats.length && !sozlukCats.includes(it.pos)) errors.push(`entry[${i}]: unknown pos "${it.pos}"`);
  const key = `${it.tr.toLowerCase()}|${it.pos}`;
  if (trKeys.has(key)) errors.push(`entry[${i}]: duplicate tr+pos ${key}`);
  trKeys.add(key);
}
for (const [i, it] of falseFriends.entries()) {
  for (const f of ['tr', 'uz', 'notUz', 'note']) if (!it[f]) errors.push(`falseFriends[${i}]: missing "${f}"`);
}
for (const [i, it] of idioms.entries()) {
  for (const f of ['tr', 'uz', 'exTr', 'exUz']) if (!it[f]) errors.push(`idioms[${i}]: missing "${f}"`);
}
if (errors.length) {
  console.error(`BUILD FAILED — ${errors.length} xato:`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

// ---- Assemble ----
const out = {
  meta: {
    name: "TurkUz DilKo'prik sozluk bazasi",
    builtBy: 'scripts/build-data.mjs',
    counts: {
      entries: entries.length,
      idioms: idioms.length,
      falseFriends: falseFriends.length,
      byPos: entries.reduce((m, e) => ((m[e.pos] = (m[e.pos] || 0) + 1), m), {})
    }
  },
  sozluk: entries,
  idioms,
  falseFriends
};
mkdirSync(root, { recursive: true });
writeFileSync(join(root, 'sozluk_data.json'), JSON.stringify(out, null, 0) + '\n');
console.log(`OK: sozluk=${entries.length}, idioms=${idioms.length}, falseFriends=${falseFriends.length}`);
console.log('byPos:', JSON.stringify(out.meta.counts.byPos));
