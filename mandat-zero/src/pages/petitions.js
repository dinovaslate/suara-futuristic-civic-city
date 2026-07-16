import { mountPortal, escapeHtml } from '../portal.js';
import { PolicyStore, formatNumber, percent } from '../policyStore.js';

const store = new PolicyStore();
await mountPortal({ active: 'petitions', phase: 'network' });

const list = document.querySelector('#directoryList');
const empty = document.querySelector('#directoryEmpty');
const search = document.querySelector('#directorySearch');
const sort = document.querySelector('#directorySort');
const categories = document.querySelector('#directoryCategories');
let category = 'all';

function momentum(policy) {
  return policy.support / Math.max(1, Date.now() - new Date(policy.createdAt).getTime());
}

function renderCategories() {
  const policies = store.list();
  const values = ['all', 'Kota', 'Iklim', 'Digital', 'Kesehatan'];
  categories.innerHTML = values.map(value => {
    const count = value === 'all' ? policies.length : policies.filter(item => item.category === value).length;
    return `<button class="${category === value ? 'is-active' : ''}" data-category="${value}"><span>${value === 'all' ? 'Semua signal' : value}</span><b>${String(count).padStart(2,'0')}</b></button>`;
  }).join('');
}

function filtered() {
  const query = search.value.trim().toLowerCase();
  const policies = store.list().filter(policy => {
    const categoryMatch = category === 'all' || policy.category === category;
    const text = `${policy.title} ${policy.owner} ${policy.region} ${policy.summary}`.toLowerCase();
    return categoryMatch && (!query || text.includes(query));
  });
  policies.sort((a,b) => sort.value === 'support' ? b.support-a.support : sort.value === 'newest' ? new Date(b.createdAt)-new Date(a.createdAt) : momentum(b)-momentum(a));
  return policies;
}

function render() {
  const policies = filtered();
  document.querySelector('#directoryTotal').textContent = String(store.list().length).padStart(2,'0');
  document.querySelector('#directoryCount').textContent = `${policies.length} HASIL`;
  empty.hidden = policies.length > 0;
  list.innerHTML = policies.map((policy,index) => `
    <a class="directory-card reveal is-visible" href="petition.html?id=${encodeURIComponent(policy.id)}" style="--accent:${escapeHtml(policy.color)}">
      <span class="directory-card__index">${String(index+1).padStart(2,'0')}</span>
      <div class="directory-card__copy"><small>${escapeHtml(policy.category)} · ${escapeHtml(policy.region)}</small><h3>${escapeHtml(policy.title)}</h3><p>${escapeHtml(policy.summary)}</p></div>
      <div class="directory-card__meter" style="--progress:${percent(policy)}%"><strong>${formatNumber(policy.support)}</strong><span>${percent(policy)}% DARI ${formatNumber(policy.target)}</span><i></i></div>
      <span class="directory-card__arrow">↗</span>
    </a>`).join('');
}

categories.addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  renderCategories(); render();
});
search.addEventListener('input', render);
sort.addEventListener('change', render);
store.addEventListener('change', () => { renderCategories(); render(); });
renderCategories(); render();
