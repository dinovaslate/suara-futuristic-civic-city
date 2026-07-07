import * as THREE from 'three';
import { createIcons, Landmark, Plus, Menu, FileQuestion, ChevronRight, PenLine, Share2, CheckCircle2, ArrowUpRight, Building2 } from 'lucide';
import { getPetition, listPetitions, updatePetition, subscribePetitions } from './petitionStore.js';
import './portal.css';
import './jakarta-theme.css';

const iconSet={Landmark,Plus,Menu,FileQuestion,ChevronRight,PenLine,Share2,CheckCircle2,ArrowUpRight,Building2};
const id=new URLSearchParams(location.search).get('id');
const content=document.querySelector('#detailContent');
const notFound=document.querySelector('#detailNotFound');
const supportButton=document.querySelector('#detailSupport');
const shareButton=document.querySelector('#sharePetition');
let petition=id?getPetition(id):null;
let sceneStarted=false;

const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
const number=value=>Number(value||0).toLocaleString('id-ID');
const date=value=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value));

function setText(selector,value){document.querySelector(selector).textContent=value}
function renderRelated(){
  const related=listPetitions().filter(item=>item.id!==petition.id&&item.category===petition.category).slice(0,3);
  document.querySelector('#relatedGrid').innerHTML=related.length?related.map(item=>`<a class="related-card" href="/petition.html?id=${encodeURIComponent(item.id)}"><span>${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3><small>${number(item.signatures)} dukungan - Lihat detail</small></a>`).join(''):'<p class="related-empty">Belum ada petisi lain dalam kategori ini.</p>';
}

function render(){
  petition=id?getPetition(id):null;
  notFound.hidden=Boolean(petition);
  content.hidden=!petition;
  if(!petition){createIcons({icons:iconSet});return}
  document.title=`${petition.title} - SUARA`;
  setText('#crumbCategory',petition.category);
  setText('#detailCategory',petition.category);
  setText('#detailStatus',petition.status);
  const statusEl=document.querySelector('#detailStatus');
  statusEl.className=`status-chip ${petition.status==='Aktif'?'active':petition.status==='Selesai'?'done':''}`;
  setText('#detailTitle',petition.title);
  setText('#detailOwner',petition.owner);
  setText('#detailDescription',petition.description||'Pengusul belum menambahkan uraian lengkap untuk petisi ini.');
  setText('#detailCreated',date(petition.created));
  setText('#detailUpdated',date(petition.updated));
  setText('#detailId',petition.id.slice(0,8).toUpperCase());
  setText('#detailSignatures',number(petition.signatures));
  setText('#detailTarget',number(petition.target));
  const progress=Math.min(100,Number(petition.signatures||0)/Math.max(1,Number(petition.target||1))*100);
  document.querySelector('#detailProgress').style.width=`${progress}%`;
  const canSupport=petition.status==='Aktif';
  supportButton.disabled=!canSupport;
  supportButton.innerHTML=canSupport?'<i data-lucide="pen-line"></i> Dukung petisi ini':'Petisi belum menerima dukungan';
  const notice=document.querySelector('#draftNotice');
  notice.classList.toggle('show',!canSupport);
  notice.textContent=petition.status==='Draft'?'Petisi ini masih berupa draft dan belum dibuka untuk dukungan.':'Petisi ini telah selesai dan dukungan ditutup.';
  renderRelated();
  createIcons({icons:iconSet});
  if(!sceneStarted){sceneStarted=true;createSignalScene()}
}

function toast(message){const element=document.querySelector('#detailToast');element.querySelector('span').textContent=message;element.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>element.classList.remove('show'),2600)}

supportButton.addEventListener('click',()=>{
  if(!petition||petition.status!=='Aktif')return;
  petition=updatePetition(petition.id,{signatures:Number(petition.signatures||0)+1});
  render();
  toast('Dukungan Anda sudah tercatat.');
});

shareButton.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(location.href);toast('Tautan petisi disalin.')}catch{toast('Salin URL dari bilah alamat untuk membagikan petisi.')}
});

subscribePetitions(()=>render());
render();

