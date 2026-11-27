(()=>{
"use strict";
const API="https://colony-file-api.colonyus666.workers.dev";
const $=id=>document.getElementById(id);
const copy={
en:{back:"Back to dashboard",title:"Your subscription",free:"Your current free storage plan.",pro:"5 GB of cloud storage for 30 days.",current:"Current plan",upgrade:"Subscribe to PRO",instructions:"1. Choose your transfer method. 2. Copy the account details shown below. 3. Upload your payment receipt. PRO is activated only after administrator approval.",reference:"Transaction reference (optional)",submit:"Send receipt to administrator",history:"Request status",freePlan:"FREE · 1 GB",proPlan:"PRO · 5 GB",pending:"Pending administrator review",active:"Active",rejected:"Rejected",cancelled:"Cancelled",needLogin:"Please sign in first to view your plan and submit a receipt.",sent:"Your receipt was sent to the administrator for review.",placeholder:"Transaction ID or details",amount:"Amount to pay",method:"Choose a payment method",receipt:"Select your payment receipt (image or PDF)",notConfigured:"The administrator has not entered details for this payment method yet.",ccp:"CCP account details",cpa:"CPA bank transfer details",cepa:"CEPA Transfer details",holder:"Account holder",bank:"Bank",account:"Account number",rip:"RIP",beneficiary:"Beneficiary",iban:"IBAN",swift:"SWIFT / BIC",loading:"Loading…",noFile:"No file selected",choose:"Choose an image or PDF",fileTooLarge:"The receipt must be 10 MB or smaller.",wrongFile:"Please choose an image or PDF file.",sending:"Sending receipt…",login:"Sign in",loadError:"Could not load payment information."},
fr:{back:"Retour à l’espace",title:"Votre abonnement",free:"Votre offre gratuite actuelle.",pro:"5 Go de stockage pendant 30 jours.",current:"Offre actuelle",upgrade:"Passer à PRO",instructions:"1. Choisissez le moyen de transfert. 2. Copiez les coordonnées affichées. 3. Téléversez votre reçu. PRO sera activé après validation par l’administrateur.",reference:"Référence de transaction (facultatif)",submit:"Envoyer le reçu à l’administrateur",history:"État de la demande",freePlan:"FREE · 1 Go",proPlan:"PRO · 5 Go",pending:"En attente de validation",active:"Actif",rejected:"Refusé",cancelled:"Annulé",needLogin:"Connectez-vous pour consulter votre offre et envoyer un reçu.",sent:"Votre reçu a été envoyé pour validation.",placeholder:"Référence de transaction",amount:"Montant à payer",method:"Choisissez un moyen de paiement",receipt:"Sélectionnez le reçu (image ou PDF)",notConfigured:"L’administrateur n’a pas encore renseigné ce moyen de paiement.",ccp:"Coordonnées CCP",cpa:"Virement bancaire CPA",cepa:"Coordonnées CEPA Transfer",holder:"Titulaire du compte",bank:"Banque",account:"Numéro de compte",rip:"RIP",beneficiary:"Bénéficiaire",iban:"IBAN",swift:"SWIFT / BIC",loading:"Chargement…",noFile:"Aucun fichier sélectionné",choose:"Choisir une image ou un PDF",fileTooLarge:"Le reçu ne doit pas dépasser 10 Mo.",wrongFile:"Veuillez choisir une image ou un PDF.",sending:"Envoi du reçu…",login:"Connexion",loadError:"Impossible de charger les coordonnées de paiement."},
ar:{back:"العودة إلى لوحة الزبون",title:"اشتراكي",free:"باقة التخزين المجانية الحالية.",pro:"5 جيغابايت من التخزين لمدة 30 يوماً.",current:"الباقة الحالية",upgrade:"الاشتراك في PRO",instructions:"1. اختر طريقة التحويل. 2. انسخ معلومات الحساب الظاهرة. 3. ارفع وصل الدفع. يتم تفعيل PRO بعد موافقة المدير فقط.",reference:"مرجع العملية (اختياري)",submit:"إرسال وصل الدفع إلى المدير",history:"حالة الطلب",freePlan:"FREE · 1 جيغابايت",proPlan:"PRO · 5 جيغابايت",pending:"قيد مراجعة المدير",active:"نشط",rejected:"مرفوض",cancelled:"ملغى",needLogin:"سجّل الدخول أولاً لمشاهدة باقتك وإرسال وصل الدفع.",sent:"تم إرسال وصل الدفع إلى المدير للمراجعة.",placeholder:"رقم العملية أو التفاصيل",amount:"المبلغ المطلوب دفعه",method:"اختر طريقة الدفع",receipt:"اختر وصل الدفع (صورة أو PDF)",notConfigured:"المدير لم يُدخل معلومات طريقة الدفع هذه بعد.",ccp:"معلومات حساب CCP",cpa:"معلومات التحويل البنكي CPA",cepa:"معلومات CEPA Transfer",holder:"صاحب الحساب",bank:"البنك",account:"رقم الحساب",rip:"رقم RIP",beneficiary:"المستفيد",iban:"IBAN",swift:"SWIFT / BIC",loading:"جارٍ التحميل…",noFile:"لم يتم اختيار ملف",choose:"اختر صورة أو PDF",fileTooLarge:"يجب ألا يتجاوز حجم الوصل 10 ميغابايت.",wrongFile:"اختر صورة أو ملف PDF من فضلك.",sending:"جارٍ إرسال الوصل…",login:"تسجيل الدخول",loadError:"تعذر تحميل معلومات الدفع."}
};
let langCode="en",settings={},method="ccp",accountPlan=null;
const lang=$("language"),form=$("proof-form"),file=$("receipt-file"),submit=$("submit-proof");
try{langCode=localStorage.getItem("colony-file-language")||"en"}catch(_){}
if(!copy[langCode])langCode="en";
lang.value=langCode;
const t=key=>(copy[langCode]||copy.en)[key]||copy.en[key]||key;
function setMessage(message,isError=false){const node=$("subscription-message");node.textContent=message;node.style.color=isError?"#f0a49a":"#f0cf83"}
function applyLanguage(){
 langCode=lang.value;if(!copy[langCode])langCode="en";
 const dict=copy[langCode];document.documentElement.lang=langCode;document.documentElement.dir=langCode==="ar"?"rtl":"ltr";
 document.querySelectorAll("[data-t]").forEach(node=>{const key=node.dataset.t;if(dict[key])node.textContent=dict[key]});
 form.elements.reference.placeholder=t("placeholder");
 try{localStorage.setItem("colony-file-language",langCode)}catch(_){}
 renderPayment();
 if(accountPlan)renderPlan(accountPlan);
}
lang.addEventListener("change",applyLanguage);
function setMethod(next){
 method=next;
 document.querySelectorAll(".payment-method-tab").forEach(button=>{
 const active=button.dataset.method===method;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
 });
 renderPayment();
}
document.querySelectorAll(".payment-method-tab").forEach(button=>button.addEventListener("click",()=>setMethod(button.dataset.method)));
function renderPayment(){
 const root=$("payment-instructions");root.replaceChildren();
 const heading=document.createElement("strong");heading.textContent=t(method);root.append(heading);
 const fields=method==="ccp"?[["holder",settings.ccp_holder],["account",settings.ccp_number]]:
 method==="cpa"?[["holder",settings.cpa_holder],["bank",settings.cpa_bank],["account",settings.cpa_account],["rip",settings.cpa_rip]]:
 [["beneficiary",settings.cepa_beneficiary],["bank",settings.cepa_bank],["iban",settings.cepa_iban],["swift",settings.cepa_swift]];
 const available=fields.filter(([,value])=>String(value??"").trim()!=="");
 if(!available.length){
 const legacy=settings[method+"_details"];
 const p=document.createElement("p");p.textContent=legacy||t("notConfigured");root.append(p);return;
 }
 for(const [key,value] of available){
 const row=document.createElement("p");row.className="payment-detail-line";
 const label=document.createElement("b");label.textContent=t(key)+":";
 const val=document.createElement("span");val.textContent=String(value);
 row.append(label,val);root.append(row);
 }
}
function renderPlan(data){
 accountPlan=data;
 $("current-plan").textContent=(data.plan==="PRO"?t("proPlan"):t("freePlan"))+(data.subscription?.ends_at?" · "+new Date(data.subscription.ends_at).toLocaleDateString():"");
 $("amount-dzd").textContent=Number(data.pro_price_dzd??(5*Number(settings.usd_dzd_rate||260))).toLocaleString()+" DZD";
 $("amount-usd").textContent="$"+Number(data.pro_price_usd||5).toFixed(2)+" USD";
 const history=$("subscription-history");history.textContent="—";
 if(data.subscription){
 const status=t(data.subscription.status)||data.subscription.status;
 history.textContent=(data.subscription.plan||"PRO")+" · "+status+(data.subscription.created_at?" · "+new Date(data.subscription.created_at).toLocaleDateString():"");
 }
 const isPro=data.plan==="PRO";
 submit.disabled=isPro;file.disabled=isPro;form.elements.reference.disabled=isPro;
 if(isPro)submit.textContent=t("active");else submit.textContent=t("submit");
}
async function readJson(response){
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||("HTTP "+response.status));
 return data;
}
async function loadPaymentSettings(){
 const response=await fetch(API+"/payment-settings",{method:"GET",cache:"no-store"});
 const data=await readJson(response);
 if(!data.settings||typeof data.settings!=="object")throw new Error(t("loadError"));
 settings=data.settings;renderPayment();
 $("amount-dzd").textContent=(5*Number(settings.usd_dzd_rate||260)).toLocaleString()+" DZD";
}
async function loadAccount(){
 try{
 const response=await fetch(API+"/subscription",{method:"GET",credentials:"include",cache:"no-store"});
 const data=await readJson(response);renderPlan(data);
 }catch(error){
 $("current-plan").textContent=error.message||t("needLogin");
 if(!accountPlan)$("subscription-history").textContent=t("needLogin");
 }
}
file.addEventListener("change",()=>{
 const selected=file.files&&file.files[0];
 $("receipt-filename").textContent=selected?selected.name:t("noFile");
});
form.addEventListener("submit",async event=>{
 event.preventDefault();
 const selected=file.files&&file.files[0];
 if(!selected){setMessage(t("wrongFile"),true);return}
 if(selected.size>10*1024*1024){setMessage(t("fileTooLarge"),true);return}
 const type=selected.type||"";
 if(!(type.startsWith("image/")||type==="application/pdf"||/\.pdf$/i.test(selected.name))){setMessage(t("wrongFile"),true);return}
 submit.disabled=true;submit.textContent=t("sending");setMessage(t("sending"));
 const body=new FormData(form);body.set("method",method);
 try{
 const response=await fetch(API+"/subscription/request",{method:"POST",credentials:"include",body});
 const data=await readJson(response);
 setMessage(data.message||t("sent"));
 form.reset();$("receipt-filename").textContent=t("noFile");
 await loadAccount();
 }catch(error){setMessage(error.message,true)}
 finally{if(!accountPlan||accountPlan.plan!=="PRO"){submit.disabled=false;submit.textContent=t("submit")}}
});
applyLanguage();
Promise.allSettled([loadPaymentSettings(),loadAccount()]).then(()=>renderPayment());
})();