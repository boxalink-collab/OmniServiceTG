/* ══════════════════════════════════════════
   OmniService TG — app.js v4.0
   Auth Firebase + Profils + Commandes/UID
   ══════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, getDoc, setDoc, updateDoc,
  query, where, getDocs, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

/* ────────────────────────────────────────
   ÉTAT GLOBAL
──────────────────────────────────────── */
let currentUser    = null;
let currentProfile = null;
let currentService = null;
let cart           = {};
let locMode        = 'gps';
let gpsCoords      = null;
let selPay         = 'livraison';
let sliderIdx      = 0;
let sliderTimer    = null;

const CATALOGUE_SVCS = ['food','restaurant','clothes'];

/* ────────────────────────────────────────
   SPLASH
──────────────────────────────────────── */
function hideSplash() {
  const s = document.getElementById('splash-screen');
  if (!s || s.dataset.hidden) return;
  s.dataset.hidden = '1';
  s.classList.add('hidden');
  setTimeout(() => { s.style.display = 'none'; }, 500);
}
window.addEventListener('DOMContentLoaded', () => setTimeout(hideSplash, 2800));

/* ────────────────────────────────────────
   PWA
──────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  setTimeout(() => {
    const b = document.getElementById('pwa-banner');
    if (b && !localStorage.getItem('pwa-dismissed')) b.style.display = 'block';
  }, 6000);
});
document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('pwa-banner').style.display = 'none';
});
window.dismissPWA = () => {
  document.getElementById('pwa-banner').style.display = 'none';
  localStorage.setItem('pwa-dismissed','1');
};

/* ────────────────────────────────────────
   UTILITAIRES
──────────────────────────────────────── */
function showToast(msg, color = '#1A1A2E') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.style.background = color; t.textContent = msg;
  t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000);
}
function fmt(n) { return Number(n).toLocaleString('fr-FR') + ' FCFA'; }

function avatarHTML(genre, size = 36) {
  const f = genre === 'femme';
  const bg = f ? 'linear-gradient(135deg,#E91E8C,#AD1457)' : 'linear-gradient(135deg,#1E6FBE,#155A9C)';
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};
    display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*.55)}px;
    flex-shrink:0;border:2px solid rgba(255,255,255,.25)">${f ? '👩' : '👨'}</div>`;
}

/* ────────────────────────────────────────
   FIREBASE AUTH — ÉTAT
──────────────────────────────────────── */
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      currentProfile = snap.exists() ? snap.data() : null;
    } catch(e) { currentProfile = null; }
    hideSplash();
    onLoggedIn();
  } else {
    currentUser = null; currentProfile = null;
    hideSplash();
    onLoggedOut();
  }
});

function onLoggedIn() {
  closeModal('modal-auth');
  updateNavAvatar();
  renderProfilePage();
  updateCartBar();
  // Si la page commandes est visible, recharger
  if (document.getElementById('p-orders')?.classList.contains('on')) loadMyOrders();
}

function onLoggedOut() {
  updateNavAvatar();
  renderProfilePage();
  const out = document.getElementById('orders-out');
  if (out) out.innerHTML = buildLockedState();
}

function buildLockedState() {
  return `<div class="orders-locked">
    <div class="ol-ico">🔒</div>
    <div class="ol-title">Connexion requise</div>
    <div class="ol-sub">Connectez-vous pour consulter vos commandes et leur suivi en temps réel.</div>
    <button class="ol-btn" onclick="openAuthModal('login')">Se connecter</button>
    <button class="ol-btn2" onclick="openAuthModal('register')">Créer un compte</button>
  </div>`;
}

/* ────────────────────────────────────────
   AVATAR DANS LA NAV
──────────────────────────────────────── */
function updateNavAvatar() {
  const btn = document.getElementById('nav-profile-btn');
  if (!btn) return;
  if (currentProfile) {
    const f = currentProfile.genre === 'femme';
    const bg = f ? 'linear-gradient(135deg,#E91E8C,#AD1457)' : 'linear-gradient(135deg,#1E6FBE,#155A9C)';
    btn.innerHTML = `<div style="width:30px;height:30px;border-radius:50%;background:${bg};
      display:flex;align-items:center;justify-content:center;font-size:17px;
      border:2px solid rgba(255,255,255,.4)">${f?'👩':'👨'}</div>`;
  } else {
    btn.innerHTML = '<div style="font-size:20px">👤</div>';
  }
}

/* ────────────────────────────────────────
   MODAL AUTH
──────────────────────────────────────── */
function openAuthModal(tab = 'login') {
  if (currentUser) { goTab('profile'); return; }
  showModal('modal-auth');
  switchAuthTab(tab);
  clearAuthErr();
}
window.openAuthModal = openAuthModal;

function switchAuthTab(tab) {
  ['login','register'].forEach(t => {
    document.getElementById('auth-tab-' + t)?.classList.toggle('on', t === tab);
    document.getElementById('auth-panel-' + t).style.display = t === tab ? 'block' : 'none';
  });
  document.getElementById('auth-panel-reset').style.display = 'none';
}
window.switchAuthTab = switchAuthTab;

