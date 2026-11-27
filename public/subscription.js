(()=>{
const API="https://colony-file-api.colonyus666.workers.dev",$=id=>document.getElementById(id);
const words={
en:{back:"Back to dashboard",title:"Your subscription",free:"Your current free storage plan.",pro:"Five gigabytes of cloud storage for 30 days.",current:"Current plan",upgrade:"Subscribe to PRO",instructions:"Choose a payment method, transfer the displayed amount, then upload your receipt. PRO is activated only after administrator approval.",reference:"Transaction reference (optional)",submit:"Send receipt to administrator",history:"Request status",freePlan:"FREE · 1 GB",proPlan:"PRO · 5 GB",pending:"Pending administrator review",active:"Active",rejected:"Rejected",cancelled:"Cancelled",needLogin:"Please sign in first.",sent:"Your receipt was sent to the administrator for review.",placeholder:"Transaction ID or details",amount:"Amount to pay",method:"Payment method",receipt:"Upload payment receipt (image or PDF)",notConfigured:"Payment details have not been configured yet. Please try again later.",ccp:"CCP payment details",cpa:"CPA bank transfer details",cepa:"CEPA Transfer details"},
fr:{back:"Retour à l’espace",title:"Votre abonnement",free:"Votre offre gratuite actuelle.",pro:"Cinq gigaoctets pendant 30 jours.",current:"Offre actuelle",upgrade:"Passer à PRO",instructions:"Choisissez un moyen de paiement, effectuez le transfert puis envoyez le reçu. PRO sera activé après validation.",reference:"Référence de transaction (facultatif)",submit:"Envoyer le reçu à l’administrateur",history:"État de la demande",freePlan:"FREE · 1 Go",proPlan:"PRO · 5 Go",pending:"En attente de validation",active:"Actif",rejected:"Refusé",cancelled:"Annulé",needLogin:"Veuillez vous connecter.",sent:"Votre reçu a été envoyé pour validation.",placeholder:"Référence de transaction",amount:"Montant à payer",method:"Mode de paiement",receipt:"Téléverser le reçu (image ou PDF)",notConfigured:"Les coordonnées de paiement ne sont pas encore configurées.",ccp:"Coordonnées CCP",cpa:"Coordonnées bancaires CPA",cepa:"Coordonnées CEPA Transfer"},
ar:{back:"العودة إلى لوحة الزبون",title:"اشتراكي",free:"باقة التخزين المجانية الحالية.",pro:"خمسة جيغابايت لمدة 30 يوماً.",current:"الباقة الحالية",upgrade:"الاشتراك في PRO",instructions:"اختر طريقة الدفع، حوّل المبلغ الظاهر، ثم ارفع صورة أو ملف وصل الدفع. يتم تفعيل PRO بعد موافقة المدير فقط.",reference:"مرجع العملية (اختياري)",submit:"إرسال الوصل إلى المدير",history:"حالة الطلب",freePlan:"FREE · 1 جيغابايت",proPlan:"PRO · 5 جيغابايت",pending:"قيد مراجعة المدير",active:"نشط",rejected:"مرفوض",cancelled:"ملغى",needLogin:"يرجى تسجيل الدخول أولاً.",sent:"تم إرسال وصل الدفع إلى المدير للمراجعة.",placeholder:"رقم العملية أو التفاصيل",amount:"المبلغ المطلوب دفعه",method:"طريقة الدفع",receipt:"ارفع وصل الدفع (صورة أو PDF)",notConfigured:"معلومات الدفع لم يضفها المدير بعد. حاول لاحقاً.",ccp:"معلومات الدفع عبر CCP",cpa:"معلومات التحويل عبر CPA",cepa:"معلومات CEPA Transfer"}
};
const lang=$("language");let current="en",payment={},selectedMethod="ccp";try{current=localStorage.getItem("colony-file-language")||"en"}catch(_){}lang.value=current;
function apply(){current=lang.value;const d=words[current]||words.en;document.documentElement.lang=current;document.documentElement.dir=current==="ar"?"rtl":"ltr";document.querySelectorAll("[data-t]").forEach(e=>{if(d[e.dataset.t])e.textContent=d[e.dataset.t]});$("proof-form").elements.reference.placeholder=d.placeholder;try{localStorage.setItem("colony-file-language",current)}catch(_){}renderPayment()}
lang.addEventListener("change",apply);
function renderPayment(){
 const d=words[current]||words.en,method=selectedMethod;
 const root=$("payment-instructions");root.replaceChildren();
 const heading=document.createElement("strong");heading.textContent=d[method]||method.toUpperCase();root.append(heading);
 const labels=current==="ar"?{holder:"اسم صاحب الحساب",bank:"اسم البنك",account:"رقم الحساب",rip:"رقم RIP",beneficiary:"اسم المستفيد",iban:"IBAN",swift:"SWIFT / BIC"}:
 current==="fr"?{holder:"Titulaire du compte",bank:"Banque",account:"Numéro de compte",rip:"RIP",beneficiary:"Bénéficiaire",iban:"IBAN",swift:"SWIFT / BIC"}:
 {holder:"Account holder",bank:"Bank name",account:"Account number",rip:"RIP number",beneficiary:"Beneficiary",iban:"IBAN",swift:"SWIFT / BIC"};
 const fields=method==="ccp"?[["holder",payment.ccp_holder],["account",payment.ccp_number]]:
 method==="cpa"?[["holder",payment.cpa_holder],["bank",payment.cpa_bank],["account",payment.cpa_account],["rip",payment.cpa_rip]]:
 [["beneficiary",payment.cepa_beneficiary],["bank",payment.cepa_bank],["iban",payment.cepa_iban],["swift",payment.cepa_swift]];
 const available=fields.filter(([,value])=>String(value||"").trim());
 if(!available.length){
   const legacy=method==="ccp"?payment.ccp_details:method==="cpa"?payment.cpa_details:payment.cepa_details;
   if(legacy){const line=document.createElement("p");line.className="payment-detail-line";line.textContent=legacy;root.append(line);}
   else{const empty=document.createElement("p");empty.textContent=d.notConfigured;root.append(empty);}
   return;
 }
 for(const [key,value] of available){const line=document.createElement("p");line.className="payment-detail-line";const label=document.createElement("b");label.textContent=labels[key]+": ";line.append(label,document.createTextNode(String(value)));root.append(line);}
}
document.querySelectorAll(".payment-method-tab").forEach(button=>button.addEventListener("click",()=>{selectedMethod=button.dataset.method;document.querySelectorAll(".payment-method-tab").forEach(tab=>{const active=tab===button;tab.classList.toggle("active",active);tab.setAttribute("aria-pressed",String(active))});renderPayment()}));
async function load(){
 const h=$("subscription-history");
 try{
   const pr=await fetch(API+"/payment-settings",{cache:"no-store"});
   const pd=await pr.json();
   if(!pr.ok)throw Error(pd.error||"Could not load payment details.");
   payment=(pd.settings&&typeof pd.settings==="object")?pd.settings:{};
   renderPayment();
 }catch(e){
   payment={};renderPayment();
   $("payment-instructions").append(document.createTextNode(" · "+e.message));
 }
 try{
   const r=await fetch(API+"/subscription",{credentials:"include",cache:"no-store"}),d=await r.json();
   if(!r.ok)throw Error(d.error||words[current].needLogin);
   $("current-plan").textContent=(d.plan==="PRO"?words[current].proPlan:words[current].freePlan)+(d.subscription?.ends_at?" · "+new Date(d.subscription.ends_at).toLocaleDateString():"");
   $("amount-dzd").textContent=Number(d.pro_price_dzd||1300).toLocaleString()+" DZD";
   $("amount-usd").textContent="$"+Number(d.pro_price_usd||5).toFixed(2)+" USD";
   h.replaceChildren();
   if(d.subscription){const p=document.createElement("p");p.textContent=(d.subscription.plan||"PRO")+" · "+(words[current][d.subscription.status]||d.subscription.status)+(d.subscription.created_at?" · "+new Date(d.subscription.created_at).toLocaleDateString():"");h.append(p)}else h.textContent="—";
   if(d.plan==="PRO"){$("submit-proof").disabled=true;$("submit-proof").textContent=words[current].active}
 }catch(e){$("current-plan").textContent=e.message;$("subscription-message").textContent=e.message}
}
$("proof-form").addEventListener("submit",async e=>{e.preventDefault();const b=$("submit-proof"),f=e.currentTarget;b.disabled=true;const data=new FormData(f);data.set("method",selectedMethod);try{const r=await fetch(API+"/subscription/request",{method:"POST",credentials:"include",body:data}),d=await r.json();if(!r.ok)throw Error(d.error||"Request failed");$("subscription-message").textContent=words[current].sent;f.reset();await load()}catch(err){$("subscription-message").textContent=err.message;b.disabled=false}});
apply();load();
})();