# SUARA — Futuristic Civic Petition Platform

Portal petisi publik eksperimental yang memadukan UX layanan pemerintah dengan visualisasi kota futuristik berbasis Three.js.

## Fitur

- Scene Three.js interaktif dengan kota glTF detail
- Jaringan dukungan, hologram, drone, dan elevated transit
- Pencarian dan filter petisi
- Live signature counter dan milestone 10K/100K
- Modal pembuatan petisi
- Layout responsif desktop dan mobile
- Halaman Jelajahi dengan globe jaringan dukungan 3D
- Dashboard CRUD petisi dengan penyimpanan localStorage

## Halaman

- `/` — landing page dan kota futuristik
- `/explore.html` — visualisasi gerakan publik 3D
- `/dashboard.html` — create, read, update, delete petisi

## Menjalankan lokal

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
```

## Kredit model 3D

“Littlest Tokyo” oleh Glen Fox, digunakan berdasarkan lisensi Creative Commons Attribution 4.0. Detail lengkap tersedia di `public/models/ATTRIBUTION.md`.