window.showResetPanel = () => {
  ['login','register'].forEach(t => document.getElementById('auth-panel-' + t).style.display = 'none');
  document.getElementById('auth-panel-reset').style.display = 'block';
};

function clearAuthErr() {
  ['auth-err-login','auth-err-register','auth-err-reset'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  });
}
function setAuthErr(id, msg, ok = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? '#2E7D32' : '#C62828';
  el.style.display = 'block';
}

/* ────────────────────────────────────────
   INSCRIPTION
──────────────────────────────────────── */
async function doRegister() {
  const g   = v => document.getElementById(v)?.value?.trim() || '';
  const prenom = g('reg-prenom'), nom = g('reg-nom'), genre = g('reg-genre');
  const phone  = g('reg-phone'),  ville = g('reg-ville');
  const email  = g('reg-email'),  pass = document.getElementById('reg-pass')?.value || '';
  const pass2  = document.getElementById('reg-pass2')?.value || '';
  clearAuthErr();

  if (!prenom || !nom)  return setAuthErr('auth-err-register','❌ Prénom et nom requis.');
  if (!genre)           return setAuthErr('auth-err-register','❌ Genre requis.');
  if (!phone)           return setAuthErr('auth-err-register','❌ Numéro de téléphone requis.');
  if (!ville)           return setAuthErr('auth-err-register','❌ Ville requise.');
  if (!email)           return setAuthErr('auth-err-register','❌ Email requis.');
  if (pass.length < 6)  return setAuthErr('auth-err-register','❌ Mot de passe : 6 caractères minimum.');
  if (pass !== pass2)   return setAuthErr('auth-err-register','❌ Les mots de passe ne correspondent pas.');

  const btn = document.getElementById('reg-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spin-sm"></span> Inscription...';

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: `${prenom} ${nom}` });
    await setDoc(doc(db, 'users', cred.user.uid), {
      prenom, nom, genre, phone, ville, email, createdAt: serverTimestamp()
    });
    showToast(`🎉 Bienvenue ${prenom} !`, '#2E7D32');
    // onAuthStateChanged prend le relais
  } catch(e) {
    const m = {
      'auth/email-already-in-use':'❌ Cet email est déjà utilisé.',
      'auth/invalid-email':'❌ Email invalide.',
      'auth/weak-password':'❌ Mot de passe trop faible (6 caractères min.).'
    };
    setAuthErr('auth-err-register', m[e.code] || '❌ ' + e.message);
    btn.disabled = false; btn.innerHTML = 'Créer mon compte →';
  }
}
window.doRegister = doRegister;

/* ────────────────────────────────────────
   CONNEXION
──────────────────────────────────────── */
async function doLogin() {
  const email = document.getElementById('login-email')?.value?.trim() || '';
  const pass  = document.getElementById('login-pass')?.value || '';
  clearAuthErr();
  if (!email || !pass) return setAuthErr('auth-err-login','❌ Email et mot de passe requis.');

  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spin-sm"></span> Connexion...';

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e) {
    const m = {
      'auth/invalid-credential':'❌ Email ou mot de passe incorrect.',
      'auth/user-not-found':'❌ Aucun compte avec cet email.',
      'auth/wrong-password':'❌ Mot de passe incorrect.',
      'auth/too-many-requests':'⏳ Trop de tentatives. Réessayez plus tard.',
      'auth/invalid-email':'❌ Email invalide.'
    };
    setAuthErr('auth-err-login', m[e.code] || '❌ ' + e.message);
    btn.disabled = false; btn.innerHTML = 'Se connecter →';
  }
}
window.doLogin = doLogin;

document.getElementById('login-pass')?.addEventListener('keydown',  e => e.key==='Enter' && doLogin());
document.getElementById('reg-pass2')?.addEventListener('keydown', e => e.key==='Enter' && doRegister());

/* ────────────────────────────────────────
   RESET MOT DE PASSE
──────────────────────────────────────── */
window.doResetPassword = async () => {
  const email = document.getElementById('reset-email')?.value?.trim() || '';
  clearAuthErr();
  if (!email) return setAuthErr('auth-err-reset','❌ Entrez votre email.');
  try {
    await sendPasswordResetEmail(auth, email);
    setAuthErr('auth-err-reset','✅ Email envoyé ! Vérifiez votre boîte.', true);
  } catch(e) {
    setAuthErr('auth-err-reset','❌ Email introuvable.');
  }
};

/* ────────────────────────────────────────
   DÉCONNEXION
──────────────────────────────────────── */
window.doLogout = async () => {
  await signOut(auth);
  showToast('👋 Déconnecté', '#4A4A6A');
  goTab('home');
};

/* ────────────────────────────────────────
   MODALS GÉNÉRIQUES
──────────────────────────────────────── */
function showModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = 'flex';
  requestAnimationFrame(() => m.classList.add('show'));
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('show');
  setTimeout(() => { m.style.display = 'none'; }, 280);
}
window.closeModal = closeModal;

document.querySelectorAll('.modal-ov').forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); })
);

