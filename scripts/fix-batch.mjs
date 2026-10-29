#!/usr/bin/env node
// Katta qo'shma partiyadan keyin ma'lumotlarni tozalovchi skript:
//  - tr uzunligi 40 dan oshmasin, tadil nomlarini xaritada tuzatish
//  - naqadar notaqlik toast bo'lsa ham vazifasi shart bo'lsa tasdiq so'raydi
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'data');
const TR_RE = /^[a-zA-ZçğıöşüÇĞİÖŞÜîâİÂÎ' .,!?-]{1,45}$/;
const fixes = { // noto'g'ri tr -> to'g'ri [tr, uz]
  'kamera agani qoy': ['kamera', 'kamera'],
  'fayl': ['dosya', 'fayl'],
  'tıbbaş': null,
};
for (const f of readdirSync(dir).filter(f => f.endsWith('.jsonl') && !f.startsWith('idiom') && !f.startsWith('falsefriends'))) {
  const p = join(dir, f);
  const out = [];
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const s = line.trim();
    if (!s) continue;
    let o; try { o = JSON.parse(s); } catch { console.log(`DROP ${f}: badjson`); continue; }
    const trn = (o.tr || '').trim();
    if (!TR_RE.test(trn)) {
      if (Object.prototype.hasOwnProperty.call(fixes, trn)) {
        const fx = fixes[trn];
        if (!fx) { console.log(`DROP ${f}: junk tr: ${trn}`); continue; }
        o.tr = fx[0]; if (fx[1]) o.uz = fx[1];
      } else { console.log(`DROP ${f}: junk tr: ${trn}`); continue; }
    }
    if (!o.uz || !o.pos) { console.log(`DROP ${f}: empty uz: ${trn}`); continue; }
    out.push(JSON.stringify({ tr: o.tr, uz: o.uz, pos: o.pos }));
  }
  writeFileSync(p, out.join('\n') + (out.length ? '\n' : ''));
  console.log(`SAVED ${f}: ${out.length}`);
}
