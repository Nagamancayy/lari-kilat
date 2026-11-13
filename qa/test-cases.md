# Test Case Manual v1 — Game Platformer 2D Web

Pemilik: Fajar (QA manual). Penerima: Ivan (otomasi), Rani (putusan GO/HOLD).

## Status bukti

Folder proyek saat file ini ditulis hanya berisi `.git` (hasil `ls -la`). Tidak ada build, tidak ada
`npm run dev` yang pernah dijalankan di sesi ini. Karena itu **seluruh baris berstatus
`belum diverifikasi`** — belum ada satu pun langkah yang dieksekusi di browser.

Kriteria terima terukur dari Arya **belum ada di folder proyek**. Daftar di bawah adalah usulan saya
dari notulen kickoff; ID-nya sementara dan akan dipetakan ulang begitu dokumen Arya masuk.

## Daftar kriteria (usulan, menunggu Arya)

| ID | Kriteria | Sumber |
|---|---|---|
| AC-P01 | Menu bisa dipakai tanpa login dan tanpa prompt izin browser | notulen + prinsip produk |
| AC-P02 | Empat layar ada dan bisa dicapai: menu, pilih level, main, game over | notulen (lingkup v1) |
| AC-P03 | Menu → pilih level dengan keyboard dan dengan mouse | notulen (loop inti) |
| AC-P04 | Pilih level → layar main memuat level yang dipilih | notulen (loop inti) |
| AC-P05 | Kontrol keyboard: kiri, kanan, lompat (tombol final belum ditetapkan) | notulen |
| AC-P06 | Loop inti: capai tujuan = level selesai; jatuh/kena hazard = game over | notulen |
| AC-P07 | Game over menampilkan skor akhir + aksi main lagi dan kembali ke menu | notulen (4 layar) |
| AC-P08 | Skor tersimpan lokal dan tetap ada setelah app/tab ditutup | notulen (tanpa server) |
| AC-P09 | Tetap bisa main setelah jaringan dimatikan (v1 tanpa server) | notulen |
| AC-P10 | Target frame rate saat main — angkanya belum ada dari Bos (asumsi 60) | notulen (pertanyaan untuk Bos) |
| AC-P11 | Jumlah level v1 — angkanya belum ada dari Bos (asumsi 3) | notulen (pertanyaan untuk Bos) |

## Kontrol yang diasumsikan (belum diverifikasi)

| Aksi | Tombol (asumsi) |
|---|---|
| Gerak kiri / kanan | `ArrowLeft` / `ArrowRight` |
| Lompat | `Space` |
| Pause | `Esc` |
| Pilih menu / level | `Enter` |

Bila Ravi memakai pemetaan lain, kolom Langkah harus disesuaikan — cukup ganti nama tombol, struktur
langkah tetap.

## Data uji

- Browser: Chrome terbaru (asumsi satu-satunya target v1), DevTools terbuka.
- Viewport: 360x640 (ponsel), 1280x720 (laptop), 1920x1080 (desktop).
- Storage: Application → Local Storage, cek key skor.
- Skor uji: biarkan apa adanya dari permainan; jangan dikarang.

## Tabel test case