/* ────────────────────────────────────────
   PAGE PROFIL
──────────────────────────────────────── */
function renderProfilePage() {
  const page = document.getElementById('p-profile');
  if (!page) return;

  if (!currentProfile) {
    page.innerHTML = `
      <div class="prof-guest">
        <div class="prof-guest-ico">🌟</div>
        <div class="prof-guest-title">Bienvenue sur OmniService TG</div>
        <div class="prof-guest-sub">Connectez-vous ou créez un compte pour commander facilement, suivre vos commandes et gérer votre profil.</div>
        <button class="prof-btn-main" onclick="openAuthModal('login')">Se connecter</button>
        <button class="prof-btn-sec"  onclick="openAuthModal('register')">Créer un compte →</button>
      </div>`;
    return;
  }

  const p = currentProfile;
  const f = p.genre === 'femme';
  const avBg = f ? 'linear-gradient(135deg,#E91E8C,#AD1457)' : 'linear-gradient(135deg,#1E6FBE,#155A9C)';

  page.innerHTML = `
    <div class="prof-hero-band">
      <div class="prof-av" style="background:${avBg}">${f ? '👩' : '👨'}</div>
      <div class="prof-hero-info">
        <div class="prof-hero-name">${p.prenom} ${p.nom}</div>
        <div class="prof-hero-email">${currentUser?.email || ''}</div>
        <div class="prof-hero-ville">📍 ${p.ville}</div>
      </div>
    </div>

    <div class="prof-section">
      <div class="prof-section-title">📋 Mes informations</div>
      <div class="prof-info-row"><span class="pik">Prénom</span><span class="piv">${p.prenom}</span></div>
      <div class="prof-info-row"><span class="pik">Nom</span><span class="piv">${p.nom}</span></div>
      <div class="prof-info-row"><span class="pik">Genre</span><span class="piv">${f ? '👩 Féminin' : '👨 Masculin'}</span></div>
      <div class="prof-info-row"><span class="pik">Téléphone</span><span class="piv">${p.phone}</span></div>
      <div class="prof-info-row border-none"><span class="pik">Ville</span><span class="piv">${p.ville}</span></div>
      <button class="prof-edit-btn" onclick="openEditProfile()">✏️ Modifier mon profil</button>
    </div>

    <div class="prof-section">
      <div class="prof-section-title">📦 Dernières commandes
        <button class="prof-see-all" onclick="goTab('orders')">Voir tout →</button>
      </div>
      <div id="prof-orders-prev"><div class="spin-center"><div class="spinner"></div></div></div>
    </div>

    <div class="prof-section danger-zone">
      <button class="logout-btn" onclick="doLogout()">🚪 Se déconnecter</button>
    </div>`;

  loadProfilePreview();
}

async function loadProfilePreview() {
  const el = document.getElementById('prof-orders-prev');
  if (!el || !currentUser) return;
  try {
    const q   = query(collection(db,'commandes'), where('uid','==',currentUser.uid), orderBy('createdAt','desc'));
    const sn  = await getDocs(q);
    if (sn.empty) { el.innerHTML = '<div class="prof-empty-orders">Aucune commande pour le moment.</div>'; return; }
    let h = ''; let i = 0;
    sn.forEach(d => {
      if (i++ >= 3) return;
      const o = d.data();
      const sc = SC_COLORS[o.statut] || SC_COLORS['En attente'];
      const date = o.createdAt ? new Date(o.createdAt.seconds*1000).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : '—';
      h += `<div class="prof-order-mini">
        <div class="pom-left">
          <div class="pom-name">${o.serviceName||o.service}</div>
          <div class="pom-date">${date}${o.total ? ' · '+fmt(o.total) : ''}</div>
        </div>
        <span class="o-pill" style="background:${sc.bg};color:${sc.c}">${o.statut}</span>
      </div>`;
    });
    el.innerHTML = h;
  } catch(e) { el.innerHTML = '<div class="prof-empty-orders">Impossible de charger.</div>'; }
}

/* ────────────────────────────────────────
   ÉDITION PROFIL
──────────────────────────────────────── */
function openEditProfile() {
  if (!currentProfile) return;
  const p = currentProfile;
  ['prenom','nom','phone','ville','genre'].forEach(k => {
    const el = document.getElementById('edit-' + k);
    if (el) el.value = p[k] || '';
  });
  showModal('modal-edit-profile');
}
window.openEditProfile = openEditProfile;

