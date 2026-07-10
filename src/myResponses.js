import { consultation, consultations } from './consultationData.js';
import { readState, subscribeState } from './consultationStore.js';
import { escapeHtml, formatDate, initShell, refreshIcons } from './shared.js';

initShell();
let activeFilter = 'all';

function activities() {
  const state = readState();
  const records = Object.values(state.responses).map((response) => ({
    type: response.status,
    response,
    consultation: consultations.find((item) => item.id === response.consultationId) || consultation,
  }));
  state.followed.forEach((id) => {
    if (!records.some((record) => record.consultation.id === id)) {
      records.push({ type: 'followed', consultation: consultations.find((item) => item.id === id) || consultation });
    }
  });
  return records.sort((a, b) => new Date(b.response?.updatedAt || b.consultation.updatedAt) - new Date(a.response?.updatedAt || a.consultation.updatedAt));
}

function render() {
  const all = activities();
  const data = activeFilter === 'all' ? all : all.filter((item) => item.type === activeFilter);
  document.querySelector('#activityCount').textContent = all.length;
  document.querySelector('#activityList').innerHTML = data.length ? data.map(activityCard).join('') : `
    <div class="empty-activity"><i data-lucide="files"></i><h3>Belum ada aktivitas pada bagian ini.</h3><p>Ikuti konsultasi atau simpan jawaban pertama Anda untuk melihat riwayatnya.</p><a class="primary-button" href="/consultations.html">Lihat konsultasi</a></div>`;
  refreshIcons();
}

function activityCard(item) {
  const submitted = item.type === 'submitted';
  const draft = item.type === 'draft';
  const label = submitted ? 'Tanggapan terkirim' : draft ? 'Draf tanggapan' : 'Konsultasi diikuti';
  const statusClass = submitted ? 'is-outcome' : draft ? 'is-analysis' : 'is-open';
  const updated = item.response?.updatedAt || item.consultation.updatedAt;
  return `<article class="activity-card"><span class="status-badge ${statusClass}"><i></i>${label}</span><h3>${escapeHtml(item.consultation.title)}</h3><p>${submitted ? `Bukti pengiriman ${escapeHtml(item.response.receipt)}. Contoh proses kini menunjukkan bagaimana isu dianalisis dan rancangan direvisi.` : draft ? 'Jawaban Anda tersimpan di perangkat ini dan dapat dilanjutkan sebelum periode konsultasi berakhir.' : 'Pembaruan tahap dan contoh outcome dapat ditelusuri dari halaman konsultasi.'}</p><div class="activity-card-foot"><span style="color:var(--muted);font-size:9px">Diperbarui ${formatDate(updated)}</span><a class="text-button" href="/consultation.html?id=${item.consultation.id}&tab=${submitted ? 'outcome' : draft ? 'questions' : 'summary'}">${submitted ? 'Lihat tindak lanjut' : draft ? 'Lanjutkan draf' : 'Buka konsultasi'} <i data-lucide="arrow-right"></i></a></div></article>`;
}

document.querySelectorAll('[data-activity-filter]').forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.activityFilter;
  document.querySelectorAll('[data-activity-filter]').forEach((item) => item.classList.toggle('active', item === button));
  render();
}));

subscribeState(render);
render();
