import {useSyncExternalStore} from 'react';
let s=[];try{s=JSON.parse(localStorage.getItem('vy_saved')||'[]')}catch{}
const L=new Set();
export const toggle=id=>{s=s.includes(id)?s.filter(x=>x!==id):[...s,id];try{localStorage.setItem('vy_saved',JSON.stringify(s))}catch{}L.forEach(f=>f());toast(s.includes(id)?'Saved (this device only)':'Removed from saved')};
export const useSaved=()=>useSyncExternalStore(f=>{L.add(f);return()=>L.delete(f)},()=>s);
export function toast(t){const e=document.createElement('div');e.id='ts';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),2200)}
