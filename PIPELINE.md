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

## Cara membuktikan

```bash
node --test pipeline/          # kontrak workflow + gate export
bash scripts/ci-local.sh       # gate penuh, butuh package.json dari Ravi
```

Sekali saja di GitHub: Settings → Pages → Source = **GitHub Actions**.

## Batasan

- `npm ci`/`check`/`build` belum pernah dijalankan. `package.json` yang ada sekarang hanya berisi skrip tes QA (`node --test qa/`), belum `check`/`build` dari Ravi; gate lokal berhenti di pengecekan itu.
- `act` dan `actionlint` tidak terpasang di mesin ini, jadi workflow belum dijalankan di runner sungguhan. Tes membaca YAML-nya, bukan mengeksekusinya.
- Tag action dipin ke versi mayor (`@v4`), bukan SHA. Kalau repo dibuat publik nanti, pertimbangkan pin ke SHA penuh.
- Belum ada cache Playwright/e2e — belum relevan sampai tes Ivan masuk.
