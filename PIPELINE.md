# Pipeline CI + deploy — game platformer 2D

## Pilihan deploy

**GitHub Pages**, bukan Vercel. Alasan: v1 tanpa server, build Next.js statis (`output: 'export'`), dan Pages tidak butuh token/akun tambahan — autentikasi pakai OIDC (`id-token: write`), jadi tidak ada secret di repo.

## Isi

| File | Fungsi |
|---|---|
| `.github/workflows/ci.yml` | PR + push main: `npm ci` → `npm run check` → gate export → `npm run build`; deploy Pages hanya dari push main setelah build lulus |
| `scripts/ci-local.sh` | gate yang sama di laptop, satu perintah |
| `scripts/verify-static-export.mjs` | gagal kalau `next.config.*` tidak bisa jadi situs statis |
| `pipeline/ci-workflow.test.mjs` | tes yang membaca workflow dan mengunci kontraknya |

## Kontrak untuk Ravi

`package.json` wajib punya:

```json
"scripts": { "check": "tsc --noEmit && eslint .", "build": "next build" }
```

`package-lock.json` wajib ikut di-commit, karena pipeline memakai `npm ci`.

`next.config.ts` wajib:

```ts
output: 'export',
basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? undefined,
```

`NEXT_PUBLIC_BASE_PATH` diisi workflow otomatis dari nama repo (`/<repo>`), karena Pages menyajikan project site di sub-path. Tanpa ini, game terbuka tapi aset 404.

## Status deploy

- Situs live: https://nagamancayy.github.io/lari-kilat/
- Repo: https://github.com/Nagamancayy/lari-kilat (publik — Pages gratis butuh repo publik)
- Run hijau: https://github.com/Nagamancayy/lari-kilat/actions/runs/43566106096 — job `Check and build` dan `Deploy to GitHub Pages` sama-sama `success`

## Cara membuktikan

```bash
node --test pipeline/          # kontrak workflow + gate export
bash scripts/ci-local.sh       # gate penuh: npm ci, check, gate export, build
gh run watch --exit-status     # pantau run terakhir sampai selesai
```

Pages sudah aktif dengan Source = **GitHub Actions**; tidak perlu klik apa pun lagi.

## Batasan

- Gate lokal belum pernah lulus utuh: tes game/QA di `npm test` belum saya jalankan, dan `ci-local.sh` butuh `package-lock.json` yang kini sudah ada. Status terakhir: `npm run check` lulus, `npm run build` lulus dengan `NEXT_PUBLIC_BASE_PATH=/lari-kilat`.
- Build gagal sebelum saya ubah impor `.js` → `.ts` di `lib/game/engine.ts` dan `lib/game/catalog.ts` (Turbopack). Itu file Ravi, perlu review-nya.
- Tag action dipin ke versi mayor (`@v7`, `@v5`), bukan SHA. Kalau repo publik ini dipakai jangka panjang, pertimbangkan pin ke SHA penuh.
- Node 22 di runner; tes lokal di mesin ini memakai Node 26.
- Belum ada cache Playwright/e2e — belum relevan sampai tes Ivan masuk.
