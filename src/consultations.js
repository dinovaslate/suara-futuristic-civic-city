import { consultations } from './consultationData.js';
import { consultationCard, initShell, refreshIcons } from './shared.js';

initShell();

const search = document.querySelector('#directorySearch');
const status = document.querySelector('#statusFilter');
const topic = document.querySelector('#topicFilter');
const group = document.querySelector('#groupFilter');
const grid = document.querySelector('#directoryGrid');
const empty = document.querySelector('#emptyResults');
const count = document.querySelector('#resultCount');

const topics = [...new Set(consultations.map((item) => item.topic))].sort();
const groups = [...new Set(consultations.flatMap((item) => item.affectedGroups))].sort();
topic.innerHTML += topics.map((value) => `<option value="${value}">${value}</option>`).join('');
group.innerHTML += groups.map((value) => `<option value="${value}">${value}</option>`).join('');

const initialQuery = new URLSearchParams(location.search).get('q') || '';
search.value = initialQuery;

function render() {
  const query = search.value.trim().toLocaleLowerCase('id');
  const data = consultations.filter((item) => {
    const haystack = `${item.title} ${item.institution} ${item.region} ${item.topic} ${item.affectedGroups.join(' ')}`.toLocaleLowerCase('id');
    return (!query || haystack.includes(query))
      && (status.value === 'all' || item.status === status.value)
      && (topic.value === 'all' || item.topic === topic.value)
      && (group.value === 'all' || item.affectedGroups.includes(group.value));
  });
  count.textContent = data.length;
  grid.innerHTML = data.map(consultationCard).join('');
  empty.classList.toggle('show', !data.length);
  refreshIcons();
}

[search, status, topic, group].forEach((control) => control.addEventListener(control === search ? 'input' : 'change', render));
render();
