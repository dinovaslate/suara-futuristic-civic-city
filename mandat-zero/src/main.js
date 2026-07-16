import './styles.css';
import { CivicWorld } from './scene.js';
import { CivicEmblem } from './emblem.js';
import { PolicyStore, formatNumber, percent } from './policyStore.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const dateLabel = value => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

const store = new PolicyStore();
const world = new CivicWorld($('#world'));
const finaleEmblem = new CivicEmblem($('#finaleModel'));
addEventListener('pagehide', event => { if (!event.persisted) finaleEmblem.dispose(); });
let activeCategory = 'all';
let selectedId = store.list()[0]?.id;
let activeReviewTab = 'impact';
let toastTimer;

const elements = {
  grid: $('#policyGrid'),
  empty: $('#emptyState'),
  search: $('#searchInput'),
  sort: $('#sortSelect'),
  labTitle: $('#labTitle'),
  labSummary: $('#labSummary'),
  labCode: $('#labCode'),
  labStatus: $('#labStatus'),
  labPercent: $('#labPercent'),
  labSupport: $('#labSupport'),
  labTarget: $('#labTarget'),
  labAuditors: $('#labAuditors'),
  labInsightCopy: $('#labInsightCopy'),
  policyDialog: $('#policyDialog'),
  policyDialogContent: $('#policyDialogContent'),
  editorDialog: $('#editorDialog'),
  form: $('#policyForm'),
  toast: $('#toast')
};

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), 2600);
}

function getVisiblePolicies() {
  const query = elements.search.value.trim().toLocaleLowerCase('id-ID');
  const policies = store.list().filter(policy => {
    const matchesCategory = activeCategory === 'all' || policy.category === activeCategory;
    const haystack = `${policy.title} ${policy.category} ${policy.owner} ${policy.region}`.toLocaleLowerCase('id-ID');
    return matchesCategory && (!query || haystack.includes(query));
  });
  const sort = elements.sort.value;
  policies.sort((a, b) => {
    if (sort === 'support') return b.support - a.support;
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    const aMomentum = (a.support / Math.max(1, Date.now() - new Date(a.createdAt))) * 1e9;
    const bMomentum = (b.support / Math.max(1, Date.now() - new Date(b.createdAt))) * 1e9;
    return bMomentum - aMomentum;
  });
  return policies;
}

function renderPolicies() {
  const policies = getVisiblePolicies();
  elements.empty.hidden = policies.length > 0;
  elements.grid.innerHTML = policies.map((policy, index) => `
    <article class="policy-card reveal is-visible" data-policy-id="${escapeHtml(policy.id)}" style="--card-color:${escapeHtml(policy.color)}" tabindex="0" aria-label="Buka detail ${escapeHtml(policy.title)}">
      <div class="policy-card__top">
        <span class="policy-card__code">M/0 — ${String(index + 1).padStart(3, '0')} · ${escapeHtml(policy.category)}</span>
        <span class="policy-card__status"><i></i>${escapeHtml(policy.status)}</span>
      </div>
      <div class="policy-card__actions">
        <button data-edit-policy="${escapeHtml(policy.id)}">EDIT</button>
        <button data-delete-policy="${escapeHtml(policy.id)}">HAPUS</button>
      </div>
      <h3>${escapeHtml(policy.title)}</h3>
      <p>${escapeHtml(policy.summary)}</p>
      <div class="policy-card__footer">
        <div class="policy-card__meter">
          <span><strong>${formatNumber(policy.support)}</strong><b>${percent(policy)}% / ${formatNumber(policy.target)}</b></span>
          <div class="policy-card__track"><i style="width:${percent(policy)}%"></i></div>
        </div>
        <button class="policy-card__button" data-support-policy="${escapeHtml(policy.id)}" aria-label="Dukung petisi">＋</button>
      </div>
    </article>
  `).join('');
  renderMetrics();
  if (!store.get(selectedId) && policies[0]) selectedId = policies[0].id;
  renderLab();
}

function renderMetrics() {
  const policies = store.list();
  const voices = policies.reduce((sum, policy) => sum + policy.support, 0);
  $('#metricPolicies').textContent = String(policies.length).padStart(2, '0');
  $('#metricVoices').textContent = voices > 999999 ? `${(voices / 1e6).toFixed(1)}M` : `${Math.round(voices / 1000)}K`;
  $('#metricReviews').textContent = String(policies.filter(policy => percent(policy) >= 50).length).padStart(2, '0');
  $('#heroSupport').textContent = formatNumber(Math.round(voices * .102));
}

