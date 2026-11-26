const translations = {
  en: {
    navFeatures:"Features",navPlans:"Plans",signIn:"Sign in",eyebrow:"YOUR PERSONAL CLOUD SPACE",
    headline:"Your files.<br><em>Your space.</em><br>Your control.",intro:"Keep your important files together, access them whenever you need, and share them with simple private links.",
    getStarted:"Get started",explore:"Explore features",tagline:"Simple storage. Sharing made easy.",secureSpace:"YOUR SPACE IN THE CLOUD",
    privateLinks:"Private sharing links",accessAnywhere:"Access anywhere",freeStorage:"Free storage",proStorage:"PRO storage",yourFiles:"Your files, when you need them",
    builtAround:"BUILT AROUND YOUR FILES",featuresTitle:"Everything you need.<br><em>Nothing you don't.</em>",uploadTitle:"Easy uploads",uploadText:"Bring your files into one organized cloud space.",
    foldersTitle:"Your folders",foldersText:"Create folders with names that make sense to you.",shareTitle:"Simple sharing",shareText:"Share a file or an entire folder using one link.",
    controlTitle:"Stay in control",controlText:"Manage your links and storage from one place.",clearPlans:"CLEAR, SIMPLE PLANS",plansTitle:"Room for what <em>matters.</em>",
    forever:"/ forever",perMonth:"/ month",freeDesc:"A simple place to start storing and sharing.",startFree:"Start free",popular:"POPULAR",proDesc:"More room for the files you rely on.",choosePro:"Choose PRO",
    ready:"READY WHEN YOU ARE",ctaTitle:"Make space for what matters.",ctaText:"Your COLONY FILE space is just getting started.",contactUs:"Contact us",
    footer:"© 2026 COLONY FILE. All rights reserved.",footerNote:"CREATE • STORE • SHARE"
  },
  fr: {
    navFeatures:"Fonctionnalités",navPlans:"Offres",signIn:"Connexion",eyebrow:"VOTRE ESPACE CLOUD PERSONNEL",
    headline:"Vos fichiers.<br><em>Votre espace.</em><br>Votre contrôle.",intro:"Gardez vos fichiers importants au même endroit, accédez-y à tout moment et partagez-les avec des liens privés.",
    getStarted:"Commencer",explore:"Découvrir",tagline:"Stockage simple. Partage facile.",secureSpace:"VOTRE ESPACE DANS LE CLOUD",
    privateLinks:"Liens de partage privés",accessAnywhere:"Accès partout",freeStorage:"Stockage gratuit",proStorage:"Stockage PRO",yourFiles:"Vos fichiers, à tout moment",
    builtAround:"CONÇU AUTOUR DE VOS FICHIERS",featuresTitle:"Tout ce qu'il vous faut.<br><em>Rien de superflu.</em>",uploadTitle:"Envoi facile",uploadText:"Rassemblez vos fichiers dans un espace cloud organisé.",
    foldersTitle:"Vos dossiers",foldersText:"Créez des dossiers avec les noms de votre choix.",shareTitle:"Partage facile",shareText:"Partagez un fichier ou un dossier avec un seul lien.",
    controlTitle:"Gardez le contrôle",controlText:"Gérez vos liens et votre stockage au même endroit.",clearPlans:"DES OFFRES SIMPLES",plansTitle:"De la place pour <em>l'essentiel.</em>",
    forever:"/ pour toujours",perMonth:"/ mois",freeDesc:"Un espace simple pour commencer à stocker et partager.",startFree:"Commencer gratuitement",popular:"POPULAIRE",proDesc:"Plus d'espace pour vos fichiers importants.",choosePro:"Choisir PRO",
    ready:"QUAND VOUS ÊTES PRÊT",ctaTitle:"Faites de la place pour l'essentiel.",ctaText:"Votre espace COLONY FILE ne fait que commencer.",contactUs:"Nous contacter",
    footer:"© 2026 COLONY FILE. Tous droits réservés.",footerNote:"CRÉER • STOCKER • PARTAGER"
  },
  ar: {
    navFeatures:"المميزات",navPlans:"الاشتراكات",signIn:"تسجيل الدخول",eyebrow:"مساحتك السحابية الشخصية",
    headline:"ملفاتك.<br><em>مساحتك.</em><br>تحكمك.",intro:"اجمع ملفاتك المهمة في مكان واحد، وادخل إليها وقتما تحتاج، وشاركها بروابط خاصة وبسيطة.",
    getStarted:"ابدأ الآن",explore:"اكتشف المميزات",tagline:"تخزين بسيط. مشاركة سهلة.",secureSpace:"مساحتك في السحابة",
    privateLinks:"روابط مشاركة خاصة",accessAnywhere:"الوصول من أي مكان",freeStorage:"مساحة مجانية",proStorage:"مساحة PRO",yourFiles:"ملفاتك وقتما تحتاجها",
    builtAround:"مصمم حول ملفاتك",featuresTitle:"كل ما تحتاجه.<br><em>دون تعقيد.</em>",uploadTitle:"رفع سهل",uploadText:"اجمع ملفاتك في مساحة سحابية منظمة.",
    foldersTitle:"مجلداتك الخاصة",foldersText:"أنشئ مجلدات واختر لها الأسماء التي تريدها.",shareTitle:"مشاركة سهلة",shareText:"شارك ملفاً أو مجلداً كاملاً عبر رابط واحد.",
    controlTitle:"تحكم كامل",controlText:"أدر روابط المشاركة ومساحة التخزين من مكان واحد.",clearPlans:"اشتراكات واضحة وبسيطة",plansTitle:"مساحة أكبر لما <em>يهمك.</em>",
    forever:"/ مدى الحياة",perMonth:"/ شهرياً",freeDesc:"مساحة بسيطة لبدء التخزين والمشاركة.",startFree:"ابدأ مجاناً",popular:"الأكثر اختياراً",proDesc:"مساحة أكبر لملفاتك المهمة.",choosePro:"اختر PRO",
    ready:"نحن جاهزون عندما تكون جاهزاً",ctaTitle:"افسح مساحة لما يهمك.",ctaText:"مساحة COLONY FILE الخاصة بك في بداية الطريق.",contactUs:"اتصل بنا",
    footer:"© 2026 COLONY FILE. جميع الحقوق محفوظة.",footerNote:"أنشئ • خزّن • شارك"
  }
};
const language = document.getElementById('language');
function setLanguage(lang) {
  const dict = translations[lang] || translations.en;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const value = dict[el.dataset.i18n];
    if (value) el.innerHTML = value;
  });
  try { localStorage.setItem('colony-file-language', lang); } catch (_) {}
}
let saved = 'en';
try { saved = localStorage.getItem('colony-file-language') || 'en'; } catch (_) {}
language.value = saved;
setLanguage(saved);
language.addEventListener('change', event => setLanguage(event.target.value));


