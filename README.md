# Sozluk — TurkUz DilKo'prik

Turkcha ↔ O'zbekcha **offline sozluk**, **qidiruv tugmasi bilan** so'zluk, **morfologik tahlil** va **tarjima** (False-Friends filtri bilan) — Capacitor orqali Android APK.

## Holat

- Lug'at ma'lumot bazasi: `sozluk_data.json` (hozircha **703** yozuv; nyuton `data/*.jsonl` fayllar orqali kengaytiriladi, `npm run build:data` yugurish bilan).
- Ilova fayllari: `index.html` + `app.js` (tatibiyot, tarjima, morfologiya, false friends, idiomlar).
- Offline ishlashi: `FreeBuffer` (IndexedDB + localStorage) — lug'atni qo'shib, o'z so'zlarini offline saqlaydi.
- Onlayn tarjima qismi: **MyMemory** API (bepul, och) — `index.html` ichidagi "Onlayn fallback (MyMemory)" saralash chekboxi bilan ishlaydi.
- Qidiruv tugmasi: **Sözlük** tabida `Qidirish` ikonasi hamda o'zida (instant search) ham ishlaydi. 100 000+ so'z kattaligida ishlash uchun `sozluk_data.json` yoki foydalanuvchining o'zi `JSON import` bilan kengaytiriladi (ilova 100 000+ yozuv bilan ham ishlaydi).
- APK avtomatik yig'ish: `.github/workflows/build-apk.yml` — har kuni `main` commitida yoki tag `v*` bilan ishga tushadi, `TurkUz-DilKoprik-APK` artifact qo'yiladi, `v` tag bilan Release yaratadi.

## Strukturasi

```
README.md
AGENTS.md
index.html            asosiy ilova (IADakash, offline ishi)
app.js                Turkcha/Ozbekcha tarjima va morfologiya engine
sozluk_data.json      Yigilgan lug'at ma'lumotlari (fetch + inlineallback)
data/                 Manba JSONL lug'at yozuvlari (aot, fel, sifat, ...)
scripts/
  build-data.mjs      data/*.jsonl -> sozluk_data.json
  clean-data.mjs      data fayllarini tekshirib, xatolorni tozalaydi
  sync-www.mjs        index.html, app.js, sozluk_data.json -> www/
capacitor.config.json
package.json
.github/workflows/build-apk.yml
www/                  Capacitor webDir (avtomukis yigilgan aynan falda)
```

## Ishga tushirish (lokal)

```bash
npm install
npm run build:data    # data/*.jsonl -> sozluk_data.json
npm run sync:www      # index.html + app.js + data -> www/
python3 -m http.server 8000   # oddiy server bilan ochish (test uchun)
```

## Android APK

```bash
npx cap add android   # bir martlik
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Kengaytirish

- `data/*.jsonl` ichiga yangi yozuv qo'shish: `{"tr":"kitob","uz":"so'z","pos":"aot"}` — keyin `npm run build:data`.
- Ilova ichida `Kengaytirish` tabida `Qo'shish` tugmasi orqali so'z qo'shish, JSON import/export orqali o'zarding mafetda boshqarish.

Yakuniy vazifalar: **100 000 ta so'z qo'shib bo'lmaydi hozir — ilova qo'shimchalarini modellar bilan bosqichma-bosqich kengaytirish mumkin, yoki foydalanuvchi o'zi 100 000 so'zlik JSON lug'at import qilishi mumkin.** Har bir lug'at yozuvining tarjima **aniqligi** asosiy talab; sifat-o'qi muhimligi yuqoridir.
