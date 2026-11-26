(() => {
  const API = "https://colony-file-api.colonyus666.workers.dev";
  const area = document.getElementById("workspace-area");
  if (!area) return;
  const $ = id => document.getElementById(id);
  let user = null, folderId = null;
  const words = {
    en:{myCloud:"MY CLOUD SPACE",myFiles:"My files",storageUsed:"Storage used",signOut:"Sign out",newFolder:"New folder",uploadFiles:"Upload files",available:"available",empty:"Your files and folders will appear here.",emptyFolder:"This folder is empty.",folderCreated:"Folder created.",uploading:"Uploading",uploaded:"Upload complete.",download:"Download",share:"Share",delete:"Delete",open:"Open",confirmDelete:"Permanently delete this file?",loading:"Loading your cloud space…"},
    fr:{myCloud:"MON ESPACE CLOUD",myFiles:"Mes fichiers",storageUsed:"Stockage utilisé",signOut:"Déconnexion",newFolder:"Nouveau dossier",uploadFiles:"Importer des fichiers",available:"disponible",empty:"Vos fichiers et dossiers apparaîtront ici.",emptyFolder:"Ce dossier est vide.",folderCreated:"Dossier créé.",uploading:"Importation",uploaded:"Importation terminée.",download:"Télécharger",share:"Partager",delete:"Supprimer",open:"Ouvrir",confirmDelete:"Supprimer définitivement ce fichier ?",loading:"Chargement de votre espace cloud…"},
    ar:{myCloud:"مساحتي السحابية",myFiles:"ملفاتي",storageUsed:"المساحة المستعملة",signOut:"تسجيل الخروج",newFolder:"مجلد جديد",uploadFiles:"رفع الملفات",available:"متاحة",empty:"ستظهر ملفاتك ومجلداتك هنا.",emptyFolder:"هذا المجلد فارغ.",folderCreated:"تم إنشاء المجلد.",uploading:"جارٍ رفع",uploaded:"اكتمل الرفع.",download:"تنزيل",share:"مشاركة",delete:"حذف",open:"فتح",confirmDelete:"هل تريد حذف هذا الملف نهائياً؟",loading:"جارٍ تحميل مساحتك السحابية…"}
  };
  const lang = () => document.getElementById("language")?.value || "en";
  const t = key => words[lang()]?.[key] || words.en[key] || key;
  const bytes = n => { if (!n) return "0 B"; const u=["B","KB","MB","GB","TB"],i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),4); return (n/Math.pow(1024,i)).toFixed(i?2:0)+" "+u[i]; };
  async function request(path, options={}) {
    const r=await fetch(API+path,{credentials:"include",...options});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||"Request failed.");
    return d;
  }
  function reveal() {
    area.hidden=false;
    $("workspace-email").textContent=user.email;
    $("workspace-title").textContent=user.display_name||t("myFiles");
    document.body.style.overflow="";
  }
  async function load(id=null) {
    $("workspace-message").textContent=t("loading");
    try {
      const d=await request(id?"/folders/"+encodeURIComponent(id):"/workspace");
      folderId=id;
      if(d.user) user=d.user;
      const used=Number(user.storage_used_bytes||0), limit=Number(user.storage_limit_bytes||1073741824);
      $("storage-numbers").textContent=bytes(used)+" / "+bytes(limit);
      $("storage-progress").style.width=(limit?Math.min(100,used/limit*100):0)+"%";
      $("storage-remaining").textContent=bytes(Math.max(0,limit-used))+" "+t("available");
      $("plan-label").textContent=user.plan||"FREE";
      $("root-folder").hidden=!id;
      $("folder-current").textContent=d.folder?" / "+d.folder.name:"";
      const grid=$("workspace-items"); grid.replaceChildren();
      const folders=d.folders||[], files=d.files||[];
      if(!folders.length&&!files.length){const p=document.createElement("p");p.className="workspace-empty";p.textContent=t(id?"emptyFolder":"empty");grid.append(p);}
      folders.forEach(f=>{
        const card=document.createElement("article");card.className="workspace-item";
        const ic=document.createElement("span");ic.className="item-icon";ic.textContent="▰";
        const info=document.createElement("div");info.className="item-info";
        const name=document.createElement("strong");name.textContent=f.name;
        const meta=document.createElement("small");meta.textContent=t("open");
        const open=document.createElement("button");open.textContent=t("open");open.onclick=()=>load(f.id);
        info.append(name,meta);card.append(ic,info,open);grid.append(card);
      });
      files.forEach(f=>{
        const card=document.createElement("article");card.className="workspace-item";
        const ic=document.createElement("span");ic.className="item-icon";ic.textContent="▤";
        const info=document.createElement("div");info.className="item-info";
        const name=document.createElement("strong");name.textContent=f.original_name;
        const meta=document.createElement("small");meta.textContent=bytes(f.size_bytes);
        info.append(name,meta);
        const dl=document.createElement("button");dl.textContent="↓";dl.title=t("download");dl.onclick=()=>download(f);
        const share=document.createElement("button");share.textContent="↗";share.title=t("share");share.onclick=()=>createShare(f);
        const del=document.createElement("button");del.textContent="×";del.title=t("delete");del.onclick=()=>remove(f);
        card.append(ic,info,dl,share,del);grid.append(card);
      });
      $("workspace-message").textContent="";
    } catch(e){$("workspace-message").textContent=e.message;}
  }
  async function createShare(f) {
    try {
      const d=await request("/files/"+encodeURIComponent(f.id)+"/share",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
      await navigator.clipboard.writeText(d.url);
      $("workspace-message").textContent=(lang()==="ar"?"تم إنشاء رابط المشاركة ونسخه: ":lang()==="fr"?"Lien de partage créé et copié : ":"Share link created and copied: ")+d.url;
    } catch(e) {$("workspace-message").textContent=e.message+" — "+(lang()==="ar"?"انسخ الرابط يدوياً إذا لزم الأمر.":"");}
  }
  async function download(f) {
    try { const r=await fetch(API+"/files/"+encodeURIComponent(f.id)+"/download",{credentials:"include"}); if(!r.ok) throw new Error("Download failed."); const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=f.original_name;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url); }
    catch(e){$("workspace-message").textContent=e.message;}
  }
  async function remove(f) {
    if(!confirm(t("confirmDelete"))) return;
    try { await request("/files/"+encodeURIComponent(f.id)+"/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}); await load(folderId); }
    catch(e){$("workspace-message").textContent=e.message;}
  }
  $("folder-create-form").addEventListener("submit",async e=>{
    e.preventDefault();const form=e.currentTarget,name=new FormData(form).get("name");
    try { await request("/folders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,parentId:folderId})});form.reset();$("workspace-message").textContent=t("folderCreated");await load(folderId); }
    catch(err){$("workspace-message").textContent=err.message;}
  });
  $("root-folder").addEventListener("click",()=>load(null));
  $("file-picker").addEventListener("change",async e=>{
    const selected=[...e.target.files];e.target.value="";
    for(const f of selected){
      $("workspace-message").textContent=t("uploading")+" "+f.name;
      try {
        await request("/files/upload",{method:"POST",headers:{"Content-Type":f.type||"application/octet-stream","X-File-Name":encodeURIComponent(f.name),"X-File-Size":String(f.size),...(folderId?{"X-Folder-Id":folderId}:{})},body:f});
      } catch(err){$("workspace-message").textContent=err.message;return;}
    }
    $("workspace-message").textContent=t("uploaded");await load(folderId);
  });
  $("logout-button").addEventListener("click",async()=>{
    try{await request("/auth/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});}catch(_){}
    area.hidden=true;user=null;folderId=null;
    window.location.assign("/");
  });
  document.getElementById("language").addEventListener("change",()=>{if(user){$("workspace-title").textContent=user.display_name||t("myFiles");$("workspace-email").textContent=user.email;}});
  async function restore(){
    try {const d=await request("/auth/me");if(!d.user)return;if(d.user.role==="admin")return;if(d.user.must_change_password)return;user=d.user;reveal();await load();}
    catch(_){}
  }
  restore();
})();