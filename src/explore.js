import * as THREE from 'three';
import { createIcons, Landmark, Plus, Menu, Move3d, ArrowUpRight, Leaf, BusFront, GraduationCap, HeartPulse } from 'lucide';
import { listPetitions, subscribePetitions } from './petitionStore.js';
import './portal.css';

const iconSet={Landmark,Plus,Menu,Move3d,ArrowUpRight,Leaf,BusFront,GraduationCap,HeartPulse};
createIcons({icons:iconSet});

const palette=['#e31f36','#ff6672','#f4f1ed','#8f1729'];
let movements=listPetitions().filter(p=>p.status!=='Draft').map((p,i)=>({...p,color:palette[i%palette.length]}));
const grid=document.querySelector('#movementGrid');
const iconName={Lingkungan:'leaf',Transportasi:'bus-front',Pendidikan:'graduation-cap',Kesehatan:'heart-pulse'};
let activeTopic='Semua';function renderCards(topic='Semua'){activeTopic=topic;
  const selected=topic==='Semua'?movements:movements.filter(p=>p.category===topic);
  grid.innerHTML=selected.map((p,i)=>`<article class="movement-card reveal" style="--card-glow:${p.color};animation-delay:${i*.08}s"><div class="movement-card-head"><span>${p.category}</span><i></i></div><div class="movement-model"><span></span></div><h3>${p.title}</h3><p>${p.description||'Gerakan publik yang sedang mengumpulkan dukungan terverifikasi.'}</p><div class="movement-progress"><div><strong>${Number(p.signatures||0).toLocaleString('id-ID')}</strong><small>dari ${Number(p.target||100000).toLocaleString('id-ID')} suara</small></div><span><i style="width:${Math.min(100,(p.signatures||0)/(p.target||1)*100)}%"></i></span></div></article>`).join('')||'<p>Tidak ada gerakan untuk topik ini.</p>';
  observeReveals();
}

document.querySelectorAll('.explore-filters button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.explore-filters button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderCards(btn.dataset.topic);pulseMarkers(btn.dataset.topic)}));

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('visible',entry.isIntersecting)),{threshold:.12});
function observeReveals(){document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}renderCards();observeReveals();subscribePetitions(records=>{movements=records.filter(p=>p.status!=='Draft').map((p,i)=>({...p,color:palette[i%palette.length]}));renderCards(activeTopic)});
document.addEventListener('pointermove',e=>{const aura=document.querySelector('.pointer-aura');aura.style.left=e.clientX+'px';aura.style.top=e.clientY+'px'});