const API = "https://colony-file-api.colonyus666.workers.dev";
const authArea = document.getElementById("auth-area");
const authForm = document.getElementById("auth-form");
const resetForm = document.getElementById("reset-form");
const changeForm = document.getElementById("change-form");
const authMessage = document.getElementById("auth-message");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const nameWrap = document.getElementById("name-wrap");
let authMode = "login";
function showAuth(mode) {
  authMode = mode;
  authArea.hidden = false;
  resetForm.hidden = true;
  changeForm.hidden = true;
  authForm.hidden = false;
  nameWrap.hidden = mode !== "register";
  authTitle.textContent = mode === "register" ? "Create your account" : "Sign in";
  authSubmit.textContent = mode === "register" ? "Create account" : "Sign in";
  document.getElementById("forgot-open").hidden = mode !== "login";
  document.getElementById("auth-switch-label").textContent = mode === "login" ? "New to COLONY FILE?" : "Already have an account?";
  document.getElementById("auth-switch").textContent = mode === "login" ? "Create account" : "Sign in";
  authMessage.textContent = "";
  document.body.style.overflow = "hidden";
}
document.querySelectorAll("[data-auth-open]").forEach(button => button.addEventListener("click", event => { event.preventDefault(); showAuth(button.dataset.authOpen); }));
document.getElementById("auth-close").addEventListener("click", () => { authArea.hidden = true; document.body.style.overflow = ""; });
document.getElementById("admin-area").hidden = true;
document.getElementById("auth-switch").addEventListener("click", () => showAuth(authMode === "login" ? "register" : "login"));
document.getElementById("forgot-open").addEventListener("click", () => {
  authForm.hidden = true; resetForm.hidden = false; changeForm.hidden = true;
  authTitle.textContent = "Reset password"; authMessage.textContent = "";
});
document.getElementById("reset-back").addEventListener("click", () => showAuth("login"));
async function api(path, body) {
  const response = await fetch(API + path, {method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
authForm.addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(authForm);
  authSubmit.disabled = true; authMessage.textContent = "Please wait…";
  try {
    const path = authMode === "register" ? "/auth/register" : "/auth/login";
    const data = await api(path, {email:form.get("email"),password:form.get("password"),displayName:form.get("displayName")});
    authMessage.textContent = "Signed in successfully.";
    if (data.user?.must_change_password) {
      authForm.hidden = true; resetForm.hidden = true; changeForm.hidden = false;
      authTitle.textContent = "Change your password";
    } else {
      authTitle.textContent = "Welcome to COLONY FILE";
      authForm.hidden = true;
      authMessage.textContent = data.user?.role === "admin" ? "Administrator signed in." : "Your account is ready. File workspace features are coming next.";
      if (data.user?.role === "admin" && data.user?.email?.toLowerCase() === "hanih9823@gmail.com") {
        document.getElementById("admin-area").hidden = false;
        loadAdminRequests();
      }
    }
  } catch(error) { authMessage.textContent = error.message; }
  finally { authSubmit.disabled = false; }
});
resetForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = new FormData(resetForm).get("email");
  const button = resetForm.querySelector("button[type=submit]");
  button.disabled = true; authMessage.textContent = "Sending request…";
  try {
    const data = await api("/auth/password-reset-request",{email});
    authMessage.textContent = data.message || "Request submitted.";
  } catch(error) { authMessage.textContent = error.message; }
  finally { button.disabled = false; }
});
changeForm.addEventListener("submit", async event => {
  event.preventDefault();
  const values = new FormData(changeForm);
  const button = changeForm.querySelector("button[type=submit]");
  button.disabled = true; authMessage.textContent = "Updating password…";
  try {
    const data = await api("/auth/change-password",{currentPassword:values.get("currentPassword"),newPassword:values.get("newPassword")});
    authMessage.textContent = data.message || "Password updated. Please sign in again.";
    changeForm.reset();
  } catch(error) { authMessage.textContent = error.message; }
  finally { button.disabled = false; }
});


