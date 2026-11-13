# assets/

Semua gambar runtime ada di sini. `npm run dev` dan `npm run build` menyalin folder ini
ke `public/assets/` lewat `scripts/sync-assets.mjs`; `public/assets/` tidak di-commit.

| File | Dipakai untuk |
|---|---|
| `sky-meadow.svg`, `sky-dusk.svg`, `sky-summit.svg` | latar level 1–3 |
| `tiles.svg` | tekstur petak (cadangan) |
| `coin.svg` | koin |
| `cloud.svg` | awan paralaks |
| `flag.svg` | bendera finis |
| `spring.svg` | pegas |

Nama file dirujuk dari `levels/*.json` (`background`, `tileset`). Kalau file hilang,
engine memakai gambar cadangan berbentuk vektor supaya level tetap bisa dimainkan.