// Smooth 3D civic globe with city beacons and animated support routes.
const host=document.querySelector('#networkScene'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,host.clientWidth/host.clientHeight,.1,100);camera.position.set(0,.15,7.7);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1:1.45));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;host.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x050a17,2.3));const rim=new THREE.DirectionalLight(0xe31f36,4);rim.position.set(4,4,6);scene.add(rim);const globe=new THREE.Group();globe.rotation.set(-.18,0,.08);scene.add(globe);
const sphere=new THREE.Mesh(new THREE.SphereGeometry(2.25,72,48),new THREE.MeshPhysicalMaterial({color:0x46101c,metalness:.18,roughness:.3,transmission:.12,transparent:true,opacity:.88}));globe.add(sphere);
const wire=new THREE.Mesh(new THREE.SphereGeometry(2.27,36,24),new THREE.MeshBasicMaterial({color:0xffdfe3,wireframe:true,transparent:true,opacity:.08}));globe.add(wire);
for(let i=0;i<5;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.65+i*.23,.012,8,160),new THREE.MeshBasicMaterial({color:i===2?0xe31f36:0x8f1729,transparent:true,opacity:i===2?.28:.12}));ring.rotation.set(Math.PI/2+(i-2)*.12,(i-2)*.28,0);globe.add(ring)}
const pointsCount=850,positions=new Float32Array(pointsCount*3);for(let i=0;i<pointsCount;i++){const y=1-i/(pointsCount-1)*2,r=Math.sqrt(1-y*y),theta=Math.PI*(3-Math.sqrt(5))*i;positions[i*3]=Math.cos(theta)*r*2.31;positions[i*3+1]=y*2.31;positions[i*3+2]=Math.sin(theta)*r*2.31}const pointGeo=new THREE.BufferGeometry();pointGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));globe.add(new THREE.Points(pointGeo,new THREE.PointsMaterial({color:0xffffff,size:.018,transparent:true,opacity:.6})));
function pointOnSphere(lat,lon,r=2.3){const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta))}
const cities=[[-6.2,106.8,'Transportasi'],[-7.25,112.75,'Pendidikan'],[-6.9,107.6,'Lingkungan'],[3.59,98.67,'Kesehatan'],[-5.15,119.4,'Lingkungan'],[-2.53,140.7,'Pendidikan'],[-8.65,115.2,'Transportasi'],[-.95,100.35,'Lingkungan'],[1.47,124.84,'Kesehatan']];
const beacons=[];cities.forEach((c,i)=>{const p=pointOnSphere(c[0],c[1]);const g=new THREE.Group();g.position.copy(p);g.lookAt(p.clone().multiplyScalar(2));const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.28,8),new THREE.MeshBasicMaterial({color:i%3===0?0xe31f36:0xff6572}));stem.rotation.x=Math.PI/2;stem.position.z=.13;const head=new THREE.Mesh(new THREE.SphereGeometry(.055,16,16),new THREE.MeshBasicMaterial({color:i%3===0?0xe31f36:0xfffafa}));head.position.z=.3;g.add(stem,head);g.userData.topic=c[2];globe.add(g);beacons.push(g)});
for(let i=0;i<12;i++){const a=cities[i%cities.length],b=cities[(i*3+2)%cities.length],start=pointOnSphere(a[0],a[1],2.33),end=pointOnSphere(b[0],b[1],2.33),mid=start.clone().add(end).normalize().multiplyScalar(3.15+(i%3)*.15);const curve=new THREE.QuadraticBezierCurve3(start,mid,end);globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(45)),new THREE.LineBasicMaterial({color:i%4===0?0xe31f36:0xb51b2f,transparent:true,opacity:i%4===0?.42:.18})))}
// A detailed smooth civic core hovering above the globe.
const core=new THREE.Group();const coreBody=new THREE.Mesh(new THREE.CylinderGeometry(.28,.42,.85,32),new THREE.MeshPhysicalMaterial({color:0xe31f36,emissive:0x620713,emissiveIntensity:.5,metalness:.35,roughness:.18}));const coreDome=new THREE.Mesh(new THREE.SphereGeometry(.29,32,18,0,Math.PI*2,0,Math.PI/2),coreBody.material);coreDome.position.y=.43;core.add(coreBody,coreDome);core.position.set(0,2.75,0);globe.add(core);
let targetX=0,targetY=0,last=0;host.addEventListener('pointermove',e=>{const box=host.getBoundingClientRect();targetY=(e.clientX-box.left)/box.width-.5;targetX=(e.clientY-box.top)/box.height-.5});function pulseMarkers(topic){beacons.forEach(b=>{const active=topic==='Semua'||b.userData.topic===topic;b.scale.setScalar(active?1.55:.65);b.visible=topic==='Semua'||active})}
function animate(stamp=0){requestAnimationFrame(animate);if(stamp-last<33)return;last=stamp;const t=stamp*.001;globe.rotation.y+=.0022+(targetY*.0015);globe.rotation.x+=(targetX*.08-globe.rotation.x)*.02;core.position.y=2.75+Math.sin(t*1.5)*.12;core.rotation.y=t*.5;beacons.forEach((b,i)=>{b.children[1].scale.setScalar(1+Math.sin(t*3+i)*.25)});renderer.render(scene,camera)}animate();
function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}window.addEventListener('resize',resize);