async function loadAdminRequests() {
  const list = document.getElementById("admin-requests");
  list.innerHTML = "<p>Loading requests…</p>";
  try {
    const response = await fetch(API + "/admin/password-reset-requests", {credentials:"include"});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load requests.");
    if (!data.requests?.length) { list.innerHTML = "<p>No requests yet.</p>"; return; }
    list.replaceChildren();
    data.requests.forEach(item => {
      const card = document.createElement("article"); card.className = "admin-request";
      const info = document.createElement("div");
      const email = document.createElement("strong"); email.textContent = item.email;
      const meta = document.createElement("small"); meta.textContent = (item.display_name || "User") + " · " + item.status + " · " + new Date(item.requested_at).toLocaleString();
      info.append(email,meta); card.append(info);
      if (item.status === "pending") {
        const actions = document.createElement("div"); actions.className = "admin-request-actions";
        const password = document.createElement("input"); password.type="password"; password.minLength=10; password.maxLength=128; password.placeholder="Temporary password (10+ chars)";
        const approve = document.createElement("button"); approve.className="button button-gold"; approve.textContent="Approve";
        approve.addEventListener("click", async () => {
          if(password.value.length<10){ alert("Temporary password must be at least 10 characters."); return; }
          approve.disabled=true;
          try { await api("/admin/password-reset-requests/review",{requestId:item.id,action:"approve",temporaryPassword:password.value}); await loadAdminRequests(); }
          catch(e){ alert(e.message); approve.disabled=false; }
        });
        const reject = document.createElement("button"); reject.className="button button-outline"; reject.textContent="Reject";
        reject.addEventListener("click", async () => {
          if(!confirm("Reject this password reset request?")) return;
          reject.disabled=true;
          try { await api("/admin/password-reset-requests/review",{requestId:item.id,action:"reject"}); await loadAdminRequests(); }
          catch(e){ alert(e.message); reject.disabled=false; }
        });
        actions.append(password,approve,reject); card.append(actions);
      }
      list.append(card);
    });
  } catch(error) { list.textContent = error.message; }
}
document.getElementById("admin-refresh").addEventListener("click", loadAdminRequests);

const adminSetupArea=document.getElementById("admin-setup-area");
if(location.hash==="#admin-setup") adminSetupArea.hidden=false;
document.getElementById("admin-setup-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget, values=new FormData(form), button=form.querySelector("button"), message=document.getElementById("admin-setup-message");
  button.disabled=true; message.textContent="Activating administrator…";
  try {
    const response=await fetch(API+"/admin/bootstrap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({setupKey:values.get("setupKey"),email:values.get("email"),password:values.get("password")})});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Setup failed.");
    message.textContent=data.message||"Administrator activated. Sign in normally.";
    form.reset();
  } catch(error) { message.textContent=error.message; }
  finally { button.disabled=false; }
});
