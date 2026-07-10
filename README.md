# SUARA — Konsultasi Kebijakan Publik

SUARA adalah prototipe frontend untuk CITECH 2026 yang mengeksplorasi pengalaman konsultasi kebijakan publik digital: warga memahami rancangan, memberikan masukan terstruktur, berdiskusi berdasarkan isu, dan melihat bagaimana instansi mempertimbangkan masukan serta mengubah kebijakan.

> **Prototipe layanan — bukan kanal resmi pemerintah.** Seluruh rancangan, respons, institusi, dan statistik konsultasi pada website adalah data simulasi.

## Konsep

Alur utama SUARA:

1. Rancangan dan ruang perubahan dijelaskan.
2. Teks kebijakan dibaca bersama ringkasan bahasa sederhana.
3. Warga menjawab pertanyaan terarah dan menyampaikan bukti atau pengalaman.
4. Masukan publik dan Ruang Musyawarah dikelompokkan berdasarkan isu.
5. Instansi memberi respons simulasi untuk masukan yang diterima maupun ditolak.
6. Versi sebelum dan sesudah konsultasi dapat dibandingkan.

Skenario utama menggunakan konteks kebijakan Jakarta yang nyata tetapi konsultasi yang sepenuhnya simulatif:

**Rancangan Kawasan Rendah Emisi Terpadu Blok M dan Tarif Parkir Berbasis Emisi.**

## Halaman

- `/` — penjelasan produk dan konsultasi utama
- `/consultations.html` — direktori dan filter konsultasi
- `/consultation.html?id=blok-m-lez` — detail, form, musyawarah, respons, dan revisi
- `/my-responses.html` — draf, bukti pengiriman, dan pelacakan lokal

## Teknologi

- Vite 6 multi-page build
- JavaScript modules tanpa framework UI
- Three.js untuk visual konteks kota
- Lucide untuk ikon
- `localStorage` untuk draf dan tanggapan simulasi
- HTML semantik dan layout responsif

Tidak ada backend, autentikasi, unggahan nyata, AI pengguna, atau integrasi pemerintah.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Verifikasi:

```bash
npm test
npm run build
npm run test:e2e
```

Jalankan seluruh pemeriksaan sekaligus dengan `npm run test:all`, lalu gunakan `npm run preview` untuk meninjau hasil build produksi.

Konfigurasi `vercel.json` sudah menargetkan output Vite di `dist/`; deployment tetap perlu dilakukan dari akun tim.

## Data dan privasi

Jawaban formulir disimpan hanya di browser dengan key `suara_consultation_demo_v1`. Tidak ada data yang dikirim ke server. Hapus penyimpanan situs pada browser untuk mereset demo.

## Dasar konsep dan sumber

- [UU No. 13 Tahun 2022](https://peraturan.bpk.go.id/Details/212810/uu-no-13-tahun-2022)
- [Putusan MK No. 91/PUU-XVIII/2020](https://www.mkri.id/public/content/persidangan/putusan/putusan_mkri_8240_1637822490.pdf)
- [OECD Guidelines for Citizen Participation Processes](https://www.oecd.org/en/publications/2022/09/oecd-guidelines-for-citizen-participation-processes_63b34541.html)
- [Partisipasiku — BPHN](https://partisipasiku.bphn.go.id/tentang-kami)
- [e-Partisipasi Ditjen PP](https://e-partisipasi.peraturan.go.id/)
- [Jakarta: Kawasan Rendah Emisi Terpadu](https://www.jakarta.go.id/index.php/siaran-pers/6814-SP-HMS-06-2026)
- [Jakarta: Kebijakan Parkir Disinsentif](https://www.jakarta.go.id/page/kebijakan-parkir-disinsentif-jakarta)

Riset lengkap dan audit pola tersimpan secara lokal di `docs/research/`. Folder `docs/` sengaja tetap diabaikan Git agar materi kompetisi dan pustaka riset lokal tidak terdorong tanpa sengaja.

## Atribusi

Data bangunan Jakarta yang tersedia di repositori berasal dari kontributor OpenStreetMap dan menggunakan ODbL. Visual Take 2 saat ini menggunakan geometri kota prosedural agar tetap ringan dan tidak menampilkan batas kebijakan sebagai peta resmi.
