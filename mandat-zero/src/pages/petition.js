import { mountPortal, escapeHtml, toast } from '../portal.js';
import { PolicyStore, formatNumber, percent } from '../policyStore.js';

const store = new PolicyStore();
const { world } = await mountPortal({ active: 'petitions', phase: 'core' });
const id = new URLSearchParams(location.search).get('id');
let policy = store.get(id) || store.list()[0];

function render() {
  if (!policy) {
    document.querySelector('#detailShell').innerHTML = '<div class="portal-empty">MANDAT TIDAK DITEMUKAN</div>';
    return;
  }
  document.title = `${policy.title} — MANDAT//ZERO`;
  const progress = percent(policy);
  const shell = document.querySelector('#detailShell');
  shell.style.setProperty('--accent', policy.color);
  shell.innerHTML = `
    <article class="detail-story">
      <div class="detail-story__meta"><span>${escapeHtml(policy.category)}</span><span>${escapeHtml(policy.region)}</span><span>${escapeHtml(policy.status)}</span></div>
      <h1>${escapeHtml(policy.title)}</h1><p class="detail-story__lead">${escapeHtml(policy.summary)}</p>
      <div class="detail-story__sections">
        <article><small>IMPACT VECTOR</small><p>${escapeHtml(policy.impact)}</p></article>
        <article><small>EVIDENCE BASE</small><p>${escapeHtml(policy.evidence)}</p></article>
        <article><small>RISK REGISTER</small><p>${escapeHtml(policy.risk)}</p></article>
      </div>
    </article>
    <aside class="detail-panel">
      <div class="detail-panel__orb"><strong>${progress}%</strong></div><span class="detail-panel__label">DUKUNGAN TERVERIFIKASI</span><strong class="detail-panel__count">${formatNumber(policy.support)}</strong><span class="detail-panel__target">dari target ${formatNumber(policy.target)} suara</span>
      <div class="detail-panel__track" style="--progress:${progress}%"><i></i></div>
      <button class="button button--primary" id="detailSupport"><span>Dukung mandat ini</span><b>＋1</b></button>
      <a class="button button--ghost" href="dashboard.html?edit=${encodeURIComponent(policy.id)}" style="margin-top:10px"><span>Buka di dashboard</span><b>↗</b></a>
      <div class="detail-panel__owner"><small>DITUJUKAN KEPADA</small><strong>${escapeHtml(policy.owner)}</strong></div>
    </aside>`;
  document.querySelector('#detailSupport').addEventListener('click', () => {
    policy = store.support(policy.id); world.pulse(policy.color); render(); toast('Suaramu sudah tercatat di jaringan.');
  });
}
render();
