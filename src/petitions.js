import { createIcons, Landmark, Plus, Menu, Search, ArrowUpRight, ArrowRight, FileText, Files, Users, Target, Sparkles, MessageCircle, Compass, LayoutDashboard, HeartHandshake, Bookmark, CalendarDays } from 'lucide';
import { listPetitions, subscribePetitions } from './petitionStore.js';
import './portal.css';
import './civic-mesh.js';

const iconSet={Landmark,Plus,Menu,Search,ArrowUpRight,ArrowRight,FileText,Files,Users,Target,Sparkles,MessageCircle,Compass,LayoutDashboard,HeartHandshake,Bookmark,CalendarDays};
const search=document.querySelector('#librarySearch');
const category=document.querySelector('#libraryCategory');
const status=document.querySelector('#libraryStatus');
const sort=document.querySelector('#librarySort');
const grid=document.querySelector('#petitionCardGrid');
const empty=document.querySelector('#libraryEmpty');
const count=document.querySelector('#resultCount');
const totalSupport=document.querySelector('#libraryTotalSupport');
const activeCount=document.querySelector('#libraryActiveCount');
const topCategory=document.querySelector('#libraryTopCategory');
const latestItem=document.querySelector('#libraryLatestItem');
let petitions=listPetitions();

const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
const number=value=>Number(value||0).toLocaleString('id-ID');
const date=value=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));
const initials=value=>String(value||'SU').trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase()||'SU';
const excerpt=value=>String(value||'Petisi publik yang mengundang warga untuk ikut mendorong perubahan.').trim().slice(0,170);

function populateCategories(){
  const current=category.value;
  const values=[...new Set(petitions.map(item=>item.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
  category.innerHTML='<option value="Semua">Semua kategori</option>'+values.map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  category.value=values.includes(current)?current:'Semua';
}

function filteredPetitions(){
  const query=search.value.trim().toLocaleLowerCase('id');
  const selectedCategory=category.value;
  const selectedStatus=status.value;
  const result=petitions.filter(item=>{
    const haystack=`${item.title} ${item.description} ${item.owner} ${item.category}`.toLocaleLowerCase('id');
    return (!query||haystack.includes(query))&&(selectedCategory==='Semua'||item.category===selectedCategory)&&(selectedStatus==='Semua'||item.status===selectedStatus);
  });
  return result.sort((a,b)=>{
    if(sort.value==='popular')return Number(b.signatures||0)-Number(a.signatures||0);
    if(sort.value==='progress')return (Number(b.signatures||0)/Math.max(1,Number(b.target||1)))-(Number(a.signatures||0)/Math.max(1,Number(a.target||1)));
    return new Date(b.updated)-new Date(a.updated);
  });
}

function updateSidePanel(data){
  const all=petitions;
  const support=all.reduce((sum,item)=>sum+Number(item.signatures||0),0);
  const active=all.filter(item=>item.status==='Aktif').length;
  const categoryCounts=all.reduce((map,item)=>{
    const key=item.category||'Umum';
    map[key]=(map[key]||0)+1;
    return map;
  },{});
  const top=Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'Umum';
  const latest=[...all].sort((a,b)=>new Date(b.updated)-new Date(a.updated))[0];

  if(totalSupport)totalSupport.textContent=number(support);
  if(activeCount)activeCount.textContent=number(active);
  if(topCategory)topCategory.textContent=top;
  if(latestItem)latestItem.innerHTML=latest?`Terbaru: <b>${escapeHtml(latest.title)}</b><small>${date(latest.updated)} · ${escapeHtml(latest.status)}</small>`:'Belum ada pembaruan.';
}

function render(){
  const data=filteredPetitions();
  count.textContent=data.length;
  grid.innerHTML=data.map((item,index)=>{
    const progress=Math.min(100,Math.round(Number(item.signatures||0)/Math.max(1,Number(item.target||1))*100));
    const accent=item.status==='Aktif'?'#e31f36':item.status==='Selesai'?'#8f1729':'#ff8b96';
    return `<a class="public-petition-card social-post-card" href="/petition.html?id=${encodeURIComponent(item.id)}" style="--delay:${index*.045}s;--accent:${accent};--progress:${progress}%" data-petition-id="${escapeHtml(item.id)}">
      <div class="post-author">
        <span class="post-avatar">${escapeHtml(initials(item.category))}</span>
        <div><b>Ruang ${escapeHtml(item.category||'Umum')}</b><small>${escapeHtml(item.owner||'Warga')} · diperbarui ${date(item.updated)}</small></div>
        <span class="public-card-status"><i></i>${escapeHtml(item.status)}</span>
      </div>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(excerpt(item.description))}</p>
      <div class="post-visual-strip">
        <div class="post-meter-copy"><span>Progress dukungan</span><strong>${number(item.signatures)} suara</strong><small>${progress}% dari target ${number(item.target)}</small></div>
        <div class="post-orbit" aria-hidden="true"><i></i><i></i><b></b></div>
      </div>
      <div class="public-card-progress"><i style="width:${progress}%"></i></div>
      <div class="post-actions">
        <span><i data-lucide="users"></i>${number(item.signatures)}</span>
        <span><i data-lucide="target"></i>${number(item.target)}</span>
        <span><i data-lucide="bookmark"></i>Detail</span>
        <strong>Lihat detail <i data-lucide="arrow-up-right"></i></strong>
      </div>
    </a>`;
  }).join('');
  empty.classList.toggle('show',data.length===0);
  updateSidePanel(data);
  createIcons({icons:iconSet});
}

[search,category,status,sort].forEach(control=>control.addEventListener(control===search?'input':'change',render));
populateCategories();
render();
subscribePetitions(records=>{petitions=records;populateCategories();render()});
