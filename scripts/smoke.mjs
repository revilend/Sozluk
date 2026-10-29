#!/usr/bin/env node
// Ilova UI sinovi (brauzersiz): JSDOM bilan www/index.html yuklab, qidiruvni tekshiradi
// app.js ni <script> sifatida HTML ga kiritamiz — real brauzerdagidek bir muhitda ishlaydi
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const html0 = await readFile(join(process.cwd(), 'www/index.html'), 'utf8');
const appjs = await readFile(join(process.cwd(), 'www/app.js'), 'utf8');
const html = html0.replace('</body>', '<script>' + appjs + '</scr' + 'ipt></body>');

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/' });
const { window } = dom;
const doc = window.document;

await new Promise(r => setTimeout(r, 100));

let fails = 0;
function check(name, cond) {
  console.log((cond ? 'PASS ' : 'FAIL ') + name);
  if (!cond) fails++;
}
check('TURKUZ yuklandi', !!window.TURKUZ);
check('lower global bor', typeof window.lower === 'function');

const res = doc.getElementById('search-results');

// 1) 'abla' qidiruvi
const fire = (id, ev) => { const el = doc.getElementById(id); if (el) el.dispatchEvent(new window.Event(ev, { cancelable: true, bubbles: true })); };
doc.getElementById('search-input').value = 'abla';
fire('search-form', 'submit');
await new Promise(r => setTimeout(r, 30));
check("'abla' -> opa topildi", /opa/.test(res.innerHTML));

// 2) bo'sh so'rov
doc.getElementById('search-input').value = '';
fire('search-form', 'submit');
await new Promise(r => setTimeout(r, 30));
check("bo'sh so'rovda ro'yxat bor", /class="stats">/.test(res.innerHTML));

// 3) morfologik tahlil
doc.getElementById('morph-input').value = 'kitabı';
fire('morph-form', 'submit');
await new Promise(r => setTimeout(r, 30));
check('morfologik tahlil chiqdi', /kitab|kitob|Ildiz/.test(doc.getElementById('morph-results').innerHTML));

// 4) tarjima
doc.getElementById('src-text').value = 'abla gelmek';
doc.getElementById('btn-tr-uz').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
await new Promise(r => setTimeout(r, 30));
check('tarjima natijasi chiqdi (inline bazasida)', /opa/.test(doc.getElementById('tr-out').innerHTML));

// 5) tig'iz tablar
check("yolg'on do'stlar ro'yxati", /bardak/.test(doc.getElementById('ff-list').innerHTML));
check("idiomlar ro'yxati", /gözden|e'tibor/.test(doc.getElementById('idiom-list').innerHTML));

console.log(fails ? `FAILS: ${fails}` : 'ALL PASS');
process.exit(fails ? 1 : 0);