window.saveEditProfile = async () => {
  const g = k => document.getElementById('edit-' + k)?.value?.trim() || '';
  const d = { prenom:g('prenom'), nom:g('nom'), phone:g('phone'), ville:g('ville'), genre:g('genre') };
  if (Object.values(d).some(v => !v)) { showToast('⚠️ Remplissez tous les champs', '#F5820A'); return; }
  const btn = document.getElementById('edit-save-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spin-sm"></span> Enregistrement...';
  try {
    await updateDoc(doc(db,'users',currentUser.uid), d);
    currentProfile = { ...currentProfile, ...d };
    closeModal('modal-edit-profile');
    renderProfilePage(); updateNavAvatar();
    showToast('✅ Profil mis à jour !', '#2E7D32');
  } catch(e) { showToast('❌ Erreur : ' + e.message, '#C62828'); }
  btn.disabled = false; btn.innerHTML = 'Enregistrer';
};

/* ────────────────────────────────────────
   NAVIGATION
──────────────────────────────────────── */
function goTab(id) {
  if (id === 'orders' && !currentUser) { openAuthModal('login'); return; }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.getElementById('p-' + id)?.classList.add('on');
  document.querySelectorAll('.btab,.nav-link').forEach(b => b.classList.remove('on'));
  document.getElementById('t-' + id)?.classList.add('on');
  document.getElementById('nl-' + id)?.classList.add('on');
  window.scrollTo({ top:0, behavior:'smooth' });
  if (id === 'services') showView('list');
  if (id === 'orders' && currentUser) loadMyOrders();
  if (id === 'profile') renderProfilePage();
}
window.goTab = goTab;

const VIEWS = ['list','catalogue','form','delivery','payment','success'];
function showView(v) {
  VIEWS.forEach(x => {
    const el = document.getElementById('view-' + x);
    if (el) el.style.display = x === v ? 'block' : 'none';
  });
  window.scrollTo({ top:0, behavior:'smooth' });
}
window.showView = showView;

/* ────────────────────────────────────────
   SERVICES
──────────────────────────────────────── */
const SVCS = {
  food:        { name:'Alimentation & Produits locaux', icon:'🥘', bg:'#FFF3E0', active:true },
  restaurant:  { name:'Restauration',                   icon:'🍽️', bg:'#E3F2FD', active:true },
  delivery:    { name:'Livraison & Courses',             icon:'🚚', bg:'#FFF3E0', active:true,
    fields:[{n:'type',l:'Type',t:'select',opts:['Livraison express','Courses personnalisées','Livraison entreprise','Livraison de plats']},
            {n:'detail',l:'Lieu de collecte / Liste d\'articles',t:'textarea',ph:'Adresse ou liste...'},
            {n:'urgence',l:'Urgence',t:'select',opts:['Express (< 1h)','Dans la journée','Planifier']}] },
  maintenance: { name:'Maintenance Technique',           icon:'🔧', bg:'#E3F2FD', active:false, soon:'16 Mars 2026',
    fields:[{n:'type',l:'Type d\'intervention',t:'select',opts:['Électricité','Plomberie','Voiture','Électroménager','Informatique','Pose TV/Antenne','Autres travaux']},
            {n:'problem',l:'Description du problème',t:'textarea',ph:'Décrivez le problème...'},
            {n:'adresse',l:'Adresse',t:'text',ph:'Votre adresse à Lomé'}] },
  clothes:     { name:'Prêt-à-porter',                   icon:'👗', bg:'#FFF3E0', active:true },
  cleaning:    { name:'Entretien & Nettoyage',           icon:'🧹', bg:'#E3F2FD', active:true,
    fields:[{n:'type',l:'Type',t:'select',opts:['Nettoyage résidentiel','Nettoyage bureaux','Entretien régulier','Entretien industriel']},
            {n:'superficie',l:'Superficie (m²)',t:'number',ph:'Ex : 60'},
            {n:'date',l:'Date souhaitée',t:'date'}] },
  security:    { name:'Gardiennage & Sécurité',          icon:'🛡️', bg:'#E3F2FD', active:false, soon:'7 Avril 2026',
    fields:[{n:'type',l:'Type',t:'select',opts:['Gardiennage Résidentiel','Gardiennage Boutique','Sécurité Événementielle','Surveillance Temporaire']},
            {n:'detail',l:'Description du besoin',t:'textarea',ph:'Vos besoins...'}] }
};

const DEFAULT_ARTICLES = {
  food: [
    {id:'f1',name:'Tilapia frais',desc:'Par kg, pêche locale',price:3500,unit:'kg',emoji:'🐟'},
    {id:'f2',name:'Poulet fermier',desc:'Par pièce, élevage local',price:5500,unit:'pièce',emoji:'🐔'},
    {id:'f3',name:'Légumes assortis',desc:'Tomates, oignons, piment',price:1500,unit:'panier',emoji:'🥬'},
    {id:'f4',name:'Vin de palme',desc:'Par bidon de 5L',price:4000,unit:'bidon',emoji:'🍶'},
    {id:'f5',name:'Néré (soumbara)',desc:'Condiment traditionnel',price:1000,unit:'sachet',emoji:'🫘'},
    {id:'f6',name:'Kit repas famille',desc:'Pour 4–6 personnes',price:8500,unit:'kit',emoji:'🥘'},
  ],
  restaurant: [
    {id:'r1',name:'Riz sauce arachide',desc:'Plat traditionnel copieux',price:2500,unit:'plat',emoji:'🍚'},
    {id:'r2',name:'Fufu + soupe',desc:'Fufu de manioc, soupe viande',price:3000,unit:'plat',emoji:'🍲'},
    {id:'r3',name:'Brochettes mixtes',desc:'Bœuf, poulet, foie',price:2000,unit:'portion',emoji:'🍢'},
    {id:'r4',name:'Poulet yassa',desc:'Mariné aux oignons et citron',price:4500,unit:'plat',emoji:'🍗'},
    {id:'r5',name:'Attiéké poisson',desc:'Semoule de manioc + poisson braisé',price:2800,unit:'plat',emoji:'🐠'},
    {id:'r6',name:'Plateau traiteur',desc:'Pour 10 personnes',price:35000,unit:'plateau',emoji:'🎉'},
  ],
  clothes: [
    {id:'c1',name:'Boubou homme',desc:'Tissu wax, tailles S–XXL',price:12000,unit:'pièce',emoji:'👘'},
    {id:'c2',name:'Robe femme africaine',desc:'Couture locale',price:9500,unit:'pièce',emoji:'👗'},
    {id:'c3',name:'Ensemble enfant',desc:'3–12 ans, tissu wax',price:6000,unit:'pièce',emoji:'🧒'},
    {id:'c4',name:'Sac en cuir',desc:'Fabriqué localement',price:15000,unit:'pièce',emoji:'👜'},
    {id:'c5',name:'Sandales tressées',desc:'Artisanat togolais',price:7500,unit:'paire',emoji:'👡'},
    {id:'c6',name:'Kit cosmétiques',desc:'Savon karité + huile de palme',price:4500,unit:'kit',emoji:'✨'},
  ]
};

/* ────────────────────────────────────────
   OUVRIR UN SERVICE
──────────────────────────────────────── */
function openService(id) {
  if (!currentUser) {
    showToast('🔒 Connectez-vous pour commander', '#F5820A');
    openAuthModal('login'); return;
  }
  goTab('services');
  currentService = id; cart = {};
  const svc = SVCS[id]; if (!svc) return;

  if (CATALOGUE_SVCS.includes(id)) {
    document.getElementById('cat-ico').style.background = svc.bg;
    document.getElementById('cat-ico').textContent = svc.icon;
    document.getElementById('cat-title').textContent = svc.name;
    loadCatalogue(id);
    showView('catalogue');
  } else {
    document.getElementById('form-ico').style.background = svc.bg;
    document.getElementById('form-ico').textContent = svc.icon;
    document.getElementById('form-title').textContent = svc.name;
    const soonEl = document.getElementById('form-soon');
    if (!svc.active && svc.soon) {
      soonEl.style.display = 'block';
      document.getElementById('form-soon-date').textContent = `Opérationnel le ${svc.soon}.`;
    } else { soonEl.style.display = 'none'; }
    let html = '';
    (svc.fields || []).forEach(f => {
      html += `<label class="f-label">${f.l}</label>`;
      if (f.t === 'textarea')   html += `<textarea class="f-textarea" rows="3" placeholder="${f.ph||''}" id="ff-${f.n}"></textarea>`;
      else if (f.t === 'select') html += `<select class="f-select" id="ff-${f.n}"><option value="">— Choisir —</option>${f.opts.map(o=>`<option>${o}</option>`).join('')}</select>`;
      else html += `<input type="${f.t}" class="f-input" placeholder="${f.ph||''}" id="ff-${f.n}"/>`;
    });
    document.getElementById('form-fields').innerHTML = html;
    showView('form');
  }
}
window.openService = openService;

/* ────────────────────────────────────────
   CATALOGUE
──────────────────────────────────────── */
async function loadCatalogue(svcId) {
  const ctn = document.getElementById('catalogue-items');
  ctn.innerHTML = `<div class="cat-loading"><div class="spinner"></div><div>Chargement…</div></div>`;
  updateCartBar();
  let arts = [];
  try {
    const q  = query(collection(db,'articles'), where('service','==',svcId), orderBy('ordre','asc'));
    const sn = await getDocs(q);
    if (!sn.empty) sn.forEach(d => arts.push({ id:d.id, ...d.data() }));
  } catch(e) {}
  if (!arts.length) arts = DEFAULT_ARTICLES[svcId] || [];
  if (!arts.length) { ctn.innerHTML = '<div class="cat-empty">Aucun article.</div>'; return; }
  ctn.innerHTML = arts.map(artCard).join('');
}

function artCard(a) {
  const qty = cart[a.id]?.qty || 0;
  const imgH = a.imageUrl
    ? `<img src="${a.imageUrl}" alt="${a.name}" loading="lazy"/>`
    : `<span style="font-size:44px">${a.emoji||'📦'}</span>`;
  return `<div class="article-card${qty>0?' selected':''}" id="acard-${a.id}">
    <div class="art-img">${imgH}</div>
    <div class="art-tick">✓</div>
    <div class="art-body">
      <div class="art-name">${a.name}</div>
      <div class="art-desc">${a.desc||''}</div>
      <div class="art-foot">
        <div><span class="art-price">${fmt(a.price)}</span>${a.unit?`<span class="art-unit">/ ${a.unit}</span>`:''}</div>
        <div class="art-qty-ctrl">
          <button class="qty-btn" onclick="chgQty('${a.id}',-1,event)">−</button>
          <span class="qty-num" id="qty-${a.id}">${qty}</span>
          <button class="qty-btn" onclick="chgQty('${a.id}',1,event)">+</button>
        </div>
      </div>
    </div>
  </div>`;
}

/* ────────────────────────────────────────
   PANIER
──────────────────────────────────────── */
window.chgQty = function(id, delta, e) {
  if (e) e.stopPropagation();
  const arts = DEFAULT_ARTICLES[currentService] || [];
  if (delta > 0 && !cart[id]) {
    const a = arts.find(x => x.id === id);
    if (!a) return;
    cart[id] = { ...a, qty: 0 };
  }
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  refreshArtCard(id); updateCartBar();
};

function refreshArtCard(id) {
  const card = document.getElementById('acard-' + id);
  if (!card) return;
  const qty = cart[id]?.qty || 0;
  card.className = 'article-card' + (qty > 0 ? ' selected' : '');
  const el = document.getElementById('qty-' + id);
  if (el) el.textContent = qty;
}

function cartTotal()  { return Object.values(cart).reduce((s,a) => s + a.price * a.qty, 0); }
function cartCount()  { return Object.values(cart).reduce((s,a) => s + a.qty, 0); }

function updateCartBar() {
  const bar = document.getElementById('cart-bar');
  if (!bar) return;
  const n = cartCount();
  if (n > 0) {
    bar.style.display = 'flex';
    document.getElementById('cb-count').textContent = `${n} article${n>1?'s':''}`;
    document.getElementById('cb-total').textContent = fmt(cartTotal());
  } else { bar.style.display = 'none'; }
  const badge = document.getElementById('cart-count');
  if (badge) { badge.textContent = n; badge.style.display = n > 0 ? 'flex' : 'none'; }
}

/* ────────────────────────────────────────
   LIVRAISON  — préremplie depuis le profil
──────────────────────────────────────── */
window.showDeliveryView = function() {
  // Préremplir depuis le profil
  const addrEl = document.getElementById('del-address');
  if (addrEl && currentProfile && !addrEl.value) {
    addrEl.placeholder = `${currentProfile.ville} — quartier / rue`;
  }
  showView('delivery');
};

window.setLocMode = function(mode) {
  locMode = mode;
  document.getElementById('loc-btn-gps').className  = 'loc-btn' + (mode==='gps' ?' on':'');
  document.getElementById('loc-btn-desc').className = 'loc-btn' + (mode==='desc'?' on':'');
  document.getElementById('loc-gps-panel').style.display  = mode==='gps'  ? 'block' : 'none';
  document.getElementById('loc-desc-panel').style.display = mode==='desc' ? 'block' : 'none';
};

window.getGPS = function() {
  const btn = document.getElementById('gps-btn');
  const res = document.getElementById('gps-result');
  btn.innerHTML = '<span class="spin-sm"></span> Localisation...'; btn.disabled = true;
  if (!navigator.geolocation) {
    res.style.display='block'; res.innerHTML='❌ Géolocalisation non supportée.';
    btn.innerHTML='📡 Obtenir ma position'; btn.disabled=false; return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      gpsCoords = { lat:pos.coords.latitude, lng:pos.coords.longitude };
      res.style.display = 'block';
      res.innerHTML = `✅ <strong>Position obtenue !</strong><br/>
        <a href="https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}" target="_blank" style="color:var(--blue)">Voir sur Maps</a>`;
      btn.innerHTML = '🔄 Actualiser position'; btn.disabled = false;
    },
    () => {
      res.style.display='block'; res.innerHTML='❌ Position indisponible. Utilisez la description.';
      btn.innerHTML='📡 Réessayer'; btn.disabled=false;
    },
    { enableHighAccuracy:true, timeout:10000 }
  );
};

