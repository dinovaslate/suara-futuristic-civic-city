import { consultation, consultations } from './consultationData.js';
import { consultationCard, daysUntil, formatNumber, initShell, refreshIcons } from './shared.js';
import { createPolicyMap } from './policyMap.js';

initShell();
createPolicyMap(document.querySelector('#heroMap'));

document.querySelector('#featuredConsultation').innerHTML = `
  <div class="featured-copy">
    <span class="status-badge is-open"><i></i>${consultation.statusLabel}</span>
    <h3>${consultation.title}</h3>
    <p>${consultation.excerpt}</p>
    <div class="meta-row"><span><i data-lucide="building-2"></i>${consultation.institution}</span><span><i data-lucide="map-pin"></i>${consultation.region}</span><span><i data-lucide="calendar-days"></i>Berakhir ${daysUntil(consultation.closesAt)} hari lagi</span></div>
    <div class="tag-list">${consultation.affectedGroups.slice(0, 4).map((group) => `<span>${group}</span>`).join('')}</div>
    <div class="feature-actions"><a class="primary-button" href="/consultation.html?id=${consultation.id}">Baca rancangan <i data-lucide="arrow-right"></i></a><a class="secondary-button" href="/consultation.html?id=${consultation.id}&tab=questions">Jawab konsultasi</a></div>
  </div>
  <aside class="featured-side"><h4>Data simulasi prototipe</h4><div class="featured-facts"><div><strong>${consultation.questionCount}</strong><span>pertanyaan konsultasi</span></div><div><strong>${consultation.affectedGroups.length}</strong><span>kelompok terdampak utama</span></div><div><strong>${formatNumber(consultation.responseCount)}</strong><span>respons simulasi</span></div><div><strong>${consultation.documentCount}</strong><span>dokumen pendukung</span></div></div><p style="color:rgba(255,255,255,.55);font-size:11px;line-height:1.65;margin-top:24px">Skenario menggunakan konteks kebijakan Jakarta yang nyata. Seluruh rancangan pasal dan hasil konsultasi adalah simulasi.</p></aside>`;

document.querySelector('#homeConsultationGrid').innerHTML = consultations.slice(1).map(consultationCard).join('');
refreshIcons();

document.querySelector('#heroSearch').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#heroSearchInput').value.trim();
  location.href = `/consultations.html${query ? `?q=${encodeURIComponent(query)}` : ''}`;
});
