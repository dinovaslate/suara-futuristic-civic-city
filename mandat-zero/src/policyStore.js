const STORAGE_KEY = 'mandat_zero_policies_v1';

const seedPolicies = [
  {
    id: 'walkable-transit-500',
    title: 'Trotoar teduh dalam radius 500 meter dari transportasi publik.',
    category: 'Kota',
    owner: 'Pemprov DKI Jakarta',
    region: 'Jakarta',
    status: 'Tumbuh cepat',
    support: 42840,
    oppose: 3240,
    target: 60000,
    auditors: 1249,
    createdAt: '2026-07-08T08:20:00.000Z',
    updatedAt: '2026-07-13T06:00:00.000Z',
    summary: 'Mandat desain kota yang memprioritaskan pejalan kaki, kanopi pohon, akses universal, dan koneksi aman dari halte menuju permukiman.',
    impact: '+18% akses pejalan kaki · −11% perjalanan kendaraan pendek · 1,3 juta warga terdampak.',
    evidence: '1.284 laporan titik panas, 92 audit trotoar warga, dan pemetaan kanopi pohon pada 18 koridor transit.',
    risk: 'Risiko utama adalah pemindahan parkir liar dan koordinasi utilitas. Mitigasi: pembangunan per koridor dengan audit akses usaha.',
    color: '#ff3158'
  },
  {
    id: 'air-quality-school-zone',
    title: 'Zona udara bersih untuk 4.000 sekolah perkotaan.',
    category: 'Kesehatan',
    owner: 'Kementerian Kesehatan',
    region: 'Nasional',
    status: 'Perlu respons',
    support: 36128,
    oppose: 1844,
    target: 50000,
    auditors: 810,
    createdAt: '2026-07-06T10:20:00.000Z',
    updatedAt: '2026-07-12T04:00:00.000Z',
    summary: 'Sensor kualitas udara terbuka, pembatasan kendaraan saat jam masuk, dan audit emisi radius 300 meter dari sekolah.',
    impact: '2,8 juta pelajar terlindungi · deteksi dini PM2.5 · data terbuka untuk kebijakan transportasi.',
    evidence: 'Data awal 214 sensor warga menunjukkan 61% sekolah sampel melampaui ambang PM2.5 pada jam masuk.',
    risk: 'Kualitas sensor heterogen. Protokol kalibrasi bersama BMKG dibutuhkan sebelum data menjadi dasar sanksi.',
    color: '#54dcff'
  },
  {
    id: 'heat-island-budget',
    title: '1% APBD kota untuk memutus pulau panas ekstrem.',
    category: 'Iklim',
    owner: 'Asosiasi Pemerintah Kota',
    region: '18 Kota',
    status: 'Review terbuka',
    support: 29402,
    oppose: 2810,
    target: 40000,
    auditors: 618,
    createdAt: '2026-07-04T10:20:00.000Z',
    updatedAt: '2026-07-11T13:00:00.000Z',
    summary: 'Anggaran terkunci untuk kanopi pohon, atap dingin, taman mikro, dan perlindungan pekerja luar ruang dari panas ekstrem.',
    impact: '−1,7°C temperatur permukaan target · 620 hektare ruang teduh · perlindungan pekerja rentan.',
    evidence: 'Peta termal Landsat dan 6.420 pengukuran warga memetakan 117 kelurahan sebagai prioritas suhu ekstrem.',
    risk: 'Pemeliharaan vegetasi jangka panjang sering tidak teranggarkan. Dana harus mencakup biaya hidup aset lima tahun.',
    color: '#d7ff3f'
  },
  {
    id: 'algorithm-transparency',
    title: 'Buka audit algoritma yang menentukan akses bantuan sosial.',
    category: 'Digital',
    owner: 'Kementerian Sosial',
    region: 'Nasional',
    status: 'Mendesak',
    support: 18776,
    oppose: 982,
    target: 25000,
    auditors: 1555,
    createdAt: '2026-07-09T15:20:00.000Z',
    updatedAt: '2026-07-13T02:00:00.000Z',
    summary: 'Warga berhak mengetahui variabel, sumber data, mekanisme banding, dan tingkat kesalahan sistem penentuan penerima bantuan.',
    impact: 'Transparansi keputusan otomatis · jalur banding terukur · deteksi bias wilayah dan gender.',
    evidence: '327 laporan eksklusi keliru diklasifikasi berdasarkan pola sumber data, waktu koreksi, dan dampak rumah tangga.',
    risk: 'Keterbukaan tidak boleh mengekspos data pribadi atau memungkinkan manipulasi. Audit dilakukan dengan model disclosure bertingkat.',
    color: '#9665ff'
  },
  {
    id: 'flood-data-open',
    title: 'Satu peta banjir publik, real-time, dan dapat diaudit warga.',
    category: 'Kota',
    owner: 'Badan Penanggulangan Bencana',
    region: 'Jabodetabek',
    status: 'Menang momentum',
    support: 51004,
    oppose: 2021,
    target: 75000,
    auditors: 2084,
    createdAt: '2026-07-01T06:30:00.000Z',
    updatedAt: '2026-07-13T07:00:00.000Z',
    summary: 'Satukan sensor pemerintah, laporan warga, status pompa, pintu air, dan prediksi genangan dalam API publik lintas wilayah.',
    impact: 'Waktu respons lebih cepat · rute evakuasi dinamis · akuntabilitas investasi drainase lintas kota.',
    evidence: 'Simulasi tiga kejadian menunjukkan integrasi data memotong jeda informasi antarwilayah hingga 47 menit.',
    risk: 'Laporan palsu dan outage sensor dapat memicu keputusan salah. Sistem membutuhkan confidence score dan redundansi data.',
    color: '#00b7ff'
  },
  {
    id: 'mental-health-primary',
    title: 'Psikolog klinis di setiap jejaring Puskesmas kota.',
    category: 'Kesehatan',
    owner: 'Kementerian Kesehatan',
    region: 'Nasional',
    status: 'Draft publik',
    support: 12218,
    oppose: 634,
    target: 30000,
    auditors: 402,
    createdAt: '2026-07-10T09:00:00.000Z',
    updatedAt: '2026-07-12T09:00:00.000Z',
    summary: 'Layanan kesehatan mental primer dengan triase, konsultasi, rujukan, dan waktu tunggu yang dipublikasikan.',
    impact: 'Akses dini · beban rumah sakit turun · indikator waktu tunggu dan keberhasilan rujukan terbuka.',
    evidence: 'Survei 3.100 responden menunjukkan waktu tunggu rata-rata 41 hari dan biaya sebagai hambatan terbesar.',
    risk: 'Kelangkaan tenaga profesional dapat memindahkan antrean tanpa meningkatkan akses. Telekonsultasi menjadi lapis pendukung.',
    color: '#ff9a49'
  }
];

