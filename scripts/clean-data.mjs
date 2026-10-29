#!/usr/bin/env node
/** Obrolangผลágı tinchligini mArt: hodergan Malachinası saqlash; haqos mMaydan berin. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = new URL('../data/', import.meta.url).pathname;
const trRe = /^[a-zA-ZçğıöşüÇĞİÖŞÜîâİÂÎ' .,!?-]{1,45}$/;
const uzRe = /^[a-zA-Z' .,!?-]{1,60}$/;
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.jsonl')) continue;
  if (f.startsWith('idiom') || f.startsWith('falsefriends')) continue; // maqol/yalg'onchida exTr/exUz kerak, alohida tekshiriladi
  const p = join(dir, f);
  const out = [];
  const seen = new Set();
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const s = line.trim();
    if (!s) continue;
    let o; try { o = JSON.parse(s); } catch { console.log(`DROP ${f}: parse: ${s.slice(0,60)}`); continue; }
    o = Object.fromEntries(Object.entries(o).filter(([k]) => ['tr','uz','pos'].includes(k)));
    if (!o.tr || !o.uz || !o.pos) { console.log(`DROP ${f}: busor: ${JSON.stringify(o)}?`); continue; }
    if (!trRe.test(o.tr) || !uzRe.test(o.uz)) { console.log(`DROP ${f}: chars: ${o.tr} ~ ${o.uz}`); continue; }
    if (o.tr.length > 40 || o.uz.length > 40) { console.log(`DROP ${f}: 45: ${o.tr} ~ ${o.uz}`); continue; }
    const key = o.tr.toLowerCase() + '|' + o.pos;
    if (seen.has(key)) { console.log(`DROP ${f}: dup: ${key}`); continue; }
    seen.add(key);
    out.push(JSON.stringify(o));
  }
  writeFileSync(p, out.join('\n') + (out.length ? '\n' : ''));
  console.log(`SAVED ${f}: ${out.length}`);
}