function renderLab() {
  const policy = store.get(selectedId) || store.list()[0];
  if (!policy) return;
  const value = percent(policy);
  elements.labCode.textContent = `MANDAT / ${policy.id.slice(-6).toUpperCase()}`;
  elements.labStatus.textContent = policy.status;
  elements.labTitle.textContent = policy.title;
  elements.labSummary.textContent = policy.summary;
  elements.labPercent.textContent = `${value}%`;
  elements.labSupport.textContent = formatNumber(policy.support);
  elements.labTarget.textContent = formatNumber(policy.target);
  elements.labAuditors.textContent = formatNumber(policy.auditors);
  elements.labInsightCopy.textContent = policy[activeReviewTab] || policy.impact;
  const ring = $('.lab-chart__rings');
  ring.style.background = `conic-gradient(${policy.color} ${value}%, rgba(255,255,255,.06) ${value}% 100%)`;
  $('.policy-lab').style.setProperty('--lab-color', policy.color);
}

function selectPolicy(id, shouldScroll = true) {
  if (!store.get(id)) return;
  selectedId = id;
  renderLab();
  if (shouldScroll) $('#review').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function supportPolicy(id) {
  const policy = store.support(id);
  if (!policy) return;
  selectedId = id;
  world.pulse(policy.color);
  renderPolicies();
}

function openDetail(id) {
  const policy = store.get(id);
  if (!policy) return;
  selectedId = id;
  elements.policyDialogContent.innerHTML = `
    <div class="eyebrow"><i></i>${escapeHtml(policy.category)} / ${escapeHtml(policy.region)}</div>
    <h3>${escapeHtml(policy.title)}</h3>
    <div class="dialog__meta"><span>${escapeHtml(policy.owner)}</span><span>${escapeHtml(policy.status)}</span><span>Diperbarui ${dateLabel(policy.updatedAt)}</span></div>
    <p class="dialog__copy">${escapeHtml(policy.summary)}</p>
    <div class="dialog__stats">
      <div><small>Dukungan</small><strong>${formatNumber(policy.support)}</strong></div>
      <div><small>Target</small><strong>${formatNumber(policy.target)}</strong></div>
      <div><small>Auditor</small><strong>${formatNumber(policy.auditors)}</strong></div>
    </div>
    <div class="lab-insight"><span>DAMPAK</span><p>${escapeHtml(policy.impact)}</p></div>
    <div class="lab-insight" style="margin-top:10px"><span>BUKTI</span><p>${escapeHtml(policy.evidence)}</p></div>
    <div class="lab-insight" style="margin-top:10px"><span>RISIKO</span><p>${escapeHtml(policy.risk)}</p></div>
    <div class="dialog__buttons" style="margin-top:28px">
      <button class="button button--primary" data-dialog-support="${escapeHtml(policy.id)}"><span>Dukung sekarang</span><b>＋1</b></button>
      <a class="button button--ghost" href="petition.html?id=${encodeURIComponent(policy.id)}"><span>Halaman detail</span><b>↗</b></a>
      <button class="button button--ghost" data-dialog-edit="${escapeHtml(policy.id)}"><span>Edit mandat</span><b>✎</b></button>
      <button class="button button--ghost danger-button" data-dialog-delete="${escapeHtml(policy.id)}"><span>Hapus lokal</span><b>×</b></button>
    </div>`;
  if (!elements.policyDialog.open) elements.policyDialog.showModal();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

function openEditor(policy = null) {
  elements.form.reset();
  $('#editorTitle').textContent = policy ? 'Perbarui mandat.' : 'Ajukan mandat baru.';
  if (policy) {
    for (const [key, value] of Object.entries(policy)) {
      const field = elements.form.elements.namedItem(key);
      if (field) field.value = value;
    }
  } else {
    elements.form.elements.target.value = 10000;
  }
  closeDialog(elements.policyDialog);
  if (!elements.editorDialog.open) elements.editorDialog.showModal();
  requestAnimationFrame(() => elements.form.elements.title.focus());
}

function deletePolicy(id) {
  const policy = store.get(id);
  if (!policy) return;
  if (!confirm(`Hapus mandat “${policy.title}” dari perangkat ini?`)) return;
  store.remove(id);
  if (selectedId === id) selectedId = store.list()[0]?.id;
  closeDialog(elements.policyDialog);
}

elements.grid.addEventListener('click', event => {
  const supportButton = event.target.closest('[data-support-policy]');
  if (supportButton) { event.stopPropagation(); supportPolicy(supportButton.dataset.supportPolicy); return; }
  const editButton = event.target.closest('[data-edit-policy]');
  if (editButton) { event.stopPropagation(); openEditor(store.get(editButton.dataset.editPolicy)); return; }
  const deleteButton = event.target.closest('[data-delete-policy]');
  if (deleteButton) { event.stopPropagation(); deletePolicy(deleteButton.dataset.deletePolicy); return; }
  const card = event.target.closest('[data-policy-id]');
  if (card) openDetail(card.dataset.policyId);
});

elements.grid.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-policy-id]')) {
    event.preventDefault();
    openDetail(event.target.dataset.policyId);
  }
});

$('#filterPills').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeCategory = button.dataset.filter;
  $$('#filterPills button').forEach(item => item.classList.toggle('is-active', item === button));
  renderPolicies();
});
elements.search.addEventListener('input', renderPolicies);
elements.sort.addEventListener('change', renderPolicies);

