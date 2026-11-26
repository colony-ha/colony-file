(() => {
  const saved=(()=>{try{return localStorage.getItem("colony-file-language")||"en"}catch(_){return "en"}})();
  const language=document.getElementById("language");language.value=saved;
  const dictionaries={
    en:{myCloud:"MY CLOUD SPACE",myFiles:"My files",storageUsed:"Storage used",signOut:"Sign out",newFolder:"New folder",uploadFiles:"Upload files",available:"available",empty:"Your files and folders will appear here.",emptyFolder:"This folder is empty.",folderCreated:"Folder created.",uploading:"Uploading",uploaded:"Upload complete.",download:"Download",delete:"Delete",open:"Open",confirmDelete:"Permanently delete this file?",loading:"Loading your cloud space…",home:"Home",moreStorage:"Want more space? Subscribe and enjoy!",proOffer:"Upgrade to PRO for 5 GB — $5/month.",subscribe:"Subscribe to PRO",requestSent:"Your PRO request was sent. The administrator will review it.",pending:"Your PRO request is pending administrator review.",alreadyPro:"You are already on the PRO plan."},
    fr:{myCloud:"MON ESPACE CLOUD",myFiles:"Mes fichiers",storageUsed:"Stockage utilisé",signOut:"Déconnexion",newFolder:"Nouveau dossier",uploadFiles:"Importer des fichiers",available:"disponible",empty:"Vos fichiers et dossiers apparaîtront ici.",emptyFolder:"Ce dossier est vide.",folderCreated:"Dossier créé.",uploading:"Importation",uploaded:"Importation terminée.",download:"Télécharger",delete:"Supprimer",open:"Ouvrir",confirmDelete:"Supprimer définitivement ce fichier ?",loading:"Chargement de votre espace cloud…",home:"Accueil",moreStorage:"Besoin de plus d’espace ? Abonnez-vous !",proOffer:"Passez à PRO pour 5 Go — 5 $/mois.",subscribe:"S’abonner à PRO",requestSent:"Votre demande PRO a été envoyée pour validation.",pending:"Votre demande PRO est en attente de validation.",alreadyPro:"Vous utilisez déjà le forfait PRO."},
    ar:{myCloud:"مساحتي السحابية",myFiles:"ملفاتي",storageUsed:"المساحة المستعملة",signOut:"تسجيل الخروج",newFolder:"مجلد جديد",uploadFiles:"رفع الملفات",available:"متاحة",empty:"ستظهر ملفاتك ومجلداتك هنا.",emptyFolder:"هذا المجلد فارغ.",folderCreated:"تم إنشاء المجلد.",uploading:"جارٍ رفع",uploaded:"اكتمل الرفع.",download:"تنزيل",delete:"حذف",open:"فتح",confirmDelete:"هل تريد حذف هذا الملف نهائياً؟",loading:"جارٍ تحميل مساحتك السحابية…",home:"الرئيسية",moreStorage:"تريد مساحة أكبر؟ اشترك واستمتع!",proOffer:"انتقل إلى PRO لتحصل على 5 جيغابايت مقابل 5 دولارات شهرياً.",subscribe:"اشترك في PRO",requestSent:"تم إرسال طلب اشتراكك في PRO لمراجعته من طرف المدير.",pending:"طلب اشتراكك في PRO قيد المراجعة.",alreadyPro:"أنت تستعمل باقة PRO بالفعل."}
  };
  function applyLanguage(lang){const d=dictionaries[lang]||dictionaries.en;document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";document.querySelectorAll("[data-i18n]").forEach(el=>{if(d[el.dataset.i18n])el.textContent=d[el.dataset.i18n]});try{localStorage.setItem("colony-file-language",lang)}catch(_){}}
  applyLanguage(saved);
  const subscribeButton=document.getElementById("subscribe-pro");
  if(subscribeButton) subscribeButton.addEventListener("click",async()=>{
    const status=document.getElementById("subscription-status");subscribeButton.disabled=true;
    try{
      const response=await fetch("https://colony-file-api.colonyus666.workers.dev/subscription/request",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:"{}"});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Request failed.");
      status.textContent=dictionaries[language.value]?.requestSent||dictionaries.en.requestSent;
      subscribeButton.textContent=dictionaries[language.value]?.pending||dictionaries.en.pending;
    }catch(e){status.textContent=e.message;subscribeButton.disabled=false;}
  });
  language.addEventListener("change",()=>applyLanguage(language.value));
  const script=document.createElement("script");script.src="/workspace.js";document.head.append(script);
})();