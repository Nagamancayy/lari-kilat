# Tes otomatis v1 — game platformer 2D

Pemilik: Ivan. Jalan lewat perintah tes yang sudah ada, bukan runner kedua: `npm test` → `node --test qa/`.

## Yang diuji sekarang

| Berkas | Cakupan |
|---|---|
| `qa/level-contract.test.mjs` | Validasi level: spawn dan goal di dalam batas, platform, coin bernilai positif, aset ada, nomor level urut, skor bertambah sebesar nilai coin |
| `qa/score-contract.test.mjs` | Game over menyimpan skor lokal di key `platformer2d.bestScore` (`{"best":N}`), rekor tidak turun, data rusak/storage penuh tidak bikin crash |
| `qa/level-files.test.mjs` | Level sungguhan di `levels/` + `assets/`; **di-skip** selama folder itu belum ada |

`qa/fixtures/` berisi dua level contoh dan dua aset kecil untuk mengunci bentuk data.

## Kontrak yang diminta dari Arif/Ravi

- `levels/level-NN.json`, isi: `id`, `name`, `width`, `height`, `spawn{x,y}`, `goal{x,y}`, `platforms[{x,y,width,height}]`, `coins[{x,y,value}]`, `background`, `tileset`.
- `background`/`tileset` path relatif mulai `assets/`, dan filenya benar-benar ada.
- Level tanpa coin gagal tes, karena skor tidak bisa bertambah saat main (MAIN-09).

Bentuk ini (asumsi) — perlu dikonfirmasi Arif sebelum dipakai sebagai kontrak resmi.

## Belum bisa diuji

Menu terbuka, pilih level, main, game over **di browser** butuh build Ravi. Belum ada `levels/`, `assets/`, atau `src/` di folder proyek, jadi 3 tes `level-files` di-skip dan e2e browser belum dibuat.

## Kurang di sisi Dimas

`.github/workflows/ci.yml` belum memanggil `npm test`, jadi tes ini belum jadi gate CI.