window.goToPayment = function() {
  const addr  = document.getElementById('del-address')?.value.trim() || '';
  const desc  = document.getElementById('del-desc')?.value.trim()    || '';
  if (locMode==='gps' && !gpsCoords && !addr) {
    showToast('⚠️ Obtenez votre GPS ou décrivez votre position', '#F5820A'); return;
  }
  if (locMode==='desc' && !desc) { showToast('⚠️ Décrivez votre position', '#F5820A'); return; }

  const items = Object.values(cart);
  document.getElementById('recap-items').innerHTML = items.map(a =>
    `<div class="recap-item">
      <div><span class="recap-name">${a.name}</span><span class="recap-qty">x${a.qty}</span></div>
      <div class="recap-price">${fmt(a.price*a.qty)}</div>
    </div>`).join('');
  document.getElementById('recap-total-val').textContent = fmt(cartTotal());
  showView('payment');
};

/* ────────────────────────────────────────
   PAIEMENT
──────────────────────────────────────── */
window.selectPay = function(mode) {
  selPay = mode;
  ['mixx','flooz','livraison'].forEach(m =>
    document.getElementById('pay-'+m).classList.toggle('selected', m===mode)
  );
};

/* ────────────────────────────────────────
   CONFIRMER COMMANDE (catalogue)
──────────────────────────────────────── */
window.confirmOrder = async function() {
  if (!currentUser || !currentProfile) { openAuthModal('login'); return; }
  const svc   = SVCS[currentService];
  const addr  = document.getElementById('del-address')?.value.trim() || '';
  const notes = document.getElementById('del-notes')?.value.trim()   || '';
  let pos = {};
  if (locMode==='gps' && gpsCoords) {
    pos = { positionType:'GPS', lat:gpsCoords.lat, lng:gpsCoords.lng };
  } else {
    pos = { positionType:'description', positionDesc: document.getElementById('del-desc')?.value.trim()||'' };
  }

  const btn = document.getElementById('confirm-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spin-sm"></span> Traitement...';

  try {
    const articles = Object.values(cart).map(a => ({ id:a.id, name:a.name, price:a.price, qty:a.qty }));
    const ref = await addDoc(collection(db,'commandes'), {
      uid:          currentUser.uid,
      clientNom:    `${currentProfile.prenom} ${currentProfile.nom}`,
      clientPhone:  currentProfile.phone,
      clientVille:  currentProfile.ville,
      clientGenre:  currentProfile.genre,
      clientEmail:  currentUser.email,
      service:      currentService,
      serviceName:  svc.name,
      statut:       'En attente',
      adresse:      addr, notes,
      modePaiement: selPay,
      articles, total: cartTotal(),
      ...pos,
      createdAt: serverTimestamp()
    });
    document.getElementById('succ-msg').innerHTML =
      `Commande <strong style="color:var(--blue)">${svc.name}</strong> confirmée !<br/>
       Référence : <strong>#${ref.id.slice(0,8).toUpperCase()}</strong><br/>
       ${selPay==='livraison'?'💵 Paiement à la livraison — notre agent vous contacte bientôt.':'📱 Paiement '+selPay+' en cours.'}<br/>
       <small style="color:var(--light)">Suivez votre commande dans "Mes Commandes"</small>`;
    showView('success');
    cart = {}; updateCartBar();
  } catch(err) {
    showToast('❌ Erreur : ' + err.message, '#C62828');
    btn.disabled = false; btn.innerHTML = '✅ Confirmer la commande';
  }
};

/* ────────────────────────────────────────
   FORMULAIRE STANDARD
──────────────────────────────────────── */
window.submitStandardForm = async function() {
  if (!currentUser || !currentProfile) { openAuthModal('login'); return; }
  const svc = SVCS[currentService];
  const data = {
    uid: currentUser.uid,
    clientNom:   `${currentProfile.prenom} ${currentProfile.nom}`,
    clientPhone: currentProfile.phone,
    clientVille: currentProfile.ville,
    clientGenre: currentProfile.genre,
    clientEmail: currentUser.email,
    service: currentService, serviceName: svc.name,
    statut: 'En attente', createdAt: serverTimestamp()
  };
  let ok = true;
  (svc.fields || []).forEach(f => {
    const el = document.getElementById('ff-' + f.n);
    if (!el) return;
    const v = el.value.trim();
    if (!f.opt && !v) { el.style.borderColor='#F5820A'; ok=false; }
    else { el.style.borderColor=''; data[f.n] = v; }
  });
  if (!ok) { showToast('⚠️ Remplissez tous les champs', '#F5820A'); return; }

  const btn = document.getElementById('form-submit-btn');
  btn.disabled=true; btn.innerHTML='<span class="spin-sm"></span> Envoi...';
  try {
    const ref = await addDoc(collection(db,'commandes'), data);
    document.getElementById('succ-msg').innerHTML =
      `Demande <strong style="color:var(--blue)">${svc.name}</strong> envoyée !<br/>
       Référence : <strong>#${ref.id.slice(0,8).toUpperCase()}</strong><br/>
       Notre équipe vous contactera très bientôt.`;
    showView('success');
  } catch(e) {
    showToast('❌ Erreur : ' + e.message, '#C62828');
    btn.disabled=false; btn.innerHTML='📨 Envoyer ma demande';
  }
};

/* ────────────────────────────────────────
   MES COMMANDES — liées à l'UID
──────────────────────────────────────── */
const SC_COLORS = {
  'En attente': {c:'#F5820A', bg:'#FFF3E0'},
  'Confirmée':  {c:'#1E6FBE', bg:'#E3F2FD'},
  'En cours':   {c:'#7B1FA2', bg:'#F3E5F5'},
  'Terminée':   {c:'#2E7D32', bg:'#E8F5E9'},
  'Annulée':    {c:'#C62828', bg:'#FFEBEE'}
};
const STEPS = ['En attente','Confirmée','En cours','Terminée'];

async function loadMyOrders() {
  if (!currentUser) return;
  const out = document.getElementById('orders-out');
  if (!out) return;
  out.innerHTML = `<div class="spin-center" style="padding:40px"><div class="spinner"></div></div>`;

  try {
    const q  = query(collection(db,'commandes'), where('uid','==',currentUser.uid), orderBy('createdAt','desc'));
    const sn = await getDocs(q);

    if (sn.empty) {
      out.innerHTML = `<div class="orders-empty">
        <div class="orders-empty-ico">📦</div>
        <div class="orders-empty-title">Aucune commande</div>
        <div class="orders-empty-sub">Vous n'avez pas encore commandé. Découvrez nos services !</div>
        <button class="orders-discover-btn" onclick="goTab('services')">Voir les services →</button>
      </div>`; return;
    }

    let h = `<div class="orders-count">${sn.size} commande${sn.size>1?'s':''}</div>`;

    sn.forEach(d => {
      const o = { id:d.id, ...d.data() };
      const sc  = SC_COLORS[o.statut] || SC_COLORS['En attente'];
      const idx = STEPS.indexOf(o.statut);
      const date = o.createdAt
        ? new Date(o.createdAt.seconds*1000).toLocaleString('fr-FR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})
        : '—';

      const prog = STEPS.map((st, i) => {
        const done = i <= idx && o.statut !== 'Annulée';
        return `<div class="pd${done?' pd-done':''}">${done?'✓':''}</div>${i<3?`<div class="pl${i<idx&&o.statut!=='Annulée'?' pl-done':''}"></div>`:''}`;
      }).join('');

      const artHtml = (o.articles||[]).length
        ? `<div class="o-arts">${o.articles.map(a=>`
            <div class="o-art"><span class="o-an">${a.name}</span><span class="o-aq">×${a.qty}</span><span class="o-ap">${fmt(a.price*a.qty)}</span></div>`).join('')}
          </div>` : '';

      h += `<div class="o-card">
        <div class="o-head">
          <div class="o-left">
            <div class="o-svc-name">${o.serviceName||o.service}</div>
            <div class="o-date">📅 ${date}</div>
            <div class="o-ref">#${o.id.slice(0,8).toUpperCase()}</div>
          </div>
          <span class="o-pill" style="background:${sc.bg};color:${sc.c}">${o.statut}</span>
        </div>
        ${artHtml}
        <div class="o-meta">
          ${o.adresse?`<div class="o-meta-row"><span class="o-mk">📍 Adresse</span><span class="o-mv">${o.adresse}</span></div>`:''}
          ${o.modePaiement?`<div class="o-meta-row"><span class="o-mk">💳 Paiement</span><span class="o-mv">${o.modePaiement}</span></div>`:''}
          ${o.total?`<div class="o-meta-row"><span class="o-mk">💰 Total</span><span class="o-mv o-total">${fmt(o.total)}</span></div>`:''}
        </div>
        <div class="o-prog-section">
          <div class="o-prog-label">Suivi de la commande</div>
          <div class="o-prog">${prog}</div>
          <div class="o-prog-lbls">
            <span>Reçue</span><span>Confirmée</span><span>En cours</span><span>Terminée</span>
          </div>
        </div>
      </div>`;
    });

    out.innerHTML = h;
  } catch(err) {
    out.innerHTML = `<div class="orders-error">
      <div class="orders-empty-ico">❌</div>
      <div class="orders-empty-title">Erreur de chargement</div>
      <div class="orders-empty-sub">${err.message}</div>
      <button class="orders-discover-btn" onclick="loadMyOrders()">Réessayer</button>
    </div>`;
  }
}
window.loadMyOrders = loadMyOrders;

/* ────────────────────────────────────────
   SLIDER HERO
──────────────────────────────────────── */
let slides = [...document.querySelectorAll('.slide')];
const dotsEl = document.getElementById('slider-dots');

function goSlide(i) {
  if (!slides.length) return;
  slides[sliderIdx].classList.remove('on');
  dotsEl?.querySelectorAll('.dot')[sliderIdx]?.classList.remove('on');
  sliderIdx = ((i % slides.length) + slides.length) % slides.length;
  slides[sliderIdx].classList.add('on');
  dotsEl?.querySelectorAll('.dot')[sliderIdx]?.classList.add('on');
}
window.goSlide = goSlide;

function startSlider() {
  if (sliderTimer) clearInterval(sliderTimer);
  sliderTimer = setInterval(() => goSlide(sliderIdx + 1), 4500);
}
startSlider();

async function loadPartnerSlides() {
  try {
    const q  = query(collection(db,'partenaires'), orderBy('ordre','asc'));
    const sn = await getDocs(q);
    if (sn.empty) return;
    const sliderEl = document.getElementById('hero-slider');
    sn.forEach(d => {
      const p = d.data(); if (!p.imageUrl) return;
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.innerHTML = `
        <div class="slide-bg" style="background-image:url('${p.imageUrl}')"></div>
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <div class="slide-title">${p.nom||'Partenaire'}</div>
          <div class="slide-sub">${p.description||''}</div>
        </div>
        ${p.lien?`<a class="slide-cta" href="${p.lien}" target="_blank">Découvrir →</a>`:''}`;
      sliderEl.insertBefore(slide, dotsEl);
      const dot = document.createElement('button');
      dot.className = 'dot';
      const idx = slides.length;
      dot.onclick = () => goSlide(idx);
      dotsEl.appendChild(dot);
      slides.push(slide);
    });
    clearInterval(sliderTimer); startSlider();
  } catch(e) {}
}
loadPartnerSlides();

/* ────────────────────────────────────────
   RECHERCHE SERVICES
──────────────────────────────────────── */
window.filterServices = function(q) {
  if (!document.getElementById('t-services')?.classList.contains('on')) goTab('services');
  document.querySelectorAll('#view-list .svc-row').forEach(r => {
    r.style.display = !q || r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
};