| ID | Layar | Prasyarat | Langkah | Hasil yang diharapkan | AC | Status |
|---|---|---|---|---|---|---|
| MNU-01 | menu | Build v1 jalan, URL root dibuka di Chrome | 1) Muat URL root<br>2) Tunggu halaman selesai dimuat<br>3) Amati layar | Layar menu tampil dengan judul game dan minimal satu aksi mulai; tidak ada layar putih kosong | AC-P02 | belum diverifikasi |
| MNU-02 | menu | MNU-01 lulus, mouse tidak dipakai | 1) Tekan `Tab` berulang<br>2) Amati indikator fokus<br>3) Tekan `Enter` saat fokus di aksi mulai | Fokus terlihat berpindah antar item; `Enter` membuka layar pilih level | AC-P03 | belum diverifikasi |
| MNU-03 | menu | Viewport diatur 360x640 lewat device toolbar | 1) Muat menu<br>2) Amati seluruh tombol dan teks<br>3) Coba scroll horizontal | Semua teks terbaca, tidak ada scroll horizontal, tombol mulai bisa ditekan | AC-P02 | belum diverifikasi |
| MNU-04 | menu | MNU-01 lulus, mouse tidak dipakai | 1) Muat URL root di Chrome<br>2) Arahkan kursor ke aksi mulai<br>3) Klik sekali<br>4) Amati layar | Layar pilih level terbuka, tidak ada klik ganda yang dibutuhkan | AC-P03 | belum diverifikasi |
| MNU-05 | menu | DevTools Console terbuka | 1) Muat menu<br>2) Amati dialog izin browser dan console | Tidak ada prompt izin (lokasi, notifikasi, kamera); tidak ada prompt login; console tanpa error merah | AC-P01 | belum diverifikasi |
| LVL-01 | pilih level | MNU-02 lulus | 1) Masuk layar pilih level<br>2) Hitung dan baca label tiap level | Jumlah baris level sama dengan isi folder `levels/` (angka final menunggu AC-P11); tiap level punya nomor yang terbaca | AC-P11 | belum diverifikasi |
| LVL-02 | pilih level | LVL-01 lulus, keyboard saja | 1) Tekan `ArrowRight` beberapa kali<br>2) Amati sorotan<br>3) Tekan `Enter` | Sorotan pindah sesuai arah; layar main memuat level yang nomornya sama dengan yang disorot | AC-P04 | belum diverifikasi |
| LVL-03 | pilih level | LVL-02 lulus | 1) Tekan `Esc` (atau pilih aksi kembali)<br>2) Amati layar | Kembali ke menu tanpa error; sorotan menu kembali ke item pertama | AC-P02 | belum diverifikasi |
| LVL-04 | pilih level | LVL-01 lulus | 1) Masuk layar pilih level dari menu<br>2) Klik level kedua dengan mouse<br>3) Amati nomor level di layar main | Layar main memuat level kedua; nomor level di layar main cocok | AC-P04 | belum diverifikasi |
| MAIN-01 | main | LVL-02 lulus | 1) Tunggu level selesai dimuat<br>2) Amati posisi karakter dan platform | Karakter tampil di titik awal, platform/tile terlihat, tidak ada layar kosong atau aset pecah | AC-P06 | belum diverifikasi |
| MAIN-02 | main | MAIN-01 lulus | 1) Tahan `ArrowRight` selama 3 detik<br>2) Lepas | Karakter bergerak ke kanan dan berhenti saat tombol dilepas; kamera mengikuti bila level lebih lebar dari layar | AC-P05 | belum diverifikasi |
| MAIN-03 | main | MAIN-01 lulus | 1) Tahan `ArrowLeft` selama 3 detik<br>2) Lepas | Karakter bergerak ke kiri dan berhenti saat tombol dilepas; tidak menembus batas kiri level | AC-P05 | belum diverifikasi |
| MAIN-04 | main | MAIN-01 lulus | 1) Tekan `Space` sekali<br>2) Amati tinggi lompatan<br>3) Tekan `Space` lagi di udara | Karakter melompat satu kali; tidak ada lompatan kedua di udara (asumsi: satu lompatan) | AC-P05 | belum diverifikasi |
| MAIN-05 | main | MAIN-01 lulus | 1) Berdiri di bawah platform<br>2) Tekan `Space` sampai karakter mendarat di atasnya<br>3) Tahan `ArrowUp` berulang (asumsi: tidak dipakai) | Karakter mendarat di permukaan platform, tidak tembus ke atas atau jatuh menembusnya | AC-P05 | belum diverifikasi |
| MAIN-06 | main | MAIN-05 lulus | 1) Jalan keluar dari tepi platform<br>2) Amati jatuhnya | Karakter jatuh dengan gravitasi sampai permukaan berikutnya; tidak melayang atau berhenti di udara | AC-P06 | belum diverifikasi |
| MAIN-07 | main | MAIN-01 lulus | 1) Jalan ke arah jurang atau lubang<br>2) Jatuh ke bawah layar<br>3) Amati layar | Layar game over muncul dan permainan berhenti; HUD tidak terus berjalan di belakang | AC-P06 | belum diverifikasi |
| MAIN-08 | main | MAIN-01 lulus | 1) Dekati musuh atau hazard<br>2) Sentuh<br>3) Amati HUD dan layar | Kehilangan nyawa (asumsi 1 nyawa) lalu game over; jumlah nyawa di HUD berkurang sebelum layar game over | AC-P06 | belum diverifikasi |
| MAIN-09 | main | MAIN-01 lulus | 1) Catat skor di HUD<br>2) Ambil satu koin atau item<br>3) Bandingkan HUD | Skor HUD bertambah tepat sekali per item, tanpa jeda yang terlihat | AC-P06 | belum diverifikasi |
| MAIN-10 | main | MAIN-01 lulus | 1) Capai bendera atau titik akhir level<br>2) Amati layar | Level dinyatakan selesai dan permainan pindah layar sesuai desain (game over atau level berikutnya); tidak macet di layar main | AC-P06 | belum diverifikasi |
| MAIN-11 | main | MAIN-02 dan MAIN-03 lulus | 1) Tahan `ArrowLeft` dan `ArrowRight` bersamaan<br>2) Lepas keduanya | Karakter berhenti atau bergerak satu arah tanpa bergetar di tempat; setelah dilepas, kontrol normal lagi | AC-P05 | belum diverifikasi |
| MAIN-12 | main | MAIN-04 lulus | 1) Tahan `Space` selama 3 detik<br>2) Lepas | Karakter melompat sekali saja, tidak melompat berulang otomatis saat tombol ditahan | AC-P05 | belum diverifikasi |
| MAIN-13 | main | MAIN-01 lulus | 1) Main, lalu pindah ke tab lain<br>2) Tunggu 10 detik<br>3) Kembali ke tab game | Tidak crash dan tidak ada layar beku; perilaku pause dicatat apa adanya (belum ditetapkan desainnya) | AC-P06 | belum diverifikasi |
| MAIN-14 | main | MAIN-01 lulus | 1) Ubah ukuran jendela ke 360x640<br>2) Lanjut main<br>3) Perbesar lagi ke 1280x720 | Canvas menyesuaikan ukuran, kontrol tetap jalan, tidak ada area hitam permanen atau karakter keluar layar | AC-P06 | belum diverifikasi |
| MAIN-15 | main | MAIN-01 lulus | 1) Tekan `Esc`<br>2) Diamkan 5 detik<br>3) Tekan `Esc` lagi | State pause terlihat dan permainan berhenti; setelah lanjut, skor dan posisi tidak berubah | AC-P06 | belum diverifikasi |
| MAIN-16 | main | Level bisa diselesaikan; target FPS belum ada dari Bos (asumsi 60) | 1) Buka DevTools FPS meter<br>2) Main terus selama 60 detik<br>3) Catat angka terendah | FPS tidak turun di bawah target AC-P10; angka target harus ditetapkan Bos sebelum baris ini bisa lulus | AC-P10 | belum diverifikasi |
| MAIN-17 | main | MAIN-01 lulus | 1) Dari menu masuk ke level 1 tanpa mouse<br>2) Selesaikan atau mati tanpa menyentuh mouse<br>3) Amati hasil | Level bisa diselesaikan atau game over hanya dengan keyboard | AC-P05 | belum diverifikasi |
| OVER-01 | game over | MAIN-07 atau MAIN-08 lulus | 1) Capai kondisi game over<br>2) Amati semua elemen di layar<br>3) Coba sorot tiap aksi dengan keyboard | Skor akhir tampil, plus aksi main lagi dan kembali ke menu; keduanya bisa dipilih | AC-P07 | belum diverifikasi |
| OVER-02 | game over | OVER-01 lulus | 1) Catat skor akhir<br>2) Pilih aksi main lagi | Level yang sama dimulai ulang dari awal; HUD skor kembali ke nilai awal sesuai desain, bukan melanjutkan skor lama | AC-P07 | belum diverifikasi |
| OVER-03 | game over | OVER-01 lulus | 1) Sorot aksi kembali ke menu<br>2) Tekan `Enter`<br>3) Amati layar dan HUD | Layar menu tampil; permainan tidak berjalan di belakang | AC-P07 | belum diverifikasi |
| OVER-04 | game over | MAIN-09 lulus | 1) Catat skor HUD sebelum mati<br>2) Bandingkan dengan skor di layar game over | Kedua angka sama, tanpa selisih | AC-P06 | belum diverifikasi |
| OVER-05 | game over | Skor sesi ini lebih tinggi dari skor tersimpan | 1) Selesaikan sesi dengan skor lebih tinggi<br>2) Amati layar game over<br>3) Cek Local Storage | Indikator rekor baru tampil dan nilai di Local Storage ikut naik | AC-P08 | belum diverifikasi |
| SYS-01 | storage | OVER-05 lulus | 1) Tutup tab game<br>2) Buka lagi URL root<br>3) Masuk ke layar game over atau lihat skor tertinggi | Skor tertinggi yang tersimpan masih tampil, nilainya sama seperti sebelum tab ditutup | AC-P08 | belum diverifikasi |
| SYS-02 | storage | MAIN-01 lulus | 1) Main beberapa detik<br>2) Tekan `F5`<br>3) Amati layar dan console | App kembali ke menu atau pilih level tanpa error; skor tersimpan sebelumnya tidak hilang | AC-P08 | belum diverifikasi |
| SYS-03 | storage | Chrome mode Incognito | 1) Buka game di jendela Incognito<br>2) Main sampai game over<br>3) Tutup jendela, buka lagi | Game tetap bisa dimainkan; skor tidak tersimpan dan tidak ada crash atau console error yang menghentikan permainan | AC-P08 | belum diverifikasi |
| SYS-04 | storage | DevTools terbuka | 1) Isi Local Storage dengan data besar sampai penuh<br>2) Main sampai ada skor baru<br>3) Amati console | Penulisan skor gagal ditangani tanpa crash; permainan tetap bisa dilanjutkan, kegagalan simpan tercatat di console | AC-P08 | belum diverifikasi |
| SYS-05 | storage | Dua tab game terbuka | 1) Main di tab A, catat skor baru<br>2) Main di tab B, dapat skor lebih rendah<br>3) Reload tab A | Tidak ada pesan error; nilai skor tertinggi yang tampil adalah nilai tertinggi yang pernah disimpan (asumsi: last-write, belum ditetapkan) | AC-P08 | belum diverifikasi |
| SYS-06 | offline | Halaman sudah termuat sekali | 1) DevTools Network diatur Offline<br>2) Main satu level penuh | Game tetap berjalan tanpa permintaan jaringan yang gagal; tidak ada layar error | AC-P09 | belum diverifikasi |
| SYS-07 | umum | DevTools Console terbuka, filter Errors | 1) Main dari menu sampai game over<br>2) Baca console | Tidak ada error merah sepanjang satu sesi penuh | AC-P02 | belum diverifikasi |
| SYS-08 | umum | Berada di layar main | 1) Tekan tombol Back browser<br>2) Amati layar | Kembali ke layar sebelumnya di dalam app (pilih level atau menu), bukan halaman kosong; tidak ada state nyangkut | AC-P02 | belum diverifikasi |

## Format laporan bug

`ID test case` · layar · browser + viewport · langkah reproduksi bernomor · hasil yang diharapkan vs
hasil sebenarnya · ada/tidak di console. Satu bug satu baris judul, tanpa kata "rusak".

## Batasan yang diketahui

- Tombol kontrol dan angka FPS/jumlah level masih asumsi; MAIN-16 dan LVL-01 tidak bisa lulus tanpa
  keputusan Bos.
- Browser lain (Firefox, Safari) belum masuk matriks uji — perlu keputusan Arya/Rani.
- Otomasi untuk baris-baris ini milik Ivan, bukan saya.
