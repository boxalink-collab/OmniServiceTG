/* ══════════════════════════════════════════
   OmniService TG — app.js v4.0
   + Authentification complète (Inscription/Connexion)
   + Commandes liées au compte utilisateur (UID)
   + Avatars homme/femme
   + Suppression du téléphone dans les formulaires de commande
   ══════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where,
  getDocs, orderBy, serverTimestamp, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── Config Firebase ──
const firebaseConfig = {
  apiKey: "AIzaSyDtDK7-iDRy1E-kjZubjyjkPW7Th33BMyU",
  authDomain: "omniservicetg-59df3.firebaseapp.com",
  projectId: "omniservicetg-59df3",
  storageBucket: "omniservicetg-59df3.firebasestorage.app",
  messagingSenderId: "196278567761",
  appId: "1:196278567761:web:4f6416acaab58b67bf4970"
};

const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);
const auth  = getAuth(fbApp);

// ════════════════════════════════════════
// ÉTAT GLOBAL
// ════════════════════════════════════════
let currentUser     = null;   // profil Firestore de l'utilisateur connecté
let currentService  = null;
let cart            = {};
let locMode         = 'gps';
let gpsCoords       = null;
let selectedPayment = 'livraison';
let sliderIdx       = 0;
let sliderTimer     = null;

const CATALOGUE_SERVICES = ['food', 'restaurant', 'clothes'];

// ════════════════════════════════════════
// SPLASH SCREEN
// ════════════════════════════════════════
function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  splash.classList.add('hidden');
  setTimeout(() => { splash.style.display = 'none'; }, 500);
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(hideSplash, 2800);
});

// ════════════════════════════════════════
// PWA
// ════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('SW:', r.scope))
      .catch(e => console.log('SW err:', e));
  });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => {
    const banner = document.getElementById('pwa-banner');
    if (banner && !localStorage.getItem('pwa-dismissed')) banner.style.display = 'block';
  }, 4000);
});

document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('pwa-banner').style.display = 'none';
  if (result.outcome === 'accepted') showToast('✅ OmniService TG installé !', '#2E7D32');
});

function dismissPWA() {
  document.getElementById('pwa-banner').style.display = 'none';
  localStorage.setItem('pwa-dismissed', '1');
}
window.dismissPWA = dismissPWA;

window.addEventListener('appinstalled', () => {
  document.getElementById('pwa-banner').style.display = 'none';
  deferredPrompt = null;
});

// ════════════════════════════════════════
// AUTH — ÉCOUTEUR ÉTAT CONNEXION
// ════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Charger le profil depuis Firestore
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        currentUser = { uid: user.uid, ...snap.data() };
      } else {
        currentUser = { uid: user.uid, email: user.email };
      }
    } catch(e) {
      currentUser = { uid: user.uid, email: user.email };
    }
    updateNavForAuth(true);
    updateProfilePage();
    closeAuthModal();
    // Si on est sur la page commandes, charger automatiquement
    if (document.getElementById('p-orders')?.classList.contains('on')) {
      loadMyOrders();
    }
  } else {
    currentUser = null;
    updateNavForAuth(false);
    updateProfilePage();
  }
});

// ── Mettre à jour la navigation selon l'état auth ──
function updateNavForAuth(isLoggedIn) {
  const btnProfile = document.getElementById('nav-btn-profile');
  if (!btnProfile) return;
  if (isLoggedIn && currentUser) {
    const avatar = currentUser.genre === 'femme' ? '👩' : '👨';
    btnProfile.textContent = avatar;
    btnProfile.title = currentUser.prenom || 'Mon profil';
  } else {
    btnProfile.textContent = '👤';
    btnProfile.title = 'Connexion / Inscription';
  }
}

// ════════════════════════════════════════
// AUTH MODAL — Afficher/Fermer
// ════════════════════════════════════════
function openAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  switchAuthTab(mode);
}
window.openAuthModal = openAuthModal;

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
}
window.closeAuthModal = closeAuthModal;

function switchAuthTab(tab) {
  document.getElementById('auth-login-panel').style.display  = tab === 'login'    ? 'block' : 'none';
  document.getElementById('auth-signup-panel').style.display = tab === 'signup'   ? 'block' : 'none';
  document.getElementById('auth-tab-login').classList.toggle('on',  tab === 'login');
  document.getElementById('auth-tab-signup').classList.toggle('on', tab === 'signup');
  document.getElementById('auth-err').textContent = '';
}
window.switchAuthTab = switchAuthTab;

// ── CONNEXION ──
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('auth-err');
  const btn   = document.getElementById('login-btn');

  if (!email || !pass) { err.textContent = '⚠️ Email et mot de passe requis.'; return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Connexion...';
  err.textContent = '';

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    showToast('✅ Connecté avec succès !', '#2E7D32');
  } catch(e) {
    const msgs = {
      'auth/invalid-credential': '❌ Email ou mot de passe incorrect.',
      'auth/user-not-found':     '❌ Aucun compte avec cet email.',
      'auth/wrong-password':     '❌ Mot de passe incorrect.',
      'auth/too-many-requests':  '❌ Trop de tentatives. Réessayez plus tard.',
    };
    err.textContent = msgs[e.code] || '❌ Erreur de connexion. Réessayez.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Se connecter →';
  }
}
window.doLogin = doLogin;

// ── INSCRIPTION ──
async function doSignup() {
  const nom     = document.getElementById('signup-nom').value.trim();
  const prenom  = document.getElementById('signup-prenom').value.trim();
  const genre   = document.getElementById('signup-genre').value;
  const phone   = document.getElementById('signup-phone').value.trim();
  const ville   = document.getElementById('signup-ville').value.trim();
  const email   = document.getElementById('signup-email').value.trim();
  const pass    = document.getElementById('signup-pass').value;
  const pass2   = document.getElementById('signup-pass2').value;
  const err     = document.getElementById('auth-err');
  const btn     = document.getElementById('signup-btn');

  if (!nom || !prenom || !genre || !phone || !ville || !email || !pass) {
    err.textContent = '⚠️ Veuillez remplir tous les champs.'; return;
  }
  if (pass.length < 6) { err.textContent = '⚠️ Mot de passe : minimum 6 caractères.'; return; }
  if (pass !== pass2)  { err.textContent = '⚠️ Les mots de passe ne correspondent pas.'; return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Inscription...';
  err.textContent = '';

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // Sauvegarder le profil dans Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      nom, prenom, genre, phone, ville, email,
      createdAt: serverTimestamp()
    });
    showToast(`✅ Bienvenue ${prenom} !`, '#2E7D32');
  } catch(e) {
    const msgs = {
      'auth/email-already-in-use': '❌ Cet email est déjà utilisé.',
      'auth/invalid-email':        '❌ Email invalide.',
      'auth/weak-password':        '❌ Mot de passe trop faible (min. 6 caractères).',
    };
    err.textContent = msgs[e.code] || '❌ Erreur : ' + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "S'inscrire →";
  }
}
window.doSignup = doSignup;

// ── DÉCONNEXION ──
async function doLogout() {
  await signOut(auth);
  showToast('👋 Déconnecté.', '#4A4A6A');
  goTab('home');
}
window.doLogout = doLogout;

// ════════════════════════════════════════
// PAGE PROFIL
// ════════════════════════════════════════
function updateProfilePage() {
  const heroAvatar = document.getElementById('prof-avatar');
  const heroName   = document.getElementById('prof-name-disp');
  const heroSub    = document.getElementById('prof-phone-disp');
  const profCard   = document.getElementById('prof-logged-card');
  const authCard   = document.getElementById('prof-auth-card');

  if (currentUser) {
    const avatar = currentUser.genre === 'femme' ? '👩' : '👨';
    if (heroAvatar) heroAvatar.textContent = avatar;
    if (heroName)   heroName.textContent   = `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || 'Mon Profil';
    if (heroSub)    heroSub.textContent    = currentUser.phone || currentUser.email || '';
    if (profCard)   profCard.style.display = 'block';
    if (authCard)   authCard.style.display = 'none';
    // Remplir les champs info
    const fi = {
      'pf-nom':    currentUser.nom    || '',
      'pf-prenom': currentUser.prenom || '',
      'pf-phone':  currentUser.phone  || '',
      'pf-ville':  currentUser.ville  || '',
      'pf-email':  currentUser.email  || '',
    };
    Object.entries(fi).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
    // Afficher la ville dans le sous-titre
    if (heroSub && currentUser.ville) {
      heroSub.textContent = `📍 ${currentUser.ville} · ${currentUser.phone || ''}`;
    }
  } else {
    if (heroAvatar) heroAvatar.textContent = '👤';
    if (heroName)   heroName.textContent   = 'Mon Profil';
    if (heroSub)    heroSub.textContent    = 'Connectez-vous pour accéder à votre compte';
    if (profCard)   profCard.style.display = 'none';
    if (authCard)   authCard.style.display = 'block';
  }
}

async function saveProfile() {
  if (!currentUser) { openAuthModal('login'); return; }
  const nom    = document.getElementById('pf-nom').value.trim();
  const prenom = document.getElementById('pf-prenom').value.trim();
  const phone  = document.getElementById('pf-phone').value.trim();
  const ville  = document.getElementById('pf-ville').value.trim();

  try {
    await setDoc(doc(db, 'users', currentUser.uid), { nom, prenom, phone, ville }, { merge: true });
    currentUser = { ...currentUser, nom, prenom, phone, ville };
    updateProfilePage();
    updateNavForAuth(true);
    showToast('✅ Profil mis à jour !', '#2E7D32');
  } catch(e) {
    showToast('❌ Erreur de sauvegarde.', '#C62828');
  }
}
window.saveProfile = saveProfile;

// ════════════════════════════════════════
// DÉFINITION DES SERVICES
// (sans champ phone — récupéré depuis le profil)
// ════════════════════════════════════════
const SVCS = {
  food: {
    name:"Alimentation & Produits locaux", icon:"🥘", bg:"#FFF3E0", active:true,
    fields:[
      {n:"produits",l:"Produits souhaités",t:"textarea",ph:"Ex : 2 kg de Tilapia, 1 bouteille de vin de palme..."},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"},
      {n:"date",l:"Date souhaitée",t:"date"},
      {n:"notes",l:"Remarques (optionnel)",t:"textarea",ph:"Précisions...",opt:true}
    ]
  },
  restaurant: {
    name:"Restauration", icon:"🍽️", bg:"#E3F2FD", active:true,
    fields:[
      {n:"type",l:"Type de service",t:"select",opts:["Plat restaurant partenaire","Service traiteur événement"]},
      {n:"commande",l:"Plat ou menu souhaité",t:"textarea",ph:"Décrivez votre commande..."},
      {n:"personnes",l:"Nombre de personnes",t:"number",ph:"Ex : 4"},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"}
    ]
  },
  delivery: {
    name:"Livraison & Courses", icon:"🚚", bg:"#FFF3E0", active:true,
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Livraison express","Courses personnalisées","Livraison entreprise","Livraison de plats"]},
      {n:"detail",l:"Lieu de collecte / Liste d'articles",t:"textarea",ph:"Adresse ou liste..."},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"},
      {n:"urgence",l:"Urgence",t:"select",opts:["Express (< 1h)","Dans la journée","Planifier"]}
    ]
  },
  maintenance: {
    name:"Maintenance Technique", icon:"🔧", bg:"#E3F2FD", active:false, soon:"16 Mars 2026",
    fields:[
      {n:"type",l:"Type d'intervention",t:"select",opts:["Électricité","Plomberie","Voiture","Électroménager","Informatique","Pose TV/Antenne","Autres travaux"]},
      {n:"problem",l:"Description du problème",t:"textarea",ph:"Décrivez le problème..."},
      {n:"adresse",l:"Adresse",t:"text",ph:"Votre adresse à Lomé"}
    ]
  },
  clothes: {
    name:"Prêt-à-porter", icon:"👗", bg:"#FFF3E0", active:true,
    fields:[
      {n:"categorie",l:"Catégorie",t:"select",opts:["Vêtements Homme","Vêtements Femme","Vêtements Enfant","Sacs","Chaussures","Cosmétiques & Accessoires"]},
      {n:"article",l:"Article souhaité",t:"textarea",ph:"Couleur, taille, style..."},
      {n:"budget",l:"Budget estimé (FCFA)",t:"number",ph:"Ex : 15000"},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"}
    ]
  },
  cleaning: {
    name:"Entretien & Nettoyage", icon:"🧹", bg:"#E3F2FD", active:true,
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Nettoyage résidentiel","Nettoyage bureaux","Entretien régulier","Entretien industriel"]},
      {n:"superficie",l:"Superficie (m²)",t:"number",ph:"Ex : 60"},
      {n:"adresse",l:"Adresse",t:"text",ph:"Votre adresse à Lomé"},
      {n:"date",l:"Date souhaitée",t:"date"}
    ]
  },
  security: {
    name:"Gardiennage & Sécurité", icon:"🛡️", bg:"#E3F2FD", active:false, soon:"7 Avril 2026",
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Gardiennage Résidentiel","Gardiennage Boutique","Sécurité Événementielle","Surveillance Temporaire"]},
      {n:"detail",l:"Description du besoin",t:"textarea",ph:"Vos besoins en sécurité..."},
      {n:"adresse",l:"Lieu / Adresse",t:"text",ph:"Votre adresse à Lomé"}
    ]
  }
};

// ════════════════════════════════════════
// ARTICLES PAR DÉFAUT
// ════════════════════════════════════════
const DEFAULT_ARTICLES = {
  food: [
    {id:'f1',name:'Tilapia frais',desc:'Par kg, pêche locale',price:3500,unit:'kg',emoji:'🐟'},
    {id:'f2',name:'Poulet fermier',desc:'Par pièce, élevage local',price:5500,unit:'pièce',emoji:'🐔'},
    {id:'f3',name:'Légumes assortis',desc:'Tomates, oignons, piment',price:1500,unit:'panier',emoji:'🥬'},
    {id:'f4',name:'Vin de palme',desc:'Par bidon de 5L',price:4000,unit:'bidon',emoji:'🍶'},
    {id:'f5',name:'Néré (soumbara)',desc:'Condiment traditionnel',price:1000,unit:'sachet',emoji:'🫘'},
    {id:'f6',name:'Kit repas famille',desc:'Pour 4-6 personnes',price:8500,unit:'kit',emoji:'🥘'},
  ],
  restaurant: [
    {id:'r1',name:'Riz sauce arachide',desc:'Plat traditionnel copieux',price:2500,unit:'plat',emoji:'🍚'},
    {id:'r2',name:'Fufu + soupe',desc:'Fufu de manioc, soupe de viande',price:3000,unit:'plat',emoji:'🍲'},
    {id:'r3',name:'Brochettes mixtes',desc:'Bœuf, poulet, foie',price:2000,unit:'portion',emoji:'🍢'},
    {id:'r4',name:'Poulet yassa',desc:'Mariné aux oignons et citron',price:4500,unit:'plat',emoji:'🍗'},
    {id:'r5',name:'Attiéké poisson',desc:'Semoule de manioc + poisson braisé',price:2800,unit:'plat',emoji:'🐠'},
    {id:'r6',name:'Plateau traiteur',desc:'Pour 10 personnes (événement)',price:35000,unit:'plateau',emoji:'🎉'},
  ],
  clothes: [
    {id:'c1',name:'Boubou homme',desc:'Tissu wax, tailles S-XXL',price:12000,unit:'pièce',emoji:'👘'},
    {id:'c2',name:'Robe femme africaine',desc:'Couture locale, colorée',price:9500,unit:'pièce',emoji:'👗'},
    {id:'c3',name:'Ensemble enfant',desc:'3-12 ans, tissu wax',price:6000,unit:'pièce',emoji:'🧒'},
    {id:'c4',name:'Sac en cuir',desc:'Fabriqué localement',price:15000,unit:'pièce',emoji:'👜'},
    {id:'c5',name:'Sandales tressées',desc:'Artisanat togolais',price:7500,unit:'paire',emoji:'👡'},
    {id:'c6',name:'Kit cosmétiques',desc:'Savon karité + huile de palme',price:4500,unit:'kit',emoji:'✨'},
  ]
};

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function showToast(msg, color="#1A1A2E") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.style.background = color;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

function fmt(n) {
  return Number(n).toLocaleString('fr-FR') + ' FCFA';
}

// ════════════════════════════════════════
// NAVIGATION TABS
// ════════════════════════════════════════
function goTab(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("on"));
  const page = document.getElementById("p-" + id);
  if (page) page.classList.add("on");
  document.querySelectorAll(".btab").forEach(b => b.classList.remove("on"));
  const bt = document.getElementById("t-" + id);
  if (bt) bt.classList.add("on");
  document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("on"));
  const nl = document.getElementById("nl-" + id);
  if (nl) nl.classList.add("on");
  window.scrollTo({top:0,behavior:"smooth"});
  if (id === 'services') showView('list');
  if (id === 'orders') {
    if (!currentUser) {
      // Afficher un message pour se connecter
      const out = document.getElementById('orders-out');
      if (out) out.innerHTML = `
        <div class="orders-empty">
          <div class="orders-empty-ico">🔐</div>
          <div class="orders-empty-title">Connexion requise</div>
          <div class="orders-empty-sub">Connectez-vous pour voir vos commandes.</div>
          <button class="btn-primary" style="max-width:220px;margin:20px auto 0" onclick="openAuthModal('login')">Se connecter</button>
        </div>`;
    } else {
      loadMyOrders();
    }
  }
  if (id === 'profile') updateProfilePage();
}
window.goTab = goTab;

// ════════════════════════════════════════
// VUES INTERNES À LA PAGE SERVICES
// ════════════════════════════════════════
const VIEWS = ['list','catalogue','form','delivery','payment','success'];
function showView(v) {
  VIEWS.forEach(x => {
    const el = document.getElementById('view-'+x);
    if (el) el.style.display = x===v ? 'block' : 'none';
  });
  window.scrollTo({top:0,behavior:"smooth"});
}
window.showView = showView;

// ════════════════════════════════════════
// OUVRIR UN SERVICE
// ════════════════════════════════════════
function openService(id) {
  // Vérifier la connexion avant de commander
  if (!currentUser) {
    openAuthModal('login');
    showToast('⚠️ Connectez-vous pour passer une commande', '#F5820A');
    return;
  }

  goTab('services');
  currentService = id;
  cart = {};
  const svc = SVCS[id];
  if (!svc) return;

  if (CATALOGUE_SERVICES.includes(id)) {
    document.getElementById('cat-ico').style.background = svc.bg;
    document.getElementById('cat-ico').textContent = svc.icon;
    document.getElementById('cat-title').textContent = svc.name;
    loadCatalogue(id);
    showView('catalogue');
  } else {
    document.getElementById('form-ico').style.background = svc.bg;
    document.getElementById('form-ico').textContent = svc.icon;
    document.getElementById('form-title').textContent = svc.name;
    const soonEl     = document.getElementById('form-soon');
    const soonDateEl = document.getElementById('form-soon-date');
    if (!svc.active && svc.soon) {
      soonEl.style.display = 'block';
      soonDateEl.textContent = `Opérationnel le ${svc.soon}. Vous pouvez déjà pré-enregistrer votre demande.`;
    } else {
      soonEl.style.display = 'none';
    }
    let html = '';
    svc.fields.forEach(f => {
      const opt = f.opt ? ' <span style="font-weight:400;font-size:10px;color:#C5C5D8;text-transform:none">(optionnel)</span>' : '';
      html += `<label class="f-label">${f.l}${opt}</label>`;
      if (f.t === 'textarea') {
        html += `<textarea class="f-textarea" rows="3" placeholder="${f.ph||''}" id="ff-${f.n}"></textarea>`;
      } else if (f.t === 'select') {
        html += `<select class="f-select" id="ff-${f.n}"><option value="">— Choisir —</option>${f.opts.map(o=>`<option>${o}</option>`).join('')}</select>`;
      } else {
        html += `<input type="${f.t}" class="f-input" placeholder="${f.ph||''}" id="ff-${f.n}"/>`;
      }
    });
    document.getElementById('form-fields').innerHTML = html;
    showView('form');
  }
}
window.openService = openService;

// ════════════════════════════════════════
// CHARGER CATALOGUE DEPUIS FIRESTORE
// ════════════════════════════════════════
async function loadCatalogue(svcId) {
  const container = document.getElementById('catalogue-items');
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--light)"><div class="spinner" style="border-color:rgba(30,111,190,.2);border-top-color:var(--blue)"></div><div style="margin-top:10px;font-size:12px">Chargement...</div></div>`;
  updateCartBar();

  let articles = [];
  try {
    const q = query(collection(db,'articles'), where('service','==',svcId), orderBy('ordre','asc'));
    const snap = await getDocs(q);
    if (!snap.empty) snap.forEach(d => articles.push({id:d.id,...d.data()}));
  } catch(e) {
    console.log('Articles Firestore indisponibles, utilisation des défauts');
  }

  if (articles.length === 0) articles = DEFAULT_ARTICLES[svcId] || [];

  if (articles.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--light)">Aucun article disponible pour le moment.</div>`;
    return;
  }
  container.innerHTML = articles.map(a => renderArticleCard(a)).join('');
}

function renderArticleCard(a) {
  const inCart = cart[a.id];
  const qty    = inCart ? inCart.qty : 0;
  const imgHtml = a.imageUrl
    ? `<img src="${a.imageUrl}" alt="${a.name}" loading="lazy"/>`
    : `<span style="font-size:42px">${a.emoji||'📦'}</span>`;
  return `<div class="article-card${qty>0?' selected':''}" id="acard-${a.id}">
    <div class="art-img-wrap">${imgHtml}</div>
    <div class="art-check">✓</div>
    <div class="art-body">
      <div class="art-name">${a.name}</div>
      <div class="art-desc">${a.desc||''}</div>
      <div class="art-footer">
        <div>
          <span class="art-price">${fmt(a.price)}</span>
          ${a.unit ? `<span class="art-price-unit">/ ${a.unit}</span>` : ''}
        </div>
        <button class="art-add" onclick="addToCart('${a.id}',event)" title="Ajouter">+</button>
        <div class="art-qty">
          <button class="qty-btn" onclick="changeQty('${a.id}',-1,event)">−</button>
          <span class="qty-num" id="qty-${a.id}">${qty}</span>
          <button class="qty-btn" onclick="changeQty('${a.id}',1,event)">+</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════
// GESTION PANIER
// ════════════════════════════════════════
function addToCart(id, e) {
  if(e) e.stopPropagation();
  const allArticles = [...(DEFAULT_ARTICLES[currentService]||[])];
  let art = allArticles.find(a=>a.id===id);
  if (!art) {
    const card = document.getElementById(`acard-${id}`);
    if (!card) return;
    const name = card.querySelector('.art-name').textContent;
    const priceText = card.querySelector('.art-price').textContent.replace(/[^\d]/g,'');
    art = {id, name, price:parseInt(priceText)||0};
  }
  if (cart[id]) cart[id].qty++;
  else cart[id] = {...art, qty:1};
  refreshCard(id);
  updateCartBar();
  showToast(`✅ ${art.name} ajouté !`, "#2E7D32");
}
window.addToCart = addToCart;

function changeQty(id, delta, e) {
  if(e) e.stopPropagation();
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  refreshCard(id);
  updateCartBar();
}
window.changeQty = changeQty;

function refreshCard(id) {
  const card = document.getElementById(`acard-${id}`);
  if (!card) return;
  const qty = cart[id]?.qty || 0;
  card.className = `article-card${qty>0?' selected':''}`;
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.textContent = qty;
}

function cartTotal() { return Object.values(cart).reduce((s,a) => s+a.price*a.qty, 0); }
function cartCount() { return Object.values(cart).reduce((s,a) => s+a.qty, 0); }

function updateCartBar() {
  const bar = document.getElementById('cart-bar');
  if (!bar) return;
  const cnt = cartCount();
  if (cnt > 0) {
    bar.style.display = 'flex';
    document.getElementById('cb-count').textContent = `${cnt} article${cnt>1?'s':''}`;
    document.getElementById('cb-total').textContent = fmt(cartTotal());
  } else {
    bar.style.display = 'none';
  }
  const badge = document.getElementById('cart-count');
  if (badge) {
    if (cnt > 0) { badge.textContent = cnt; badge.style.display = 'flex'; }
    else badge.style.display = 'none';
  }
}

// ════════════════════════════════════════
// PAGE LIVRAISON (sans champ téléphone)
// ════════════════════════════════════════
function setLocMode(mode) {
  locMode = mode;
  document.getElementById('loc-btn-gps').className  = 'loc-btn' + (mode==='gps'?' on':'');
  document.getElementById('loc-btn-desc').className = 'loc-btn' + (mode==='desc'?' on':'');
  document.getElementById('loc-gps-panel').style.display  = mode==='gps'  ? 'block' : 'none';
  document.getElementById('loc-desc-panel').style.display = mode==='desc' ? 'block' : 'none';
}
window.setLocMode = setLocMode;

function getGPS() {
  const btn = document.getElementById('gps-btn');
  const res = document.getElementById('gps-result');
  btn.innerHTML = '<span class="spinner"></span> Localisation...';
  btn.disabled = true;
  if (!navigator.geolocation) {
    res.style.display='block';
    res.innerHTML = '❌ Géolocalisation non supportée. Utilisez la description.';
    btn.innerHTML = '📡 Obtenir ma position';
    btn.disabled = false;
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      gpsCoords = {lat:pos.coords.latitude, lng:pos.coords.longitude};
      res.style.display='block';
      res.innerHTML = `✅ <strong>Position obtenue !</strong><br/>📍 Lat: ${gpsCoords.lat.toFixed(5)} — Lng: ${gpsCoords.lng.toFixed(5)}<br/><a href="https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}" target="_blank" style="color:var(--blue);font-size:11px">Voir sur Google Maps</a>`;
      btn.innerHTML = '🔄 Actualiser la position';
      btn.disabled = false;
    },
    err => {
      res.style.display='block';
      res.innerHTML = `❌ Impossible d'obtenir la position. Utilisez la description manuelle.`;
      btn.innerHTML = '📡 Réessayer';
      btn.disabled = false;
    },
    {enableHighAccuracy:true, timeout:10000}
  );
}
window.getGPS = getGPS;

function goToPayment() {
  const addr = document.getElementById('del-address').value.trim();
  if (locMode==='gps' && !gpsCoords && !addr) {
    showToast('⚠️ Obtenez votre position GPS ou utilisez la description','#F5820A'); return;
  }
  if (locMode==='desc' && !document.getElementById('del-desc').value.trim()) {
    showToast('⚠️ Décrivez votre position','#F5820A'); return;
  }
  const items = Object.values(cart);
  let recapHtml = items.map(a => `
    <div class="recap-item">
      <div><span class="recap-name">${a.name}</span><span class="recap-qty">x${a.qty}</span></div>
      <div class="recap-price">${fmt(a.price*a.qty)}</div>
    </div>`).join('');
  document.getElementById('recap-items').innerHTML = recapHtml;
  document.getElementById('recap-total-val').textContent = fmt(cartTotal());
  showView('payment');
}
window.goToPayment = goToPayment;

// ════════════════════════════════════════
// PAIEMENT
// ════════════════════════════════════════
function selectPay(mode) {
  selectedPayment = mode;
  ['mixx','flooz','livraison'].forEach(m => {
    document.getElementById('pay-'+m).classList.toggle('selected', m===mode);
  });
}
window.selectPay = selectPay;

async function confirmOrder() {
  if (!currentUser) { openAuthModal('login'); return; }

  const svc   = SVCS[currentService];
  const addr  = document.getElementById('del-address').value.trim();
  const notes = document.getElementById('del-notes').value.trim();

  let positionData = {};
  if (locMode === 'gps' && gpsCoords) {
    positionData = {positionType:'GPS', lat:gpsCoords.lat, lng:gpsCoords.lng};
  } else {
    positionData = {positionType:'description', positionDesc: document.getElementById('del-desc')?.value.trim()||''};
  }

  const btn = document.getElementById('confirm-btn');
  btn.innerHTML = '<span class="spinner"></span> Traitement...';
  btn.disabled = true;

  try {
    const items = Object.values(cart).map(a=>({id:a.id,name:a.name,price:a.price,qty:a.qty}));
    const total = cartTotal();
    const docRef = await addDoc(collection(db,'commandes'), {
      service:      currentService,
      serviceName:  svc.name,
      statut:       'En attente',
      // Infos client issues du profil (plus de saisie manuelle)
      uid:          currentUser.uid,
      clientNom:    currentUser.nom    || '',
      clientPrenom: currentUser.prenom || '',
      clientGenre:  currentUser.genre  || '',
      phone:        currentUser.phone  || '',
      clientVille:  currentUser.ville  || '',
      adresse:      addr,
      notes,
      modePaiement: selectedPayment,
      articles:     items,
      total,
      ...positionData,
      createdAt:    serverTimestamp()
    });

    document.getElementById('succ-msg').innerHTML =
      `Commande <strong style="color:var(--blue)">${svc.name}</strong> confirmée !<br/>
       Référence : <strong>#${docRef.id.slice(0,8).toUpperCase()}</strong><br/>
       ${selectedPayment === 'livraison'
         ? '💵 Paiement à la livraison — notre agent vous contacte bientôt.'
         : '📱 Paiement '+selectedPayment+' — traitement en cours.'}<br/>
       <small style="color:var(--light)">Contact : ${currentUser.phone || currentUser.email}</small>`;
    showView('success');
    cart = {};
    updateCartBar();
  } catch(err) {
    console.error(err);
    showToast('❌ Erreur lors de la commande. Vérifiez votre connexion.','#C62828');
    btn.innerHTML = '✅ Confirmer la commande';
    btn.disabled = false;
  }
}
window.confirmOrder = confirmOrder;

// ════════════════════════════════════════
// FORMULAIRE STANDARD (sans champ phone)
// ════════════════════════════════════════
async function submitStandardForm() {
  if (!currentUser) { openAuthModal('login'); return; }

  const svc = SVCS[currentService];
  const btn = document.getElementById('form-submit-btn');
  const data = {
    service:      currentService,
    serviceName:  svc.name,
    statut:       'En attente',
    // Infos client issues du profil
    uid:          currentUser.uid,
    clientNom:    currentUser.nom    || '',
    clientPrenom: currentUser.prenom || '',
    clientGenre:  currentUser.genre  || '',
    phone:        currentUser.phone  || '',
    clientVille:  currentUser.ville  || '',
    createdAt:    serverTimestamp()
  };
  let valid = true;

  svc.fields.forEach(f => {
    const el = document.getElementById(`ff-${f.n}`);
    if (!el) return;
    const val = el.value.trim();
    if (!f.opt && !val) { el.style.borderColor='#F5820A'; valid=false; }
    else { el.style.borderColor=''; data[f.n]=val; }
  });

  if (!valid) { showToast('⚠️ Remplissez tous les champs obligatoires','#F5820A'); return; }

  btn.innerHTML = '<span class="spinner"></span> Envoi...';
  btn.disabled = true;

  try {
    const docRef = await addDoc(collection(db,'commandes'), data);
    document.getElementById('succ-msg').innerHTML =
      `Demande <strong style="color:var(--blue)">${svc.name}</strong> envoyée !<br/>
       Référence : <strong>#${docRef.id.slice(0,8).toUpperCase()}</strong><br/>
       Notre équipe vous contactera très bientôt.`;
    showView('success');
  } catch(err) {
    showToast('❌ Erreur d\'envoi. Vérifiez votre connexion.','#C62828');
    btn.innerHTML = '📨 Envoyer ma demande';
    btn.disabled = false;
  }
}
window.submitStandardForm = submitStandardForm;

// ════════════════════════════════════════
// COMMANDES — CHARGEMENT LIÉ AU COMPTE
// ════════════════════════════════════════
async function loadMyOrders() {
  const out = document.getElementById('orders-out');
  if (!out) return;
  if (!currentUser) {
    out.innerHTML = `
      <div class="orders-empty">
        <div class="orders-empty-ico">🔐</div>
        <div class="orders-empty-title">Connexion requise</div>
        <div class="orders-empty-sub">Connectez-vous pour voir vos commandes.</div>
        <button class="btn-primary" style="max-width:220px;margin:20px auto 0" onclick="openAuthModal('login')">Se connecter</button>
      </div>`;
    return;
  }

  out.innerHTML = `
    <div class="orders-empty">
      <div class="orders-empty-ico" style="animation:spin .8s linear infinite;display:inline-block">⏳</div>
      <div class="orders-empty-title">Chargement de vos commandes...</div>
    </div>`;

  try {
    // Requête par UID — avec fallback si l'index composite n'est pas encore créé
    let snap;
    try {
      const q = query(
        collection(db,'commandes'),
        where('uid','==', currentUser.uid),
        orderBy('createdAt','desc')
      );
      snap = await getDocs(q);
    } catch(indexErr) {
      // Index composite manquant → requête sans orderBy, tri côté client
      console.warn('Index Firestore manquant, tri côté client activé. Créez l\'index dans la console Firebase.', indexErr);
      const q2 = query(
        collection(db,'commandes'),
        where('uid','==', currentUser.uid)
      );
      snap = await getDocs(q2);
    }

    // Tri côté client (utile si l'index Firebase n'est pas encore créé)
    const allDocs = [];
    snap.forEach(d => allDocs.push({id:d.id,...d.data()}));
    allDocs.sort((a,b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });

    if (allDocs.length === 0) {
      out.innerHTML = `
        <div class="orders-empty">
          <div class="orders-empty-ico">📦</div>
          <div class="orders-empty-title">Aucune commande pour l'instant</div>
          <div class="orders-empty-sub">Vos commandes passées apparaîtront ici.</div>
          <button class="btn-primary" style="max-width:220px;margin:20px auto 0" onclick="goTab('services')">Découvrir nos services</button>
        </div>`;
      return;
    }

    const SC = {
      'En attente':{c:'#F5820A',bg:'#FFF3E0'},
      'Confirmée': {c:'#1E6FBE',bg:'#E3F2FD'},
      'En cours':  {c:'#7B1FA2',bg:'#F3E5F5'},
      'Terminée':  {c:'#2E7D32',bg:'#E8F5E9'},
      'Annulée':   {c:'#C62828',bg:'#FFEBEE'}
    };
    const STEPS = ['En attente','Confirmée','En cours','Terminée'];
    let h = `<div style="font-size:12px;color:var(--light);margin-bottom:12px">${allDocs.length} commande${allDocs.length>1?'s':''} trouvée${allDocs.length>1?'s':''}</div>`;

    allDocs.forEach(o => {
      const s = SC[o.statut] || SC['En attente'];
      const idx = STEPS.indexOf(o.statut);
      const dateStr = o.createdAt
        ? new Date(o.createdAt.seconds*1000).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
        : '—';
      const prog = STEPS.map((st,i) => {
        const act = i <= idx;
        return `<div class="prog-dot" style="background:${act?'#1E6FBE':'#E8EAF0'}">${act?'✓':''}</div>
                ${i<3?`<div class="prog-line" style="background:${i<idx?'#1E6FBE':'#E8EAF0'}"></div>`:''}`;
      }).join('');
      const totalStr = o.total ? fmt(o.total) : '';

      h += `<div class="o-card">
        <div class="o-head">
          <div style="flex:1;min-width:0">
            <div class="o-name">${o.serviceName||o.service||'Service'}</div>
            <div class="o-date">📅 ${dateStr}${totalStr?' — '+totalStr:''}</div>
          </div>
          <span class="o-pill" style="background:${s.bg};color:${s.c}">${o.statut||'En attente'}</span>
        </div>
        <div class="o-detail">
          ${o.adresse?`<div class="o-drow"><span class="o-dk">Adresse :</span><span class="o-dv">${o.adresse}</span></div>`:''}
          ${o.modePaiement?`<div class="o-drow"><span class="o-dk">Paiement :</span><span class="o-dv">${o.modePaiement}</span></div>`:''}
          <div class="o-drow"><span class="o-dk">Réf :</span><span class="o-dv">#${o.id.slice(0,8).toUpperCase()}</span></div>
        </div>
        <div class="prog">${prog}</div>
        <div class="prog-lbls">
          <span class="prog-lbl">Reçue</span>
          <span class="prog-lbl">Confirmée</span>
          <span class="prog-lbl">En cours</span>
          <span class="prog-lbl">Terminée</span>
        </div>
      </div>`;
    });

    out.innerHTML = h;

  } catch(err) {
    console.error(err);
    out.innerHTML = `
      <div class="orders-empty">
        <div class="orders-empty-ico">❌</div>
        <div class="orders-empty-title">Erreur de connexion</div>
        <div class="orders-empty-sub">Impossible de charger vos commandes.<br/>Vérifiez votre connexion et réessayez.</div>
        <button class="btn-primary" style="max-width:220px;margin:20px auto 0" onclick="loadMyOrders()">🔄 Réessayer</button>
      </div>`;
  }
}
window.loadMyOrders = loadMyOrders;

// ════════════════════════════════════════
// SLIDER HERO
// ════════════════════════════════════════
const defaultSlides = document.querySelectorAll('.slide');
const dotsEl = document.getElementById('slider-dots');
let slides = [...defaultSlides];

function goSlide(i) {
  if (slides.length === 0) return;
  slides[sliderIdx].classList.remove('on');
  dotsEl.querySelectorAll('.dot')[sliderIdx]?.classList.remove('on');
  sliderIdx = ((i % slides.length) + slides.length) % slides.length;
  slides[sliderIdx].classList.add('on');
  dotsEl.querySelectorAll('.dot')[sliderIdx]?.classList.add('on');
}
window.goSlide = goSlide;

function startSlider() {
  if (sliderTimer) clearInterval(sliderTimer);
  sliderTimer = setInterval(() => goSlide(sliderIdx+1), 4500);
}
startSlider();

async function loadPartnerSlides() {
  try {
    const q = query(collection(db,'partenaires'), orderBy('ordre','asc'));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const sliderEl = document.getElementById('hero-slider');
    snap.forEach(d => {
      const p = d.data();
      if (!p.imageUrl) return;
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.innerHTML = `
        <div class="slide-bg" style="background-image:url('${p.imageUrl}')"></div>
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <div class="slide-title">${p.nom||'Partenaire'}</div>
          <div class="slide-sub">${p.description||''}</div>
        </div>
        ${p.lien ? `<a class="slide-cta" href="${p.lien}" target="_blank">Découvrir →</a>` : ''}`;
      sliderEl.insertBefore(slide, dotsEl);
      const dot = document.createElement('button');
      dot.className = 'dot';
      const idx = slides.length;
      dot.onclick = () => goSlide(idx);
      dotsEl.appendChild(dot);
      slides.push(slide);
    });
    clearInterval(sliderTimer);
    startSlider();
  } catch(e) {
    console.log('Partenaires non disponibles');
  }
}
loadPartnerSlides();

// ════════════════════════════════════════
// FILTRE RECHERCHE SERVICES
// ════════════════════════════════════════
function filterServices(q) {
  if (!document.getElementById('t-services')?.classList.contains('on')) goTab('services');
  document.querySelectorAll('#view-list .svc-row').forEach(r => {
    r.style.display = !q || r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
window.filterServices = filterServices;
