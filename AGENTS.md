# AGENTS.md — TurkUz DilKo'prik

Bu repozitoriyda ishlayotgan har bir AI agent quyidagi qoidalarga rioya qilishi shart.

| Modul | Talab va Qoida | Texnik Amalga Oshirish |
| :--- | :--- | :--- |
| Til juftligi | Faqat Turkcha ↔ O'zbekcha; endi maqsad: ingliz tili vositachiligisiz (NO ENGLISH PIVOT) | `parseTurkishAffixes`, `translateTrToUz`, `translateUzToTr` ichida ildiz va qo'shimchalarni to'g'ridan-to'g'ri morfema xaritasi orqali o'girish |
| Yolg'onchi do'stlar | Tovushdosh so'zlarni hech qachon xato o'girmaslik | `falseFriends` bazasi filtrda: `bardak`(stakan), `tabak`(likopcha), `koltuk`(kreslo), `konushmak`(gaplashmoq), `hemen`(darhol) |
| Sozluk buferi (FreeBuffer) | Internet yo'q bo'lsa ham ilova to'liq ishlash | `DEFAULT_SOZLUK` (index.html ichida inline fallback) + `sozluk_data.json` + `localStorage` / `IndexedDB` sinxronizatsiyasi |
| Android APK | Har push ga avtomatik APK yig'ish | Capacitor 6 + Java 17 (Temurin) + `./gradlew assembleDebug` → workflow artifact `TurkUz-DilKoprik-APK` |
| Maqol va idiomalar | So'zma-so'z kalka emas, tabiiy o'zbekcha maqol ekvivalentlari | `idioms` bazasi `exTr` / `exUz` misollari bilan |
| Morfologik tahlil | "Morfologik Tahlil" tabida ko'rsatish shart | `analyzeMorphology()` — ildiz va qo'shimcha zanjirini uzbek grammatik belgilari bilan jadvalda |
| Lug'at kengaytmasi | Har bir yozuv: `{ tr, uz, pos, ph, exTr, exUz }` formatida | Yangi so'zlar `data/*.jsonl` ga qo'shilib, `npm run build:data` bilan `sozluk_data.json` yig'iladi |
| Fayl sinxronizatsiyasi | `index.html` va `www/index.html` mazmuni har doim bir xil | Har bir o'zgartirishdan keyin `npm run sync:www` |

## Repozitoriy strukturasi

- `index.html` — asosiy ilova (tashqi kutubxonasiz, o'z-o'zini yopilgan)
- `www/index.html` — Capacitor webDir; `index.html`ning aynan nusxasi
- `sozluk_data.json` — keng lug'at bazasi (birinchi ishga tushishda IndexedDB ga yuklanadi)
- `data/*.jsonl` — lug'at manba yozuvlari (kategoriyalar bo'yicha; har bir yozuv alohida qator)
- `scripts/build-data.mjs` — `data/*.jsonl` dan `sozluk_data.json` yig'adi va validatsiya qiladi
- `scripts/sync-www.mjs` — `index.html` ni `www/index.html` ga nusxalaydi
- `capacitor.config.json`, `package.json`, `.github/workflows/build-apk.yml` — APK qurish uchun

## Morfologik qoidalari

- Türkçe ünsüz yumuşaması (ünsüz yumshash): `kitap → kitabı`, `ağaç → ağacı`, `sokak → sokağa`, `yurt → yurdu`.
- Türkçe ünlü düşmesi (ünlü tushishi): `burun → burnu`, `akıl → aklı`, `şehir → şehri`.- Compound verb suffixes: `-abilmek/-ebilmek` → `-a ol-` (`gelebilir` → `kela oladi`), `-amamak/-ememek` → `-a olma-`, `-ivermek` → `-ib qo'ymoq`, `-adurmak` → `-ib turmoq`. 

## Tarjima

- Lokal morfologik qoidalar + idiomlar + False Friends post-protsessor doim qo'llanadi.
- To'liq gap tarjimasi uchun bepul onlayn API (MyMemory) faqat mahalliy qoidalar yetmagan hollarda iste'mol qilinadi va natija baribir False Friends filtidan o'tadi.
