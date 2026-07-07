import { createIcons, Landmark, Plus, Menu, Search, SlidersHorizontal, ArrowUpRight, ArrowRight, FileText, Files, Users, Target } from 'lucide';
import { listPetitions, subscribePetitions } from './petitionStore.js';
import './portal.css';

const iconSet={Landmark,Plus,Menu,Search,SlidersHorizontal,ArrowUpRight,ArrowRight,FileText,Files,Users,Target};
const search=document.querySelector('#librarySearch');
const category=document.querySelector('#libraryCategory');
const status=document.querySelector('#libraryStatus');
const sort=document.querySelector('#librarySort');
const grid=document.querySelector('#petitionCardGrid');
const empty=document.querySelector('#libraryEmpty');
const count=document.querySelector('#resultCount');
let petitions=listPetitions();

const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
const number=value=>Number(value||0).toLocaleString('id-ID');
const date=value=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));

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

function render(){
  const data=filteredPetitions();
  count.textContent=data.length;
  grid.innerHTML=data.map((item,index)=>{
    const progress=Math.min(100,Math.round(Number(item.signatures||0)/Math.max(1,Number(item.target||1))*100));
    const accent=item.status==='Aktif'?'#e31f36':item.status==='Selesai'?'#8f1729':'#ff8b96';
    return `<a class="public-petition-card" href="/petition.html?id=${encodeURIComponent(item.id)}" style="--delay:${index*.045}s;--accent:${accent}" data-petition-id="${escapeHtml(item.id)}">
      <div class="public-card-head"><span>${escapeHtml(item.category)}</span><span class="public-card-status"><i></i>${escapeHtml(item.status)}</span></div>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.description||'Petisi publik yang mengundang warga untuk ikut mendorong perubahan.')}</p>
      <div class="public-card-owner"><i data-lucide="file-text"></i><span>Ditujukan kepada <b>${escapeHtml(item.owner)}</b></span></div>
      <div class="public-card-foot"><div class="public-card-count"><strong>${number(item.signatures)} dukungan</strong><small>${progress}% dari ${number(item.target)}</small></div><div class="public-card-progress"><i style="width:${progress}%"></i></div><div class="public-card-link"><span>Diperbarui ${date(item.updated)}</span><strong>Lihat detail <i data-lucide="arrow-up-right"></i></strong></div></div>
    </a>`;
  }).join('');
  empty.classList.toggle('show',data.length===0);
  createIcons({icons:iconSet});
}

[search,category,status,sort].forEach(control=>control.addEventListener(control===search?'input':'change',render));
populateCategories();
render();
subscribePetitions(records=>{petitions=records;populateCategories();render()});
