# PRISMA — ruang latihan emosi dan spiritual mahasiswa

Versi Vercel menyajikan antarmuka PRISMA dan meneruskan `/api/auth`, `/api/me`, `/api/history`, serta `/api/step` ke backend PRISMA yang sudah memakai Cloudflare D1 dan secret Gemini. Akun serta riwayat tetap berada di satu basis data. Kode backend inti tersimpan di `site-backend/` untuk transparansi; deployment backend dikelola terpisah dari Vercel.

## Alur pengguna

Peta situasi → simulasi persona (teks/suara) → replay → refleksi berbasis bukti → ikhtiar/tawakkul → satu aksi → Reality Check dan perkembangan bulanan.

## Gemini

Secret `gemini` atau `GEMINI_API_KEY` harus terpasang **di backend Site**, bukan di browser dan bukan di repo. Vercel tidak memerlukan salinan kunci karena API-nya diteruskan ke backend. Buka pengaturan Site PRISMA, pilih Environment Variables/Secrets, perbarui `gemini` dengan kunci dari Google AI Studio, lalu terbitkan ulang Site. Jangan pernah menaruh kunci dalam `public/app.js`, GitHub, atau chat.

## Pengembangan lokal

Jalankan `npm install` lalu `npm run dev`. Dengan koneksi ke backend yang aktif, kunjungi `http://localhost:3000`. Suara memakai fitur Web Speech browser dan mungkin tidak tersedia di setiap browser.

## Upload manual ke GitHub dan Vercel

Ekstrak ZIP ini. Di akar repositori GitHub harus tampak **folder `app/` dan `public/`**, serta file `package.json` dan `next.config.ts`. Jalur `app/page.tsx` dan `app/api/[...path]/route.ts` wajib tetap utuh. Jangan memakai pilihan berkas yang meratakan semua file ke akar repo. Cara paling andal: clone repo dengan GitHub Desktop, salin seluruh isi hasil ekstrak ke folder clone (pertahankan subfolder), lalu Commit dan Push ke `main`. Commit pada repo yang sudah terhubung ke Vercel akan memicu build baru. Jika Vercel masih melaporkan `missing_pages_app`, lihat pengaturan Root Directory proyek; untuk paket ini nilainya harus akar repo (`./`).

PRISMA adalah alat latihan preventif, bukan diagnosis, terapi, atau pengganti profesional.