const clone = value => JSON.parse(JSON.stringify(value));

export class PolicyStore extends EventTarget {
  constructor() {
    super();
    this.policies = this.#read();
  }

  #read() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) {
        const clean = saved.filter(item => !String(item.title || '').startsWith('QA —'));
        if (clean.length !== saved.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
        return clean;
      }
    } catch (error) {
      console.warn('Policy store reset:', error);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPolicies));
    return clone(seedPolicies);
  }

  #commit(message = 'Jaringan diperbarui.') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.policies));
    this.dispatchEvent(new CustomEvent('change', { detail: { policies: this.list(), message } }));
  }

  list() { return clone(this.policies); }
  get(id) {
    const found = this.policies.find(item => item.id === id);
    return found ? clone(found) : undefined;
  }

  save(data) {
    const now = new Date().toISOString();
    if (data.id && this.policies.some(item => item.id === data.id)) {
      const index = this.policies.findIndex(item => item.id === data.id);
      this.policies[index] = { ...this.policies[index], ...data, target: Number(data.target), updatedAt: now };
      this.#commit('Mandat berhasil diperbarui.');
      return this.get(data.id);
    }
    const id = `citizen-${crypto.randomUUID()}`;
    const palette = ['#ff3158', '#54dcff', '#9665ff', '#d7ff3f', '#ff9a49'];
    const policy = {
      id,
      title: data.title.trim(),
      category: data.category,
      owner: data.owner.trim(),
      region: data.region.trim(),
      status: 'Draft publik',
      support: 0,
      oppose: 0,
      target: Number(data.target),
      auditors: 0,
      createdAt: now,
      updatedAt: now,
      summary: data.summary.trim(),
      impact: 'Dampak sedang dihitung bersama jaringan auditor publik.',
      evidence: 'Belum ada bukti yang dilampirkan. Buka detail untuk memulai audit.',
      risk: 'Risiko implementasi belum ditinjau.',
      color: palette[this.policies.length % palette.length]
    };
    this.policies.unshift(policy);
    this.#commit('Mandat baru telah masuk ke jaringan.');
    return clone(policy);
  }

  support(id) {
    const item = this.policies.find(policy => policy.id === id);
    if (!item) return null;
    item.support += 1;
    item.updatedAt = new Date().toISOString();
    this.#commit('Suaramu tercatat dan terverifikasi.');
    return clone(item);
  }

  remove(id) {
    const next = this.policies.filter(item => item.id !== id);
    if (next.length === this.policies.length) return false;
    this.policies = next;
    this.#commit('Mandat telah dihapus dari perangkat ini.');
    return true;
  }

  reset() {
    this.policies = clone(seedPolicies);
    this.#commit('Jaringan contoh dikembalikan.');
  }
}

export const formatNumber = value => new Intl.NumberFormat('id-ID').format(value || 0);
export const percent = policy => Math.min(100, Math.round((policy.support / Math.max(policy.target, 1)) * 100));
