(()=>{
const API="https://colony-file-api.colonyus666.workers.dev";
const token=new URLSearchParams(location.search).get("token");
const title=document.getElementById("share-title"),desc=document.getElementById("share-description"),link=document.getElementById("share-download"),error=document.getElementById("share-error");
const fmt=n=>{if(!n)return "0 B";const u=["B","KB","MB","GB","TB"],i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),4);return(n/Math.pow(1024,i)).toFixed(i?2:0)+" "+u[i]};
(async()=>{
if(!token){error.textContent="This sharing link is invalid.";desc.textContent="";return}
try{
const r=await fetch(API+"/public/share/"+encodeURIComponent(token));const d=await r.json();if(!r.ok)throw new Error(d.error||"This link is unavailable.");
title.textContent=d.file.name;desc.textContent="Shared file · "+fmt(d.file.size_bytes);
link.href=API+"/public/share/"+encodeURIComponent(token)+"/download";link.hidden=false;
}catch(e){title.textContent="File unavailable";desc.textContent="";error.textContent=e.message}
})();
})();