const STORAGE_KEY='suara_petitions_v2';

function read(){
  try{
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    return Array.isArray(value)?value:[];
  }catch{return []}
}

function write(records,action,id){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(records));
  window.dispatchEvent(new CustomEvent('suara:petitions-changed',{detail:{action,id,records}}));
  return records;
}

function id(){return globalThis.crypto?.randomUUID?.()||`petition-${Date.now()}-${Math.random().toString(16).slice(2)}`}
function cleanText(value){return String(value||'').trim()}
function normalize(input,existing={}){
  const title=cleanText(input.title??existing.title),owner=cleanText(input.owner??existing.owner),description=cleanText(input.description??existing.description);
  if(!title)throw new Error('Judul petisi wajib diisi.');
  if(!owner)throw new Error('Tujuan petisi wajib diisi.');
  const target=Math.max(100,Number(input.target??existing.target??10000)||10000),signatures=Math.max(0,Number(input.signatures??existing.signatures??0)||0);
  return {...existing,...input,title,owner,description,category:cleanText(input.category??existing.category)||'Umum',status:cleanText(input.status??existing.status)||'Draft',target,signatures,updated:new Date().toISOString(),created:existing.created||new Date().toISOString()};
}

export function listPetitions(){return read().sort((a,b)=>new Date(b.updated)-new Date(a.updated))}
export function getPetition(recordId){return read().find(item=>item.id===recordId)||null}
export function createPetition(input){const record={id:id(),...normalize(input)};write([record,...read()],'create',record.id);return record}
export function updatePetition(recordId,input){const records=read(),index=records.findIndex(item=>item.id===recordId);if(index<0)throw new Error('Petisi tidak ditemukan.');const record={id:recordId,...normalize(input,records[index])};records[index]=record;write(records,'update',recordId);return record}
export function deletePetition(recordId){const records=read(),next=records.filter(item=>item.id!==recordId);if(next.length===records.length)return false;write(next,'delete',recordId);return true}
export function subscribePetitions(callback){const local=event=>callback(event.detail?.records||listPetitions());const remote=event=>{if(event.key===STORAGE_KEY)callback(listPetitions())};window.addEventListener('suara:petitions-changed',local);window.addEventListener('storage',remote);return()=>{window.removeEventListener('suara:petitions-changed',local);window.removeEventListener('storage',remote)}}
