"use strict";
window.TURKUZ = {};
(function(){
const el=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const lower=s=>String(s||'').toLowerCase();
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
TURKUZ.el=el;TURKUZ.esc=esc;TURKUZ.lower=lower;TURKUZ.cap=cap;
})();
// ==================== Turkiy morfologiya: qo'shimchalar jadvali ====================
TURKUZ.MORPH = (function(){
  // Har bir morfema: {t:[variantlar], tr:'nomi', uz:'uzbekcha''dagi ko''rinishi', kind:'qushimcha turi'}
  const NOUN=[
    {t:['lar','ler'],tr:  'ko\'plik',       uz:'-lar', kind:"o1"},
    {t:['im','ım','um','üm'],tr:'1shax egalik',uz:'-im',kind:"o2"},
    {t:['in','ın','un','ün'],tr:'2shax egalik',uz:'-ing',kind:"o2"},
    {t:['i','ı','si','sı'],tr:'3shax egalik',uz:'-i/-si',kind:"o2"},
    {t:['imiz','ımız','umuz','ümüz'],tr:'1j egalik',uz:'-imiz',kind:"o2"},
    {t:['iniz','ınız','unuz','ünüz'],tr:'2j egalik',uz:'-ingiz',kind:"o2"},
    {t:['lari','leri'],tr:'3j egalik(ko\'p)',uz:'-lari',kind:"o2"},
    {t:['dan','den','tan','ten'],tr:'ablativ (-dan)',uz:'-dan',kind:"q3"},
    {t:['da','de','ta','te'],tr:'lokativ (-da)',uz:'-da',kind:"q3"},
    {t:['ga','ge','a','e','ka','qа'],tr:'dativ (-ga)',uz:'-ga/-qa/-ga',kind:"q3"},
    {t:['ni','nı','nu','nü'],tr:'akuzativ (-ni)',uz:'-ni',kind:"q3"},
    {t:['nin','nın','nun','nün', 'im'],tr:'genitiv (-ning)',uz:'-ning',kind:"q3"},
    {t:['la','le'],tr:'vasita (- bilan)',uz:'-bilan/- bilan',kind:"q3"}
  ];
  const VERB=[
    {t:['iyor','ıyor','üyor','uyor'],tr:'hazirgi davom (-moqda)',uz:'-yapti/-moqda',kind:"z1"},
    {t:['di','dı','du','dü','tı','ti'],tr:"anirli o'tgan (-di)",uz:'-di',kind:"z2"},
    {t:['miş','mış','müş','muş'],tr:"rivoyatiy o'tgan",uz:'-ibdi/-gan ekan',kind:"z2"},
    {t:['ecek','acak'],tr:'kelasi zamon (-adi)',uz:'-adi/-ajak',kind:"z3"},
    {t:['ebil','abil'],tr:'imkonlik (-a ol-)',uz:'-a ol-',kind:"z4"},
    {t:['eme','ama'],tr:'imkonsizlik (-a olma-)',uz:'-a olma-',kind:"z4"},
    {t:['iver'],tr:"zudlik (-ib qo'y-)",uz:"-ib qo'y-",kind:"z5"},
    {t:['dur'],tr:'davomiylik (-ib tur-)',uz:'-ib tur-',kind:"z5"},
    {t:['mek','mak'],tr:'infinitiv (-moq)',uz:'-moq',kind:"z0"}
  ];
  return {NOUN,VERB};
})();
// ==================== QOSHIMCHA PARSE: so'zni ildiz + zanjirga ajratish ====================
TURKUZ.parseWord=(function(){
  const {NOUN,VERB}=TURKUZ.MORPH;
  // yordamchi: stem lug'atda bor-yo'qligini tekshirish
  function findEntry(stem){
    const s=lower(stem);
    return allSozluk.find(e=>lower(e.tr)===s)||null;
  }
  function parse(word){
    word=String(word||'').trim();
    if(!word) return {status:'empty',stem:'',chain:[],entry:null};
    // 1) To'liq so'z bo'yicha
    let entry=findEntry(word);
    if(entry) return {status:'exact',stem:word,chain:[],entry};
    // 2) Uzunlikdan tashqi qo'shimchalarni ketmaket olib borish
    const suffixes=[...VERB,...NOUN].sort((a,b)=>Math.max(...b.t.map(x=>x.length))-Math.max(...a.t.map(x=>x.length)));
    const chain=[]; let w=word;
    let tries=0;
    while(tries<6){
      let matched=false;
      for(const s of suffixes){
        for(const v of s.t){
          if(w.length>v.length && w.toLowerCase().endsWith(v)){
            w=w.slice(0,-v.length);
            chain.push({tr:s.tr.slice(0,50),uz:s.uz,variant:v});
            try{ if(findEntry(w)) {return {status:'parsed',stem:w,chain,entry:findEntry(w)};} matched=true;
            }catch(e){}
          }
        }
      }
      if(!matched) break;
      tries++;
    }
    if(chain.length&&findEntry(w)) return {status:'parsed',stem:w,chain,entry:findEntry(w)};
    if(chain.length) return {status:'partial',stem:w,chain,entry:findEntry(w)};
    return {status:'unknown',stem:w,chain:[],entry:null};
  }
  function label(st){
    const m={exact:"Lug'atda topildi (to'liq so'z)",parsed:"Ildiz + qo'shimcha zanjiri tahlil qilindi",
             partial:"Qo'shimchalar topilgan, lekin ildiz aniq emas",unknown:"Lug'atda topilmadi",empty:"Bo'sh qoldirildi"};
    return m[st]||st;
  }
  return {parse,label,findEntry};
})();
// ==================== TARJIMA (TR -> UZ, UZ -> TR) ====================
TURKUZ.translate=(function(){
  const {parse,findEntry}=TURKUZ.parseWord;
  const falseMap=()=>{const m={};allFalse.forEach(f=>{m[lower(f.tr)]=f;});return m;};
  function idiomsHit(text){
    for(const id of allIdioms){ if(lower(text).includes(lower(id.tr))) return id; }
    return null;
  }
  function translateTrToUz(text){
    const id=idiomsHit(text); let warnings=[];
    if(id) return {uz:id.uz,warnings:[`Idioma topildi: ${id.tr} -> ${id.uz}`],idiom:id};
    const tokens=text.trim().split(/\s+/); const out=[]; let unknown=0;
    for(const tk of tokens){
      const bare=tk.replace(/[.,!?;:"()']/g,'');
      const f=falseMap()[lower(bare)];
      if(f){ out.push(f.uz); warnings.push(`Yalg'onchi do'st tilda tekshirilgan: ${bare} => ${f.uz} (${f.note})`); continue; }
      const p=parse(bare);
      if(p.status==='exact'){ out.push(p.entry.uz); continue; }
      if(p.status==='parsed'){ out.push(p.entry.uz+' '+p.chain.map(c=>c.uz).join(' ')); continue; }
      if(p.status==='partial'){ out.push(p.stem+' ('+p.chain.map(c=>c.uz).join(' ')+')'); unknown++; continue; }
      out.push(bare); unknown++;
    }
    return {uz:out.join(' '),warnings,unknown,idiom:null};
  }
  function translateUzToTr(text){
    const out=[]; let unknown=0;
    for(const tk of text.trim().split(/\s+/)){
      const bare=tk.replace(/[.,!?;:"()']/g,'');
      const found=allSozluk.find(e=>lower(e.uz)===lower(bare));
      if(found){ out.push(found.tr); continue; }
      out.push(bare); unknown++;
    }
    return {tr:out.join(' '),unknown};
  }
  async function onlineFallback(text,type){
    const langpair= type==='tr2uz'?'tr|uz':'uz|tr';
    try{
      const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`);
      const j=await r.json();
      const t=j&&j.responseData&&j.responseData.translatedText;
      return t||null;
    }catch(e){ return null; }
  }
  return {translateTrToUz,translateUzToTr,onlineFallback,idiomsHit};
})();
// ==================== UI: renderInit, tablar, qidiruv, kengaytirish ====================
function switchTab(id){
  document.querySelectorAll('main section.tab').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
  const tab=document.getElementById(id), btn=document.querySelector(`nav button[data-tab="${id}"]`);
  if(tab) tab.classList.add('active');
  if(btn) btn.classList.add('active');
}
function renderSearch(){
  const q=lower(document.getElementById('search-input').value||'').trim();
  const pos=document.getElementById('pos-filter').value||'';
  const res=document.getElementById('search-results');
  const minLen= q? Math.max(2,Math.floor(q.length*0.7)) : 0;
  let hits=[];
  if(q){ hits=allSozluk.filter(e=>pos? e.pos===pos:true).filter(e=>{
      const a=lower(e.tr), b=lower(e.uz);
      return a.includes(q)||b.includes(q)||
        (q.length>=minLen && (a.startsWith(q)||b.startsWith(q)));
  });}
  else hits=allSozluk.filter(e=>pos? e.pos===pos:true).slice(0,60);
  if(hits.length>200) hits=hits.slice(0,200);
  let html=`<div class="stats">${hits.length} natija</div>`;
  for(const e of hits){
    html+=`<div class="entry"><div class="tr">${TURKUZ.esc(e.tr)}<span class="pos">${TURKUZ.esc(e.pos||'')}</span></div>`+
      `<div class="uz">${TURKUZ.esc(e.uz)}</div>`+
      (e.src?'<small>manba: '+TURKUZ.esc(e.src)+'</small>':'')+
    `</div>`;
  }
  res.innerHTML=html||'<div class="warn">Natija topilmadi</div>';
}
function renderMorph(word){
  const res=document.getElementById('morph-results');
  const p=TURKUZ.parseWord.parse(word);
  let html=`<div class="stats">${TURKUZ.parseWord.label(p.status)}</div>`;
  html+=`<div class="morph-chain"><div class="morph-chip"><b>Ildiz</b><span>${TURKUZ.esc(p.stem)}/${p.entry?TURKUZ.esc(p.entry.uz):'??'}</span></div>`;
  for(const c of p.chain){ html+=`<div class="morph-chip"><b>${TURKUZ.esc(c.variant)}</b><span>${TURKUZ.esc(c.tr)}</span><span>${TURKUZ.esc(c.uz)}</span></div>`; }
  html+=`</div>`;
  if(p.chain.length){
    html+='<table><tr><th>Qoshimcha</th><th>Turk name</th><th>Uzbek label</th></tr>';
    for(const p2 of p.chain) html+=`<tr><td>${TURKUZ.esc(p2.variant)}</td><td>${TURKUZ.esc(p2.tr)}</td><td>${TURKUZ.esc(p2.uz)}</td></tr>`;
    html+='</table>';
  }
  return html;
}
function renderFalse(){
  const box=document.getElementById('ff-list'); let h='';
  for(const f of allFalse){
    h+=`<div class="entry"><div class="tr">${TURKUZ.esc(f.tr)} <span class="warning" style="color:var(--warn)">!</span></div>`+
       `<div class="uz">To'g'ri: <b>${TURKUZ.esc(f.uz)}</b></div>`+
       `<div style="color:var(--err)"> ${TURKUZ.esc(f.notUz||'')} emas</div>`+
       `<small>${TURKUZ.esc(f.note||'')}</small></div>`;
  }
  box.innerHTML=h;
}
function renderIdioms(){
  const box=document.getElementById('idiom-list'); let h='';
  for(const id of allIdioms){
    h+=`<div class="entry"><div class="tr">${TURKUZ.esc(id.tr)}</div><div class="uz"> => ${TURKUZ.esc(id.uz)}</div>`;
    if(id.exTr||id.exUz) h+=`<small>${TURKUZ.esc(id.exTr||'')} | ${TURKUZ.esc(id.exUz||'')}</small>`;
    h+='</div>';
  }
  box.innerHTML=h;
}
function renderCustom(){
  const box=document.getElementById('custom-list');
  const cs=allSozluk.filter(e=>e.src==='custom');
  let h=`<div class="stats">${cs.length} shaxsiy qo'shimcha so'z</div>`;
  for(const c of cs){
    h+=`<div class="entry"><div class="tr">${TURKUZ.esc(c.tr)}<span class="pos">${TURKUZ.esc(c.pos||'')}</span></div><div class="uz">${TURKUZ.esc(c.uz)}</div></div>`;
  }
  box.innerHTML=h;
}
function renderInit(){
  renderFalse(); renderIdioms(); renderCustom(); renderSearch();
  document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{
    switchTab(b.dataset.tab); renderInit();
  }));
  document.getElementById('search-form').addEventListener('submit',ev=>{ev.preventDefault();renderSearch();});
  document.getElementById('search-input').addEventListener('input',renderSearch);
  document.getElementById('pos-filter').addEventListener('change',renderSearch);
  document.getElementById('morph-form').addEventListener('submit',ev=>{
    ev.preventDefault(); const w=document.getElementById('morph-input').value.trim();
    document.getElementById('morph-results').innerHTML=renderMorph(w);
  });
  document.getElementById('btn-tr-uz').addEventListener('click',async()=>{
    const t=document.getElementById('src-text').value.trim(); if(!t) return;
    const r=TURKUZ.translate.translateTrToUz(t);
    let h=`<div class="entry" style="margin-top:14px"><div class="uz">${TURKUZ.esc(r.uz)}</div></div>`;
    document.getElementById('tr-out').innerHTML=h;
    document.getElementById('tr-warn').innerHTML=(r.warnings||[]).map(w=>`<div class="warn">${TURKUZ.esc(w)}</div>`).join('');
    const cb=document.getElementById('online-fallback');
    if(cb&&cb.checked){ const on=await TURKUZ.translate.onlineFallback(t,'tr2uz');
      if(on){ document.getElementById('tr-out').innerHTML+=`<div class="card" style="margin-top:10px"><b>Onlayn (MyMemory):</b> ${TURKUZ.esc(on)}</div>`; }
    }
  });
  document.getElementById('btn-uz-tr').addEventListener('click',()=>{
    const t=document.getElementById('src-text').value.trim(); if(!t) return;
    const r=TURKUZ.translate.translateUzToTr(t);
    document.getElementById('tr-out').innerHTML=`<div class="entry" style="margin-top:14px"><div class="tr">${TURKUZ.esc(r.tr)}</div></div>`;
  });
  document.getElementById('addform').addEventListener('submit',async ev=>{
    ev.preventDefault();
    const tr=document.getElementById('new-tr').value.trim(),
          uz=document.getElementById('new-uz').value.trim(),
          pos=document.getElementById('new-pos').value;
    if(!tr||!uz) return;
    allSozluk.push({tr,uz,pos,src:'custom'});
    const cs=await window.FREE_BUFFER.getWords()||[];
    cs.push({tr,uz,pos});
    await window.FREE_BUFFER.saveWords(cs);
    document.getElementById('new-tr').value=''; document.getElementById('new-uz').value='';
    renderCustom(); renderSearch();
    alert('Sözlükga qo\'shildi!');
  });
  document.getElementById('btn-import').addEventListener('click',()=>document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change',async ev=>{
    const f=ev.target.files[0]; if(!f) return;
    try{ const data=JSON.parse(await f.text());
      let words=data.sozluk||data;
      if(!Array.isArray(words)) throw new Error('JSON formatda sozluk ro\'yxati bo\'lishi kerak');
      const cs=await window.FREE_BUFFER.getWords()||[];
      words.forEach(w=>{ if(w.tr&&w.uz){ allSozluk.push({tr:String(w.tr),uz:String(w.uz),pos:w.pos||w.category||'',src:'custom'}); cs.push({tr:String(w.tr),uz:String(w.uz),pos:w.pos||''}); } });
      await window.FREE_BUFFER.saveWords(cs);
      renderCustom(); renderSearch();
      alert(words.length+' so\'z JSON import qilindi');
    }catch(e){ alert('Importda xato: '+e.message); }
  });
  document.getElementById('btn-export').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({sozluk:allSozluk,idioms:allIdioms,falseFriends:allFalse},null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='turkuz-dilkoprik-sozluk.json'; a.click();
  });
  document.getElementById('btn-delete-all').addEventListener('click',async()=>{
    if(!confirm('Barcha shaxsiy so\'zlarni o\'chirilsinmi?')) return;
    await window.FREE_BUFFER.saveWords([]);
    return;
  });
}
// ==================== MA'LUMOT BAZASINI YUKLASH (sozluk_data.json) ====================
async function loadSozlukJSON(){
  try{
    const r=await fetch('sozluk_data.json');
    if(!r.ok) return;
    const d=await r.json();
    (d.sozluk||[]).forEach(w=>{
      const exists=allSozluk.some(e=>lower(e.tr)===lower(w.tr)&&lower(e.uz)===lower(w.uz));
      if(!exists) allSozluk.push({...w,src:'json'});
    });
    (d.idioms||[]).forEach(i=>{
      if(!allIdioms.some(x=>lower(x.tr)===lower(i.tr))) allIdioms.push({...i,src:'json'});
    });
    (d.falseFriends||[]).forEach(f=>{
      if(!allFalse.some(x=>lower(x.tr)===lower(f.tr))) allFalse.push({...f,src:'json'});
    });
  }catch(e){ /* offline: inline bazasi ishlaydi */ }
}
window.addEventListener('load', () => {
  loadSozlukJSON().then(()=>{ renderInit(); });
});
