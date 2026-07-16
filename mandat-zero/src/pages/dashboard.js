import { mountPortal, escapeHtml, toast } from '../portal.js';
import { PolicyStore, formatNumber, percent } from '../policyStore.js';

const store = new PolicyStore();
const { world, user } = await mountPortal({ active: 'dashboard', phase: 'city' });
const table = document.querySelector('#dashboardTable');
const stats = document.querySelector('#dashboardStats');
const editor = document.querySelector('#dashboardEditor');
const form = document.querySelector('#dashboardForm');


function metricGraph(values, id) {
  const width=260, height=76, pad=5;
  const min=Math.min(...values), max=Math.max(...values), range=Math.max(1,max-min);
  const points=values.map((value,index)=>`${pad+(index*(width-pad*2)/(values.length-1))},${height-pad-((value-min)/range)*(height-pad*2)}`).join(' ');
  const [firstX]=points.split(' ')[0].split(',');
  const [lastX]=points.split(' ').at(-1).split(',');
  return `<div class="dashboard-stat__graph" aria-hidden="true"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><linearGradient id="metric-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".34"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path class="dashboard-stat__area" d="M ${firstX} ${height} L ${points.replaceAll(' ', ' L ')} L ${lastX} ${height} Z" fill="url(#metric-${id})"/><polyline class="dashboard-stat__line" points="${points}"/><circle class="dashboard-stat__node" cx="${points.split(' ').at(-1).split(',')[0]}" cy="${points.split(' ').at(-1).split(',')[1]}" r="3"/></svg><i></i><i></i><i></i></div>`;
}
function render() {
  const policies=store.list(); const total=policies.reduce((sum,item)=>sum+item.support,0); const owned=policies.filter(item=>item.id.startsWith('citizen-')).length;
  stats.innerHTML = `<article class="dashboard-stat dashboard-stat--red reveal is-visible"><small>JARINGAN TERINDEKS</small><strong>${String(policies.length).padStart(2,'0')}</strong><span>mandat publik terbaca</span>${metricGraph([2,3,2,4,4,5,4,6],'network')}</article><article class="dashboard-stat dashboard-stat--cyan reveal is-visible"><small>TEKANAN PUBLIK</small><strong>${formatNumber(total)}</strong><span>suara terverifikasi</span>${metricGraph([8,11,10,15,17,16,22,26],'support')}</article><article class="dashboard-stat dashboard-stat--violet reveal is-visible"><small>SIGNAL PERSONAL</small><strong>${String(owned).padStart(2,'0')}</strong><span>mandat citizen-generated</span>${metricGraph([1,1,2,2,3,2,3,4],'owned')}</article><article class="dashboard-stat dashboard-stat--lime reveal is-visible"><small>AMBANG ESKALASI</small><strong>${String(policies.filter(item=>percent(item)>=70).length).padStart(2,'0')}</strong><span>melewati 70% target</span>${metricGraph([1,2,1,3,2,4,5,6],'escalation')}</article>`;
  table.innerHTML = policies.length ? policies.map(policy=>`<article class="dashboard-row"><div class="dashboard-row__title"><strong>${escapeHtml(policy.title)}</strong><span>${escapeHtml(policy.category)} · ${escapeHtml(policy.status)}</span></div><span>${formatNumber(policy.support)} suara</span><span>${percent(policy)}% target</span><div class="dashboard-row__actions"><a href="petition.html?id=${encodeURIComponent(policy.id)}" aria-label="Buka detail">↗</a><button data-edit="${escapeHtml(policy.id)}" aria-label="Edit">✎</button><button data-delete="${escapeHtml(policy.id)}" aria-label="Hapus">×</button></div></article>`).join('') : '<div class="portal-empty">BELUM ADA MANDAT</div>';
  document.querySelector('#activityFeed').innerHTML = policies.slice(0,5).map((policy,index)=>`<article class="activity-item"><i>${index+1}</i><div><strong>${index===0?'Momentum baru terdeteksi':'Mandat diperbarui'}</strong><span>${escapeHtml(policy.title.slice(0,55))}${policy.title.length>55?'…':''}</span></div></article>`).join('');
}

function openEditor(policy=null){ form.reset(); document.querySelector('#dashboardEditorTitle').textContent=policy?'Perbarui mandat.':'Buat mandat.'; if(policy){Object.entries(policy).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value;});}else form.target.value=10000; if(!editor.open)editor.showModal(); }
document.querySelector('#newPolicyButton').addEventListener('click',()=>openEditor());
document.querySelectorAll('[data-dashboard-close]').forEach(node=>node.addEventListener('click',()=>editor.close()));
table.addEventListener('click',event=>{const edit=event.target.closest('[data-edit]');if(edit){openEditor(store.get(edit.dataset.edit));return;}const remove=event.target.closest('[data-delete]');if(remove){if(remove.dataset.armed==='true'){store.remove(remove.dataset.delete);toast('Mandat dihapus dari perangkat.');}else{remove.dataset.armed='true';remove.textContent='?';toast('Klik sekali lagi untuk menghapus.','warning');setTimeout(()=>{remove.dataset.armed='false';remove.textContent='×';},2500);}}});
form.addEventListener('submit',event=>{event.preventDefault();const saved=store.save(Object.fromEntries(new FormData(form)));editor.close();world.pulse(saved.color);toast(saved.id.startsWith('citizen-')?'Mandat disimpan ke jaringan.':'Mandat diperbarui.');});
store.addEventListener('change',render);
const params=new URLSearchParams(location.search); if(params.get('action')==='create')openEditor(); else if(params.get('edit'))openEditor(store.get(params.get('edit')));
if(!user) document.querySelector('.dashboard-head').insertAdjacentHTML('afterend','<div class="demo-access" style="margin:0 0 22px">MODE TAMU — <strong><a href="login.html">Masuk</a></strong> untuk menghubungkan dashboard dengan identitas publikmu.</div>');
render();