$('#reviewTabs').addEventListener('click', event => {
  const button = event.target.closest('[data-review-tab]');
  if (!button) return;
  activeReviewTab = button.dataset.reviewTab;
  $$('#reviewTabs button').forEach(item => item.classList.toggle('is-active', item === button));
  renderLab();
});

$('#labSupportButton').addEventListener('click', () => supportPolicy(selectedId));
$('#labDetailButton').addEventListener('click', () => openDetail(selectedId));

elements.policyDialog.addEventListener('click', event => {
  if (event.target.closest('[data-close-dialog]')) closeDialog(elements.policyDialog);
  const support = event.target.closest('[data-dialog-support]');
  if (support) { supportPolicy(support.dataset.dialogSupport); openDetail(support.dataset.dialogSupport); }
  const edit = event.target.closest('[data-dialog-edit]');
  if (edit) openEditor(store.get(edit.dataset.dialogEdit));
  const remove = event.target.closest('[data-dialog-delete]');
  if (remove) deletePolicy(remove.dataset.dialogDelete);
});

elements.editorDialog.addEventListener('click', event => {
  if (event.target.closest('[data-close-editor]')) closeDialog(elements.editorDialog);
});

$$('[data-open-editor]').forEach(button => button.addEventListener('click', () => openEditor()));

elements.form.addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(elements.form));
  const saved = store.save(data);
  selectedId = saved.id;
  closeDialog(elements.editorDialog);
  renderPolicies();
  world.pulse(saved.color);
  setTimeout(() => selectPolicy(saved.id), 180);
});

store.addEventListener('change', event => {
  renderPolicies();
  showToast(event.detail.message);
});

const menuButton = $('#menuButton');
menuButton.addEventListener('click', () => {
  const isOpen = $('#nav').classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});
$$('#nav a').forEach(link => link.addEventListener('click', () => {
  $('#nav').classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

addEventListener('scroll', () => $('#topbar').classList.toggle('is-scrolled', scrollY > 40), { passive: true });

const sceneSections = $$('[data-scene]');
let sceneFramePending = false;
const updateScenePhase = () => {
  const focusLine = innerHeight * .52;
  const nearest = sceneSections.reduce((selected, section) => {
    const rect = section.getBoundingClientRect();
    const distance = Math.abs(rect.top + Math.min(rect.height, innerHeight) * .5 - focusLine);
    return !selected || distance < selected.distance ? { section, distance } : selected;
  }, null);
  if (nearest) world.setPhase(nearest.section.dataset.scene);
  sceneFramePending = false;
};
const queueScenePhase = () => {
  if (sceneFramePending) return;
  sceneFramePending = true;
  requestAnimationFrame(updateScenePhase);
};
addEventListener('scroll', queueScenePhase, { passive: true });
addEventListener('resize', queueScenePhase);
updateScenePhase();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
$$('.reveal').forEach(item => revealObserver.observe(item));

if (!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(pointer:fine)').matches) {
  $$('.magnetic').forEach(element => {
    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .09}px, ${(event.clientY - rect.top - rect.height / 2) * .09}px)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });
  elements.grid.addEventListener('pointermove', event => {
    const card = event.target.closest('.policy-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    card.style.transform = `perspective(900px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg) translateY(-6px)`;
  });
  elements.grid.addEventListener('pointerout', event => {
    const card = event.target.closest('.policy-card');
    if (card && !card.contains(event.relatedTarget)) card.style.transform = '';
  });
}

let bootHidden = false;
function hideBoot() {
  if (bootHidden) return;
  bootHidden = true;
  $('#boot').classList.add('is-hidden');
}
addEventListener('civic-world-ready', () => setTimeout(hideBoot, 350), { once: true });
setTimeout(hideBoot, 3500);

setInterval(() => {
  const node = $('#liveCount');
  node.textContent = formatNumber(8180 + Math.floor(Math.random() * 90));
}, 3700);

const finale = $('.finale');
if (finale && !finale.querySelector('.finale__stars')) {
  const stars = document.createElement('div');
  stars.className = 'finale__stars';
  stars.setAttribute('aria-hidden', 'true');
  let seed = 271828;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < 118; index += 1) {
    const star = document.createElement('i');
    star.style.setProperty('--x', `${(random() * 100).toFixed(2)}%`);
    star.style.setProperty('--y', `${(random() * 100).toFixed(2)}%`);
    star.style.setProperty('--s', `${(.8 + random() * 2.4).toFixed(2)}px`);
    star.style.setProperty('--a', `${(.34 + random() * .64).toFixed(2)}`);
    star.style.setProperty('--d', `${(-random() * 7).toFixed(2)}s`);
    star.style.setProperty('--t', `${(2.2 + random() * 5.6).toFixed(2)}s`);
    star.style.setProperty('--h', random() > .82 ? '188' : (random() > .72 ? '347' : '220'));
    stars.append(star);
  }
  finale.prepend(stars);
}
renderPolicies();
