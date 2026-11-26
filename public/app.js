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