function createSignalScene(){
  const host=document.querySelector('#detailOrb');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,host.clientWidth/host.clientHeight,.1,80);
  camera.position.set(7.4,7.2,13.8);camera.lookAt(0,.48,0);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1));
  renderer.setSize(host.clientWidth,host.clientHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.45;
  host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xdceeff,0x020510,2.5));
  const light=new THREE.PointLight(0xff243c,34,20);light.position.set(2.8,4.5,3);scene.add(light);
  const keyLight=new THREE.DirectionalLight(0xffffff,5);keyLight.position.set(-5,8,5);scene.add(keyLight);
  const cityOffsetX=()=>host.clientWidth/host.clientHeight>1.2?2.6:0;
  const city=new THREE.Group();city.rotation.y=-.28;city.position.set(cityOffsetX(),-.35,.15);city.scale.setScalar(.82);scene.add(city);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(6.7,64),new THREE.MeshPhysicalMaterial({color:0x071225,metalness:.72,roughness:.36,transparent:true,opacity:.82,clearcoat:1}));ground.rotation.x=-Math.PI/2;city.add(ground);
  const cityGrid=new THREE.GridHelper(12,28,0xe31f36,0x263953);cityGrid.position.y=.018;cityGrid.material.transparent=true;cityGrid.material.opacity=.22;city.add(cityGrid);
  const materials=[
    new THREE.MeshStandardMaterial({color:0x162945,metalness:.62,roughness:.36,emissive:0x071224,emissiveIntensity:.6}),
    new THREE.MeshStandardMaterial({color:0xdde6f1,metalness:.52,roughness:.3,emissive:0x152030,emissiveIntensity:.24}),
    new THREE.MeshStandardMaterial({color:0x8f1729,metalness:.58,roughness:.33,emissive:0x3c0711,emissiveIntensity:.7})
  ];
  const buildingLayers=[[],[],[]];
  const centerLat=-6.17539,centerLon=106.82715,worldScale=235;
  const project=point=>new THREE.Vector2((point.lon-centerLon)*110680/worldScale,(point.lat-centerLat)*110540/worldScale);
  const buildingHeight=element=>{
    const raw=Number.parseFloat(String(element.tags?.height||'').replace(',','.'));
    const levels=Number.parseFloat(element.tags?.['building:levels']);
    const meters=Number.isFinite(raw)?raw:Number.isFinite(levels)?levels*3.2:9+(Number(element.id)%7)*2.8;
    return Math.min(Math.max(meters/worldScale,.055),.72);
  };
  const polygonArea=points=>Math.abs(points.reduce((sum,point,index)=>{const next=points[(index+1)%points.length];return sum+point.x*next.y-next.x*point.y},0)/2);
  fetch('/data/jakarta-monas-buildings.json').then(response=>response.json()).then(data=>{
    const candidates=data.elements.map(element=>({element,points:(element.geometry||[]).map(project)})).filter(item=>item.points.length>3&&polygonArea(item.points)>.00035).sort((a,b)=>a.points[0].lengthSq()-b.points[0].lengthSq()).slice(0,760);
    candidates.forEach(({element,points},index)=>{
      let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
      points.forEach(point=>{minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minZ=Math.min(minZ,point.y);maxZ=Math.max(maxZ,point.y)});
      const height=buildingHeight(element),width=Math.max(maxX-minX,.025),depth=Math.max(maxZ-minZ,.025);
      const materialIndex=element.tags?.building==='office'||index%17===0?1:index%29===0?2:0;
      buildingLayers[materialIndex].push({position:new THREE.Vector3((minX+maxX)/2,height/2+.025,-(minZ+maxZ)/2),scale:new THREE.Vector3(width,height,depth)});
    });
    const unitBox=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion();
    buildingLayers.forEach((layer,index)=>{if(!layer.length)return;const mesh=new THREE.InstancedMesh(unitBox,materials[index],layer.length);layer.forEach((building,instance)=>{matrix.compose(building.position,quaternion,building.scale);mesh.setMatrixAt(instance,matrix)});mesh.instanceMatrix.needsUpdate=true;city.add(mesh)});
    host.dataset.buildings=String(candidates.length);host.classList.add('model-ready');
  }).catch(error=>{console.error('Jakarta city data failed',error);host.classList.add('model-error')});
  const white=new THREE.MeshStandardMaterial({color:0xf2f4f7,metalness:.5,roughness:.24,emissive:0x151a22,emissiveIntensity:.35});
  const red=new THREE.MeshStandardMaterial({color:0xe31f36,metalness:.48,roughness:.22,emissive:0x620713,emissiveIntensity:1.4});
  const gold=new THREE.MeshStandardMaterial({color:0xffc343,metalness:.82,roughness:.2,emissive:0x7a3100,emissiveIntensity:1.8});
  const monas=new THREE.Group();monas.position.y=.03;city.add(monas);
  const addMonas=(geometry,material,y)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.y=y;monas.add(mesh);return mesh};
  addMonas(new THREE.BoxGeometry(.88,.13,.88),white,.065);addMonas(new THREE.BoxGeometry(.62,.16,.62),red,.19);addMonas(new THREE.CylinderGeometry(.065,.18,1.65,4),white,1.095);addMonas(new THREE.CylinderGeometry(.24,.31,.14,4),white,1.98);
  const flame=addMonas(new THREE.SphereGeometry(.13,14,9),gold,2.19);flame.scale.set(.72,1.55,.72);flame.rotation.z=-.14;
  const rings=[];
  for(let index=0;index<4;index++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.4+index*.34,.014,6,110),new THREE.MeshBasicMaterial({color:index===1?0xffffff:0xff3146,transparent:true,opacity:index===1?.42:.15}));
    ring.rotation.x=Math.PI/2;ring.position.y=.035+index*.018;city.add(ring);rings.push(ring);
  }
  const satellites=[];
  for(let index=0;index<16;index++){const node=new THREE.Mesh(new THREE.SphereGeometry(index%5===0?.065:.028,8,8),new THREE.MeshBasicMaterial({color:index%5===0?0xffffff:0xff4053}));city.add(node);satellites.push(node)}
  let last=0;
  function animate(stamp=0){requestAnimationFrame(animate);if(stamp-last<40)return;last=stamp;const time=stamp*.001;city.rotation.y=-.28+Math.sin(time*.16)*.1;city.position.y=-.35+Math.sin(time*.6)*.025;monas.rotation.y=time*.08;rings.forEach((ring,index)=>ring.rotation.z+=.0012+index*.00025);satellites.forEach((node,index)=>{const angle=time*(.22+index*.001)+index/satellites.length*Math.PI*2;const radius=3.1+(index%4)*.36;node.position.set(Math.cos(angle)*radius,.22+Math.sin(angle*1.7+index)*.7,Math.sin(angle)*radius)});renderer.render(scene,camera)}
  animate();
  window.addEventListener('resize',()=>{const width=host.clientWidth,height=host.clientHeight;camera.aspect=width/height;camera.updateProjectionMatrix();city.position.x=cityOffsetX();renderer.setSize(width,height)});
}