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
  getDocs, orderBy, serverTimestamp, doc, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth
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

// Exposer pour le polling de notifications (depuis index.html inline script)
window._firestoreDb    = db;
window._firestoreUtils = { collection, query, where, getDocs, orderBy };

// ════════════════════════════════════════
// ÉTAT GLOBAL
// ════════════════════════════════════════
let currentUser       = null;   // profil Firestore de l'utilisateur connecté
let currentService    = null;
let currentRestaurant = null;   // restaurant sélectionné dans la vue Restaurants
let cart              = {};
let locMode           = 'gps';
let gpsCoords         = null;
let selectedPayment   = 'livraison';
let sliderIdx         = 0;
let sliderTimer       = null;

const CATALOGUE_SERVICES = ['food', 'clothes', 'omni_drink', 'marketplace'];
const RESTAURANT_SERVICE = 'restaurant'; // service spécial avec vue par restaurant
const KITS_SERVICE = 'kits'; // service spécial avec vue liste kits + détail
const PACKS_SERVICES = ['mathivick', 'omega_conseil']; // services avec packs
const TOGO_EXPERTISE_SERVICE = 'togo_expertise'; // service enveloppe pour Mathivick & Omega Conseils
const IMMOBILIER_SERVICE = 'immobilier'; // service immobilier avec flux spécifique

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
    // Chemin relatif obligatoire pour GitHub Pages (sous-dossier /OmniServiceTG/)
    // '/sw.js' cherche à la racine du domaine → 404
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(r => console.log('[PWA] SW enregistré, scope :', r.scope))
      .catch(e => console.warn('[PWA] SW erreur :', e));
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
// AUTH — RESTAURATION DE SESSION (localStorage)
// ════════════════════════════════════════
// Flag pour éviter que la restauration de session interfère pendant inscription/connexion manuelle
let _authHandledManually = false;

async function restoreSession() {
  if (_authHandledManually) return;

  const savedUid = localStorage.getItem('omni_uid');
  if (!savedUid) {
    currentUser = null;
    updateNavForAuth(false);
    updateProfilePage();
    return;
  }

  try {
    let snap = null;
    for (let i = 0; i < 3; i++) {
      snap = await getDoc(doc(db, 'users', savedUid));
      if (snap.exists()) break;
      await new Promise(r => setTimeout(r, 500));
    }
    if (snap && snap.exists()) {
      currentUser = { uid: savedUid, ...snap.data() };
    } else {
      // UID sauvegardé invalide → nettoyer
      localStorage.removeItem('omni_uid');
      currentUser = null;
    }
  } catch(e) {
    currentUser = null;
  }

  updateNavForAuth(!!currentUser);
  updateProfilePage();
  if (currentUser && document.getElementById('p-orders')?.classList.contains('on')) {
    loadMyOrders();
  }
}

// Lancer la restauration de session au démarrage
restoreSession();

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
  // Exposer currentUser pour le système de notifications
  window._currentUser = currentUser;
  // Démarrer/arrêter l'écoute temps réel des commandes
  if (isLoggedIn && currentUser) {
    startOrderStatusListener();
  } else {
    stopOrderStatusListener();
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

// ── CONNEXION PAR TÉLÉPHONE ──
async function doLogin() {
  const phone = document.getElementById('login-phone').value.trim();
  const err   = document.getElementById('auth-err');
  const btn   = document.getElementById('login-btn');

  if (!phone) { err.textContent = '⚠️ Veuillez saisir votre numéro de téléphone.'; return; }

  // Normaliser le numéro (retirer espaces et tirets)
  const phoneNorm = phone.replace(/[\s\-().]/g, '');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Connexion...';
  err.textContent = '';

  try {
    // Chercher le compte dans Firestore par numéro de téléphone
    const q = query(collection(db, 'users'), where('phone', '==', phoneNorm));
    const snap = await getDocs(q);

    if (snap.empty) {
      err.textContent = '❌ Aucun compte trouvé avec ce numéro. Inscrivez-vous.';
      return;
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    // Bloquer onAuthStateChanged pendant qu'on gère manuellement
    _authHandledManually = true;

    // Utiliser l'uid existant du profil Firestore
    const existingUid = userDoc.id;

    // Mettre à jour la date de dernière connexion
    await setDoc(doc(db, 'users', existingUid), {
      lastLogin: serverTimestamp()
    }, { merge: true });

    // Mettre à jour currentUser immédiatement
    currentUser = { uid: existingUid, ...userData };

    // Sauvegarder la session en local
    localStorage.setItem('omni_uid', existingUid);

    // Réactiver onAuthStateChanged
    _authHandledManually = false;

    // Mettre à jour l'interface
    updateNavForAuth(true);
    updateProfilePage();
    closeAuthModal();
    showToast('✅ Connecté avec succès !', '#2E7D32');

  } catch(e) {
    _authHandledManually = false;
    err.textContent = '❌ Erreur de connexion. Réessayez.';
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Se connecter →';
  }
}
window.doLogin = doLogin;

// ── INSCRIPTION PAR TÉLÉPHONE ──
async function doSignup() {
  const nom    = document.getElementById('signup-nom').value.trim();
  const prenom = document.getElementById('signup-prenom').value.trim();
  const genre  = document.getElementById('signup-genre').value;
  const phone  = document.getElementById('signup-phone').value.trim();
  const ville  = document.getElementById('signup-ville').value.trim();
  const err    = document.getElementById('auth-err');
  const btn    = document.getElementById('signup-btn');

  if (!nom || !prenom || !genre || !phone || !ville) {
    err.textContent = '⚠️ Veuillez remplir tous les champs.'; return;
  }

  // Normaliser le numéro
  const phoneNorm = phone.replace(/[\s\-().]/g, '');
  if (phoneNorm.length < 8) {
    err.textContent = '⚠️ Numéro de téléphone invalide.'; return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Inscription...';
  err.textContent = '';

  try {
    // Vérifier si le numéro est déjà utilisé
    const q = query(collection(db, 'users'), where('phone', '==', phoneNorm));
    const existing = await getDocs(q);
    if (!existing.empty) {
      err.textContent = '❌ Ce numéro est déjà enregistré. Connectez-vous.';
      return;
    }

    // Bloquer onAuthStateChanged pendant qu'on gère manuellement
    _authHandledManually = true;

    // Générer un UID unique sans Firebase Anonymous Auth
    const newUid = crypto.randomUUID();

    // Profil complet à sauvegarder
    const profil = {
      nom, prenom, genre,
      phone: phoneNorm,
      ville,
      uid: newUid,
      createdAt: serverTimestamp()
    };

    // Sauvegarder dans Firestore
    await setDoc(doc(db, 'users', newUid), profil);

    // Mettre à jour currentUser immédiatement (sans attendre Firestore)
    currentUser = { uid: newUid, nom, prenom, genre, phone: phoneNorm, ville };

    // Sauvegarder la session en local
    localStorage.setItem('omni_uid', newUid);

    // Réactiver onAuthStateChanged
    _authHandledManually = false;

    // Mettre à jour l'interface
    updateNavForAuth(true);
    updateProfilePage();
    closeAuthModal();
    showToast(`✅ Bienvenue ${prenom} !`, '#2E7D32');

  } catch(e) {
    _authHandledManually = false;
    err.textContent = '❌ Erreur : ' + e.message;
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = "S'inscrire →";
  }
}
window.doSignup = doSignup;

// ── DÉCONNEXION ──
async function doLogout() {
  localStorage.removeItem('omni_uid');
  currentUser = null;
  updateNavForAuth(false);
  updateProfilePage();
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
  // Services lancés le 16 mars 2026
  food: {
    name:"Alimentation générale et produits locaux", icon:"🛒", bg:"#FFF3E0", active:false, soon:"16 Mars 2026",
    fields:[
      {n:"produits",l:"Produits souhaités",t:"textarea",ph:"Ex : 2 kg de Tilapia, 1 bouteille de vin de palme..."},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"},
      {n:"date",l:"Date souhaitée",t:"date"},
      {n:"notes",l:"Remarques (optionnel)",t:"textarea",ph:"Précisions...",opt:true}
    ]
  },
  restaurant: {
    name:"Restaurants", icon:"🍽️", bg:"#E3F2FD", active:false, soon:"16 Mars 2026",
    fields:[]
  },
  delivery: {
    name:"Livraison et courses", icon:"🚗", bg:"#FFF3E0", active:false, soon:"16 Mars 2026",
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Livraison express","Courses personnalisées","Livraison entreprise","Livraison de plats"]},
      {n:"detail",l:"Lieu de collecte / Liste d'articles",t:"textarea",ph:"Adresse ou liste..."},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"},
      {n:"urgence",l:"Urgence",t:"select",opts:["Express (< 1h)","Dans la journée","Planifier"]}
    ]
  },
  maintenance: {
    name:"Dépannage", icon:"🔧", bg:"#E3F2FD", active:false, soon:"16 Mars 2026",
    fields:[
      {n:"type",l:"Type d'intervention",t:"select",opts:["Électricité","Plomberie","Climatisation","Électroménager","Informatique","Pose TV/Antenne","Autres travaux"]},
      {n:"problem",l:"Description du problème",t:"textarea",ph:"Décrivez le problème..."},
      {n:"adresse",l:"Adresse",t:"text",ph:"Votre adresse à Lomé"}
    ]
  },
  
  // Services lancés le 07 avril 2026
  clothes: {
    name:"Prêt-à-porter", icon:"👗", bg:"#FFF3E0", active:false, soon:"07 Avril 2026",
    fields:[]
  },
  cleaning: {
    name:"Nettoyage professionnel", icon:"✨", bg:"#E3F2FD", active:false, soon:"07 Avril 2026",
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Nettoyage résidentiel","Nettoyage bureaux","Entretien régulier","Entretien industriel"]},
      {n:"superficie",l:"Superficie (m²)",t:"number",ph:"Ex : 60"},
      {n:"adresse",l:"Adresse",t:"text",ph:"Votre adresse à Lomé"},
      {n:"date",l:"Date souhaitée",t:"date"}
    ]
  },
  kits: {
    name:"Kits & Packs", icon:"📦", bg:"#E8F5E9", active:false, soon:"07 Avril 2026",
    fields:[]
  },
  
  // Nouveaux services lancés le 07 avril 2026
  togo_expertise: {
    name:"TOGO Expertise", icon:"🏆", bg:"#EDE7F6", active:false, soon:"07 Avril 2026",
    fields:[]
  },
  mathivick: {
    name:"Mathivick - Formation Commerciale", icon:"🚀", bg:"#FFF3E0", active:false, soon:"07 Avril 2026",
    fields:[]
  },
  omega_conseil: {
    name:"Omega Conseils - Financement de projets", icon:"💼", bg:"#E3F2FD", active:false, soon:"07 Avril 2026",
    fields:[]
  },
  immobilier: {
    name:"Service Immobilier", icon:"🏢", bg:"#E8F5E9", active:false, soon:"07 Avril 2026",
    fields:[]
  },
  
  security: {
    name:"Gardiennage & Sécurité", icon:"🛡️", bg:"#E3F2FD", active:false, soon:"7 Avril 2026",
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Gardiennage Résidentiel","Gardiennage Boutique","Sécurité Événementielle","Surveillance Temporaire"]},
      {n:"detail",l:"Description du besoin",t:"textarea",ph:"Vos besoins en sécurité..."},
      {n:"adresse",l:"Lieu / Adresse",t:"text",ph:"Votre adresse à Lomé"}
    ]
  },
  traiteur: {
    name:"Service Traiteur", icon:"🍽️", bg:"#FFF8E1", active:false, soon:"07 Avril 2026",
    fields:[
      {n:"type_event",l:"Type d'événement",t:"select",opts:["Anniversaire","Fête de famille","Mariage / Cérémonie","Baptême / Communion","Événement d'entreprise","Fête nationale / Culturelle","Autre événement"]},
      {n:"description",l:"Description de l'événement",t:"textarea",ph:"Date, lieu, thème, nombre de personnes, type de repas..."},
      {n:"nb_personnes",l:"Nombre de personnes",t:"number",ph:"Ex : 50"},
      {n:"date",l:"Date de l'événement",t:"date"},
      {n:"budget",l:"Budget estimé (optionnel)",t:"text",ph:"Ex : 150 000 FCFA",opt:true},
      {n:"notes",l:"Remarques (optionnel)",t:"textarea",ph:"Allergies, restrictions alimentaires...",opt:true}
    ]
  },
  omni_drink: {
    name:"Omni Drink TG", icon:"🍾", bg:"#E0F7FA", active:false, soon:"07 Avril 2026",
    fields:[]
  },
  marketplace: {
    name:"Marketplace — Articles divers", icon:"🛍️", bg:"#FCE4EC", active:false, soon:"07 Avril 2026",
    fields:[]
  }
};

// ════════════════════════════════════════
// AUTOMATISATION DES DATES DE LANCEMENT
// Active automatiquement les services dont la date soon est passée
// ════════════════════════════════════════
(function autoActivateServices() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const MONTHS_FR = {
    'Janvier':0,'Février':1,'Mars':2,'Avril':3,'Mai':4,'Juin':5,
    'Juillet':6,'Août':7,'Septembre':8,'Octobre':9,'Novembre':10,'Décembre':11
  };
  Object.values(SVCS).forEach(svc => {
    if (svc.active || !svc.soon) return;
    // Format attendu : "DD Mois YYYY" ex: "16 Mars 2026"
    const parts = svc.soon.replace(/[^a-zA-Z0-9éûôàè ]/gi, '').trim().split(/\s+/);
    if (parts.length < 3) return;
    const day   = parseInt(parts[0], 10);
    const month = MONTHS_FR[parts[1]];
    const year  = parseInt(parts[2], 10);
    if (isNaN(day) || month === undefined || isNaN(year)) return;
    const launchDate = new Date(year, month, day);
    if (today >= launchDate) {
      svc.active = true;
    }
  });
})();

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
  ],
  omni_drink: [
    {id:'od1',name:'Eau minérale (casier 24×50cl)',desc:'Eau minérale pure, 24 bouteilles',price:3500,unit:'casier',emoji:'💧'},
    {id:'od2',name:'Jus de fruits naturels (1L)',desc:'Orange, ananas, bissap — sans conservateurs',price:1500,unit:'bouteille',emoji:'🍊'},
    {id:'od3',name:'Sodas assortis (casier 24)',desc:'Coca-Cola, Fanta, Sprite...',price:9000,unit:'casier',emoji:'🥤'},
    {id:'od4',name:'Bières locales (casier 24)',desc:'Awooyo, Castel, Flag...',price:14000,unit:'casier',emoji:'🍺'},
    {id:'od5',name:'Vin de palme (5L)',desc:'Artisanal frais, production locale',price:4000,unit:'bidon',emoji:'🌴'},
    {id:'od6',name:'Pack événement boissons',desc:'Assortiment complet pour 50 personnes',price:45000,unit:'pack',emoji:'🎉'},
  ],
  marketplace: [
    {id:'mk1',name:'Articles ménagers',desc:'Ustensiles, casseroles, vaisselle, petits électroménagers',price:5000,unit:'article',emoji:'🏠'},
    {id:'mk2',name:'Fournitures de bureau',desc:'Rames papier, stylos, classeurs, cartouches imprimante',price:2500,unit:'lot',emoji:'✏️'},
    {id:'mk3',name:'Produits hygiène & beauté',desc:'Savons, shampooings, crèmes, parfums, soins du corps',price:3000,unit:'lot',emoji:'🧴'},
    {id:'mk4',name:'Électronique & Accessoires',desc:'Câbles USB, chargeurs, batteries, accessoires téléphone',price:4500,unit:'pièce',emoji:'📱'},
    {id:'mk5',name:'Jouets & Articles enfants',desc:'Jouets éducatifs, fournitures scolaires, articles bébé',price:6000,unit:'article',emoji:'🧸'},
    {id:'mk6',name:'Article personnalisé',desc:'Dites-nous ce que vous cherchez, on le trouve pour vous !',price:0,unit:'Sur devis',emoji:'🛒'},
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
const VIEWS = ['list','restaurants','kits','kit-detail','immo-options','immo-form','catalogue','form','delivery','payment','success'];
function showView(v) {
  VIEWS.forEach(x => {
    const el = document.getElementById('view-'+x);
    if (el) el.style.display = x===v ? 'block' : 'none';
  });
  window.scrollTo({top:0,behavior:"smooth"});
}
window.showView = showView;

// ── Afficher la vue succès avec compte à rebours et bouton commandes ──
function showSuccessView() {
  showView('success');
  // Afficher le bouton "Voir mes commandes"
  const succBtn = document.getElementById('succ-view-orders-btn');
  if (succBtn) succBtn.style.display = 'block';
  // Démarrer le compte à rebours
  const cdEl = document.getElementById('succ-countdown');
  const rdEl = document.getElementById('succ-redirect-msg');
  if (rdEl) rdEl.style.display = 'block';
  let count = 5;
  if (cdEl) cdEl.textContent = count;
  const timer = setInterval(() => {
    count--;
    if (cdEl) cdEl.textContent = count;
    if (count <= 0) {
      clearInterval(timer);
      goTab('orders');
    }
  }, 1000);
}
window.showSuccessView = showSuccessView;

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

  // Activer l'onglet services sans forcer showView('list')
  document.querySelectorAll(".page").forEach(p => p.classList.remove("on"));
  const page = document.getElementById("p-services");
  if (page) page.classList.add("on");
  document.querySelectorAll(".btab").forEach(b => b.classList.remove("on"));
  const bt = document.getElementById("t-services");
  if (bt) bt.classList.add("on");
  document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("on"));
  const nl = document.getElementById("nl-services");
  if (nl) nl.classList.add("on");
  
  currentService = id;
  cart = {};
  const svc = SVCS[id];
  if (!svc) return;

  // ── Cas spécial : service Kits/PACKS → vue liste des kits ──
  if (id === KITS_SERVICE) {
    document.getElementById('kits-svc-ico').style.background = svc.bg;
    document.getElementById('kits-svc-ico').textContent = svc.icon;
    document.getElementById('kits-svc-title').textContent = svc.name;
    loadKitsList();
    showView('kits');
    return;
  }

  // ── Cas spécial : service Restaurants → vue liste des restaurants ──
  if (id === RESTAURANT_SERVICE) {
    document.getElementById('rest-svc-ico').style.background = svc.bg;
    document.getElementById('rest-svc-ico').textContent = svc.icon;
    document.getElementById('rest-svc-title').textContent = svc.name;
    loadRestaurantsList();
    showView('restaurants');
    return;
  }

  // ── Cas spécial : service Kits & Packs ──
  if (id === KITS_SERVICE) {
    document.getElementById('kits-svc-ico').style.background = svc.bg;
    document.getElementById('kits-svc-ico').textContent = svc.icon;
    document.getElementById('kits-svc-title').textContent = svc.name;
    const titleEl = document.getElementById('kits-section-title');
    if (titleEl) titleEl.textContent = '📦 Nos kits disponibles';
    loadKitsList();
    showView('kits');
    return;
  }

  // ── Cas spécial : service Immobilier → vue catégories immobilier ──
  if (id === IMMOBILIER_SERVICE) {
    document.getElementById('kits-svc-ico').style.background = svc.bg;
    document.getElementById('kits-svc-ico').textContent = svc.icon;
    document.getElementById('kits-svc-title').textContent = svc.name;
    const titleEl = document.getElementById('kits-section-title');
    if (titleEl) titleEl.textContent = '🏢 Nos catégories de services';
    loadKitsList(id, true); // true = mode immobilier (cartes cliquables vers immo-options)
    showView('kits');
    return;
  }

  // ── Cas spécial : TOGO Expertise → sous-menu Mathivick / Omega Conseils ──
  if (id === TOGO_EXPERTISE_SERVICE) {
    showTogoExpertiseMenu();
    return;
  }

  // ── Cas spécial : services avec système de packs (Mathivick, Omega Conseils) ──
  if (PACKS_SERVICES.includes(id)) {
    document.getElementById('kits-svc-ico').style.background = svc.bg;
    document.getElementById('kits-svc-ico').textContent = svc.icon;
    document.getElementById('kits-svc-title').textContent = svc.name;
    // Titre de section personnalisé par service
    const sectionTitles = {
      'mathivick': '🚀 Nos offres Mathivick',
      'omega_conseil': '💼 Nos packs Omega Conseils'
    };
    const titleEl = document.getElementById('kits-section-title');
    if (titleEl) titleEl.textContent = sectionTitles[id] || '📦 Nos offres';
    loadKitsList(id); // Charger les packs du service spécifique
    showView('kits');
    return;
  }

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
  
  window.scrollTo({top:0,behavior:"smooth"});
}
window.openService = openService;

// ════════════════════════════════════════
// TOGO EXPERTISE — SOUS-MENU
// ════════════════════════════════════════
function showTogoExpertiseMenu() {
  let existing = document.getElementById("togo-expertise-overlay");
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.id = "togo-expertise-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px 22px;max-width:380px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
        <div style="width:48px;height:48px;background:#EDE7F6;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;">🏆</div>
        <div>
          <div style="font-weight:700;font-size:18px;color:#1A1A2E;">TOGO Expertise</div>
          <div style="font-size:12px;color:#9E9EC0;">Choisissez un service</div>
        </div>
        <button onclick="document.getElementById('togo-expertise-overlay').remove()" style="margin-left:auto;background:none;border:none;font-size:22px;color:#9E9EC0;cursor:pointer;">×</button>
      </div>
      <p style="color:#666;font-size:13px;margin:12px 0 20px;">TOGO Expertise regroupe deux pôles complémentaires. Sélectionnez celui qui vous intéresse :</p>
      <button onclick="document.getElementById('togo-expertise-overlay').remove();openService('mathivick');" style="width:100%;display:flex;align-items:center;gap:14px;padding:16px;background:#FFF3E0;border:none;border-radius:14px;cursor:pointer;margin-bottom:12px;text-align:left;">
        <div style="width:44px;height:44px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">🚀</div>
        <div>
          <div style="font-weight:700;font-size:15px;color:#1A1A2E;">Mathivick</div>
          <div style="font-size:12px;color:#888;">Formation commerciale</div>
        </div>
        <span style="margin-left:auto;font-size:20px;color:#E8EAF0;">›</span>
      </button>
      <button onclick="document.getElementById('togo-expertise-overlay').remove();openService('omega_conseil');" style="width:100%;display:flex;align-items:center;gap:14px;padding:16px;background:#E3F2FD;border:none;border-radius:14px;cursor:pointer;text-align:left;">
        <div style="width:44px;height:44px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">💼</div>
        <div>
          <div style="font-weight:700;font-size:15px;color:#1A1A2E;">Omega Conseils</div>
          <div style="font-size:12px;color:#888;">Financement de projets</div>
        </div>
        <span style="margin-left:auto;font-size:20px;color:#E8EAF0;">›</span>
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}
window.showTogoExpertiseMenu = showTogoExpertiseMenu;

// ════════════════════════════════════════
// RESTAURANTS — VUE LISTE
// ════════════════════════════════════════

// Restaurants par défaut intégrés dans l'app
const DEFAULT_RESTAURANTS = [
  {id:'rst1', nom:'Le Saveur d\'Afrique', specialites:'Cuisine togolaise traditionnelle', localite:'Adidogomé, Lomé', emoji:'🥘', description:'Spécialiste du fufu, du riz sauce et des plats locaux authentiques.'},
  {id:'rst2', nom:'Chez Maman Akossiwa',  specialites:'Plats locaux & traiteur',         localite:'Bè Kpota, Lomé',   emoji:'🍲', description:'Cuisine familiale, plats du jour et service traiteur pour événements.'},
  {id:'rst3', nom:'Grill Palace',          specialites:'Grillades & brochettes',           localite:'Kodjoviakopé, Lomé',emoji:'🔥', description:'Brochettes mixtes, poulet grillé, côtes de bœuf marinées.'},
  {id:'rst4', nom:'La Terrasse Ivoirienne',specialites:'Attiéké, alloco & poissons',      localite:'Agbalépédogan, Lomé',emoji:'🐠', description:'Spécialités ivoiriennes, attiéké poisson, alloco banane.'},
];

async function loadRestaurantsList() {
  const container = document.getElementById('restaurants-list');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:40px;color:#9999BB"><div class="spinner" style="border-color:rgba(30,111,190,.2);border-top-color:#1E6FBE"></div><div style="margin-top:10px;font-size:12px">Chargement des restaurants...</div></div>`;

  let dbRestaurants = [];
  try {
    let snap;
    try {
      const q = query(collection(db,'restaurants'), orderBy('ordre','asc'));
      snap = await getDocs(q);
    } catch(_) {
      const q2 = query(collection(db,'restaurants'));
      snap = await getDocs(q2);
    }
    snap.forEach(d => dbRestaurants.push({ id:d.id, _src:'db', ...d.data() }));
  } catch(e) {
    console.warn('[Restaurants] Firestore indisponible :', e.message);
  }

  // Fusionner DB + standards non encore présents en DB
  const dbIds = new Set(dbRestaurants.map(r => r.id));
  const stdRests = DEFAULT_RESTAURANTS
    .filter(r => !dbIds.has(r.id))
    .map(r => ({ ...r, _src:'std', actif:true }));

  const allRests = [...dbRestaurants, ...stdRests].filter(r => r.actif !== false);
  allRests.sort((a,b) => (a.ordre ?? 99) - (b.ordre ?? 99) || (a.nom||'').localeCompare(b.nom||''));

  if (!allRests.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#9999BB">Aucun restaurant disponible pour le moment.</div>`;
    return;
  }

  container.innerHTML = allRests.map(r => renderRestaurantCard(r)).join('');
}
window.loadRestaurantsList = loadRestaurantsList;

function renderRestaurantCard(r) {
  const imgHtml = r.imageUrl
    ? `<img src="${r.imageUrl}" alt="${r.nom}" style="width:100%;height:100%;object-fit:cover;border-radius:14px" onerror="this.outerHTML='<span style=font-size:48px>${r.emoji||'🍽️'}</span>'">`
    : `<span style="font-size:48px">${r.emoji||'🍽️'}</span>`;

  const specialites = r.specialites ? r.specialites.split(',')[0].trim() : 'Restaurant';

  return `
  <div class="kit-card" onclick="openRestaurant('${r.id}','${(r.nom||'').replace(/'/g,"\\'")}','${r.emoji||'🍽️'}')">
    <div class="kit-img-wrap" style="background:linear-gradient(135deg,#E3F2FD,#BBDEFB)">
      ${imgHtml}
    </div>
    <div class="kit-body">
      <div class="kit-badge" style="color:#F5820A;background:#FFF3E0">${specialites}</div>
      <div class="kit-name">${r.nom||'Restaurant'}</div>
      <div class="kit-desc">${r.description||r.specialites||''}</div>
      <div class="kit-footer">
        <div style="font-size:11px;font-weight:600;color:#9999BB">📍 ${r.localite||'Lomé'}</div>
        <div class="kit-count">Voir le menu</div>
      </div>
    </div>
    <div class="kit-arrow">›</div>
  </div>`;
}

// ── Ouvrir un restaurant → afficher son menu ──
async function openRestaurant(restaurantId, restaurantNom, restaurantEmoji) {
  currentRestaurant = { id: restaurantId, nom: restaurantNom, emoji: restaurantEmoji };

  // Mettre à jour le header de la vue catalogue
  const svc = SVCS['restaurant'];
  document.getElementById('cat-ico').style.background = svc.bg;
  document.getElementById('cat-ico').textContent = restaurantEmoji;
  document.getElementById('cat-title').textContent = restaurantNom;

  // Le bouton retour de la vue catalogue doit revenir à la liste des restaurants
  const backBtn = document.getElementById('catalogue-back-btn');
  if (backBtn) backBtn.onclick = () => showView('restaurants');

  loadCatalogueRestaurant(restaurantId);
  showView('catalogue');
}
window.openRestaurant = openRestaurant;

// ── Charger les menus d'un restaurant ──
async function loadCatalogueRestaurant(restaurantId) {
  const container = document.getElementById('catalogue-items');
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9999BB"><div class="spinner" style="border-color:rgba(30,111,190,.2);border-top-color:#1E6FBE"></div><div style="margin-top:10px;font-size:12px">Chargement du menu...</div></div>`;
  updateCartBar();

  // Articles par défaut pour chaque restaurant standard
  const DEFAULT_MENUS = {
    rst1: [
      {id:'rst1_m1',name:'Riz sauce arachide',desc:'Plat traditionnel copieux',price:2500,unit:'plat',emoji:'🍚'},
      {id:'rst1_m2',name:'Fufu + soupe de viande',desc:'Fufu de manioc, bouillon maison',price:3000,unit:'plat',emoji:'🍲'},
      {id:'rst1_m3',name:'Akumé + sauce gombo',desc:'Pâte de maïs, sauce gombo',price:2200,unit:'plat',emoji:'🌽'},
      {id:'rst1_m4',name:'Plateau traiteur 10 pers.',desc:'Pour événements et réceptions',price:35000,unit:'plateau',emoji:'🎉'},
    ],
    rst2: [
      {id:'rst2_m1',name:'Plat du jour',desc:'Selon arrivage, servi avec boisson',price:2000,unit:'plat',emoji:'🍱'},
      {id:'rst2_m2',name:'Poulet yassa',desc:'Mariné aux oignons et citron',price:4500,unit:'plat',emoji:'🍗'},
      {id:'rst2_m3',name:'Riz sauce tomate',desc:'Sauce tomate maison, légumes',price:2000,unit:'plat',emoji:'🍅'},
      {id:'rst2_m4',name:'Traiteur événement',desc:'Devis sur mesure pour vos événements',price:50000,unit:'forfait',emoji:'🥂'},
    ],
    rst3: [
      {id:'rst3_m1',name:'Brochettes mixtes',desc:'Bœuf, poulet, foie grillés',price:2000,unit:'portion',emoji:'🍢'},
      {id:'rst3_m2',name:'Poulet grillé entier',desc:'Avec frites et salade',price:8000,unit:'pièce',emoji:'🐔'},
      {id:'rst3_m3',name:'Côtes de bœuf',desc:'Marinées au poivre, grillées au feu de bois',price:5500,unit:'portion',emoji:'🥩'},
      {id:'rst3_m4',name:'Poisson braisé',desc:'Tilapia grillé entier avec garniture',price:3500,unit:'pièce',emoji:'🐟'},
    ],
    rst4: [
      {id:'rst4_m1',name:'Attiéké poisson',desc:'Semoule de manioc + poisson braisé',price:2800,unit:'plat',emoji:'🐠'},
      {id:'rst4_m2',name:'Alloco + poulet',desc:'Banane plantain frite, poulet braisé',price:3200,unit:'plat',emoji:'🍌'},
      {id:'rst4_m3',name:'Garba',desc:'Attiéké + thon frit, spécialité ivoirienne',price:2500,unit:'plat',emoji:'🍽️'},
      {id:'rst4_m4',name:'Placali + sauce graine',desc:'Pâte de manioc, sauce palmiste',price:2800,unit:'plat',emoji:'🌴'},
    ],
  };

  let dbArticles = [];
  try {
    let snap;
    try {
      const q = query(collection(db,'articles'), where('service','==','restaurant'), where('restaurantId','==',restaurantId), orderBy('ordre','asc'));
      snap = await getDocs(q);
    } catch(_) {
      const q2 = query(collection(db,'articles'), where('service','==','restaurant'), where('restaurantId','==',restaurantId));
      snap = await getDocs(q2);
    }
    snap.forEach(d => dbArticles.push({ id:d.id, _src:'db', ...d.data() }));
  } catch(e) {
    console.warn('[Menu] Firestore indisponible :', e.message);
  }

  // Fusionner avec menus par défaut si le restaurant est un standard
  const dbIds = new Set(dbArticles.map(a => a.id));
  const stdMenus = (DEFAULT_MENUS[restaurantId] || [])
    .filter(a => !dbIds.has(a.id))
    .map(a => ({ ...a, _src:'std', stock:'en_stock', actif:true, restaurantId }));

  let articles = [...dbArticles, ...stdMenus];
  articles = articles.filter(a => a.actif !== false);
  articles.sort((a,b) => (a.ordre ?? 99) - (b.ordre ?? 99) || (a.name||'').localeCompare(b.name||''));

  if (!articles.length) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9999BB">Aucun plat disponible pour le moment.</div>`;
    return;
  }
  container.innerHTML = articles.map(a => renderArticleCard(a)).join('');
}

// ════════════════════════════════════════
// KITS & PACKS — VUE LISTE
// ════════════════════════════════════════
let currentKit = null;

const DEFAULT_KITS = [
  {
    id:'kit1', nom:'Kit Repas Semaine', emoji:'🍱',
    description:'Tout ce qu\'il faut pour nourrir votre famille pendant 7 jours',
    prix_total:28500, categorie:'Alimentation',
    articles:[
      {name:'Tilapia frais', qty:2, unit:'kg', emoji:'🐟'},
      {name:'Poulet fermier', qty:2, unit:'pièces', emoji:'🐔'},
      {name:'Légumes assortis', qty:3, unit:'paniers', emoji:'🥬'},
      {name:'Vin de palme', qty:1, unit:'bidon', emoji:'🍶'},
      {name:'Néré (soumbara)', qty:2, unit:'sachets', emoji:'🫘'},
    ]
  },
  {
    id:'kit2', nom:'Pack Fête & Événement', emoji:'🎉',
    description:'Pour vos cérémonies, mariages et réceptions (10-15 personnes)',
    prix_total:75000, categorie:'Restauration',
    articles:[
      {name:'Plateau traiteur', qty:1, unit:'plateau', emoji:'🎊'},
      {name:'Poulet yassa', qty:15, unit:'plats', emoji:'🍗'},
      {name:'Riz sauce arachide', qty:15, unit:'plats', emoji:'🍚'},
      {name:'Boissons variées', qty:1, unit:'lot', emoji:'🥤'},
    ]
  },
  {
    id:'kit3', nom:'Pack Mode Wax Complet', emoji:'👗',
    description:'Ensemble prêt-à-porter africain complet pour homme ou femme',
    prix_total:26000, categorie:'Prêt-à-porter',
    articles:[
      {name:'Boubou wax', qty:1, unit:'pièce', emoji:'👘'},
      {name:'Sac assorti', qty:1, unit:'pièce', emoji:'👜'},
      {name:'Sandales tressées', qty:1, unit:'paire', emoji:'👡'},
      {name:'Kit cosmétiques', qty:1, unit:'kit', emoji:'✨'},
    ]
  },
  {
    id:'kit4', nom:'Kit Nettoyage Maison', emoji:'✨',
    description:'Service de nettoyage + fournitures pour votre domicile (60m²)',
    prix_total:18000, categorie:'Nettoyage',
    articles:[
      {name:'Nettoyage complet', qty:1, unit:'prestation', emoji:'🧹'},
      {name:'Produits ménagers', qty:1, unit:'kit', emoji:'🧴'},
      {name:'Désinfection', qty:1, unit:'prestation', emoji:'🦠'},
    ]
  },
  // Packs Mathivick
  {
    id:'math1', nom:'Formation Commerciale en Ligne', emoji:'💻', service:'mathivick',
    description:'Formation pratique orientée résultats pour améliorer vos techniques de vente',
    prix_total:0, categorie:'Mathivick - Formation',
    articles:[
      {name:'Prospecter efficacement', qty:1, unit:'module', emoji:'🎯'},
      {name:'Convaincre sans forcer', qty:1, unit:'module', emoji:'💬'},
      {name:'Gérer les objections', qty:1, unit:'module', emoji:'🛡️'},
      {name:'Augmenter vos performances', qty:1, unit:'module', emoji:'📈'},
      {name:'Accès plateforme en ligne', qty:1, unit:'accès', emoji:'🌐'},
    ],
    contact:'90 88 88 44'
  },
  {
    id:'math2', nom:'Formation Commerciale en Présentiel', emoji:'🎓', service:'mathivick',
    description:'Sessions dynamiques en présentiel à Lomé pour développer votre activité',
    prix_total:0, categorie:'Mathivick - Formation',
    articles:[
      {name:'Techniques de vente', qty:1, unit:'session', emoji:'📊'},
      {name:'Prospection terrain', qty:1, unit:'atelier', emoji:'🚶'},
      {name:'Structuration commerciale', qty:1, unit:'workshop', emoji:'🏗️'},
      {name:'Développement visibilité', qty:1, unit:'formation', emoji:'📢'},
      {name:'Support de cours', qty:1, unit:'kit', emoji:'📚'},
    ],
    contact:'90 88 88 44'
  },
  {
    id:'math4', nom:'Pack Formation + Suivi Personnalisé', emoji:'🚀', service:'mathivick',
    description:'Formez-vous et bénéficiez d\'un suivi personnalisé pour booster vos performances',
    prix_total:0, categorie:'Mathivick - Combiné',
    articles:[
      {name:'Formation commerciale complète', qty:1, unit:'programme', emoji:'🎓'},
      {name:'Suivi personnalisé mensuel', qty:3, unit:'mois', emoji:'👨‍🏫'},
      {name:'Accès ressources en ligne', qty:1, unit:'accès', emoji:'🌐'},
    ],
    contact:'90 88 88 44'
  },
  // Packs Omega Conseils
  {
    id:'omega1', nom:'Pack Projet Express', emoji:'⚡', service:'omega_conseil',
    description:'Dossier de financement prêt à déposer rapidement',
    prix_total:75000, categorie:'Omega Conseils',
    articles:[
      {name:'Projet complet prêt à déposer', qty:1, unit:'dossier', emoji:'📄'},
      {name:'Budget prévisionnel', qty:1, unit:'document', emoji:'💰'},
      {name:'Plan de remboursement', qty:1, unit:'document', emoji:'📊'},
      {name:'Version Word & PDF', qty:1, unit:'format', emoji:'📁'},
      {name:'Aucune séance de coaching', qty:0, unit:'séances', emoji:'💼'},
    ]
  },
  {
    id:'omega2', nom:'Pack Entrepreneur Pro', emoji:'🎯', service:'omega_conseil',
    description:'Dossier bancaire complet avec étude de marché et coaching',
    prix_total:150000, categorie:'Omega Conseils',
    articles:[
      {name:'Projet bancaire complet', qty:1, unit:'dossier', emoji:'🏦'},
      {name:'Étude de marché détaillée', qty:1, unit:'rapport', emoji:'📈'},
      {name:'Compte de résultat prévisionnel', qty:1, unit:'document', emoji:'💹'},
      {name:'Plan marketing', qty:1, unit:'stratégie', emoji:'📣'},
      {name:'Séance de coaching', qty:1, unit:'séance', emoji:'💼'},
    ]
  },
  {
    id:'omega3', nom:'Pack Stratégique Premium', emoji:'👑', service:'omega_conseil',
    description:'Structuration complète de votre entreprise avec accompagnement renforcé',
    prix_total:250000, categorie:'Omega Conseils',
    articles:[
      {name:'Structuration complète entreprise', qty:1, unit:'projet', emoji:'🏢'},
      {name:'Modèle économique optimisé', qty:1, unit:'business model', emoji:'💡'},
      {name:'Analyse financière avancée', qty:1, unit:'analyse', emoji:'📊'},
      {name:'Business Model Canvas', qty:1, unit:'document', emoji:'🎨'},
      {name:'Séances de coaching', qty:3, unit:'séances', emoji:'💼'},
    ]
  },
  {
    id:'omega4', nom:'Services Additionnels Omega', emoji:'➕', service:'omega_conseil',
    description:'Services complémentaires à la carte',
    prix_total:0, categorie:'Omega Conseils',
    articles:[
      {name:'Tableaux Excel automatisés', qty:1, unit:'service', emoji:'📊', price:25000},
      {name:'Diagnostic financier', qty:1, unit:'analyse', emoji:'🔍', price:50000},
      {name:'Coaching mensuel', qty:1, unit:'mois', emoji:'📅', price:200000},
    ]
  },
  // Services Immobilier
  {
    id:'immo1', nom:'Location de Biens', emoji:'🏠', service:'immobilier',
    description:'Trouvez le bien locatif idéal parmi notre sélection vérifiée',
    prix_total:0, categorie:'Service Immobilier',
    articles:[
      {name:'Appartements', qty:1, unit:'recherche', emoji:'🏢'},
      {name:'Villas', qty:1, unit:'recherche', emoji:'🏡'},
      {name:'Bureaux', qty:1, unit:'recherche', emoji:'💼'},
      {name:'Espaces commerciaux', qty:1, unit:'recherche', emoji:'🏪'},
      {name:'Entrepôts', qty:1, unit:'recherche', emoji:'🏭'},
      {name:'Biens vérifiés et sécurisés', qty:1, unit:'garantie', emoji:'✅'},
    ]
  },
  {
    id:'immo2', nom:'Vente & Acquisition', emoji:'💰', service:'immobilier',
    description:'Achetez ou vendez en toute sécurité avec notre accompagnement',
    prix_total:0, categorie:'Service Immobilier',
    articles:[
      {name:'Recherche personnalisée', qty:1, unit:'service', emoji:'🔍'},
      {name:'Vérification administrative', qty:1, unit:'contrôle', emoji:'📋'},
      {name:'Accompagnement juridique', qty:1, unit:'assistance', emoji:'⚖️'},
      {name:'Négociation encadrée', qty:1, unit:'service', emoji:'🤝'},
      {name:'Sécurisation transaction', qty:1, unit:'garantie', emoji:'🔒'},
    ]
  },
  {
    id:'immo3', nom:'Gestion Locative', emoji:'📊', service:'immobilier',
    description:'Gérez vos biens à distance en toute tranquillité',
    prix_total:0, categorie:'Service Immobilier',
    articles:[
      {name:'Encaissement des loyers', qty:1, unit:'service', emoji:'💵'},
      {name:'Suivi des locataires', qty:1, unit:'gestion', emoji:'👥'},
      {name:'Entretien et maintenance', qty:1, unit:'service', emoji:'🔧'},
      {name:'Rapports réguliers', qty:1, unit:'reporting', emoji:'📈'},
      {name:'Idéal pour la diaspora', qty:1, unit:'avantage', emoji:'🌍'},
    ]
  },
  {
    id:'immo4', nom:'Assistance Immobilière Diaspora', emoji:'🌍', service:'immobilier',
    description:'Investissez au Togo depuis l\'étranger sans stress',
    prix_total:0, categorie:'Service Immobilier',
    articles:[
      {name:'Recherche terrain sécurisé', qty:1, unit:'service', emoji:'🗺️'},
      {name:'Supervision de construction', qty:1, unit:'suivi', emoji:'🏗️'},
      {name:'Vérification titres fonciers', qty:1, unit:'contrôle', emoji:'📜'},
      {name:'Suivi de chantier', qty:1, unit:'supervision', emoji:'👷'},
      {name:'Comptes rendus réguliers', qty:1, unit:'reporting', emoji:'📧'},
    ]
  },
];

async function loadKitsList(serviceFilter = null, immoMode = false) {
  const container = document.getElementById('kits-list');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:40px;color:#9999BB"><div class="spinner" style="border-color:rgba(30,111,190,.2);border-top-color:#1E6FBE"></div><div style="margin-top:10px;font-size:12px">Chargement des kits...</div></div>`;

  let dbKits = [];
  try {
    let snap;
    try {
      const q = query(collection(db,'kits'), orderBy('ordre','asc'));
      snap = await getDocs(q);
    } catch(_) {
      const q2 = query(collection(db,'kits'));
      snap = await getDocs(q2);
    }
    snap.forEach(d => dbKits.push({ id:d.id, _src:'db', ...d.data() }));
  } catch(e) {
    console.warn('[Kits] Firestore indisponible :', e.message);
  }

  const dbIds = new Set(dbKits.map(k => k.id));
  let stdKits = DEFAULT_KITS
    .filter(k => !dbIds.has(k.id))
    .map(k => ({ ...k, _src:'std', actif:true }));

  // Filtrer par service si spécifié
  if (serviceFilter) {
    stdKits = stdKits.filter(k => k.service === serviceFilter);
    dbKits = dbKits.filter(k => k.service === serviceFilter);
  } else {
    // Pour le service 'kits' général, exclure les kits des autres services
    stdKits = stdKits.filter(k => !k.service || k.service === 'kits');
    dbKits = dbKits.filter(k => !k.service || k.service === 'kits');
  }

  const allKits = [...dbKits, ...stdKits].filter(k => k.actif !== false);
  allKits.sort((a,b) => (a.ordre ?? 99) - (b.ordre ?? 99) || (a.nom||'').localeCompare(b.nom||''));

  if (!allKits.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#9999BB">Aucun kit disponible pour le moment.</div>`;
    return;
  }

  container.innerHTML = allKits.map(k => renderKitCard(k, immoMode)).join('');
}
window.loadKitsList = loadKitsList;

function renderKitCard(k, immoMode = false) {
  const imgHtml = k.imageUrl
    ? `<img src="${k.imageUrl}" alt="${k.nom}" style="width:100%;height:100%;object-fit:cover;border-radius:14px" onerror="this.outerHTML='<span style=font-size:48px>${k.emoji||'🎁'}</span>'">`
    : `<span style="font-size:48px">${k.emoji||'🎁'}</span>`;
  const articlesCount = (k.articles || []).length;
  
  // Gestion du prix
  let prixStr;
  if (k.prix_total > 0) {
    prixStr = fmt(k.prix_total);
  } else if (k.contact) {
    prixStr = `📞 ${k.contact}`;
  } else {
    prixStr = 'Sur devis';
  }
  
  const catColor = {
    'Alimentation':'#FFF3E0','Restauration':'#E3F2FD','Prêt-à-porter':'#FFF0F5','Nettoyage':'#F3E5F5',
    'Mathivick - Formation':'#FFF3E0','Mathivick - Combiné':'#FFF9E6',
    'Omega Conseils':'#E3F2FD','Service Immobilier':'#E8F5E9'
  }[k.categorie] || '#E8F5E9';

  const onclickFn = immoMode
    ? `openImmoCategory('${k.id}','${(k.nom||'').replace(/'/g,"\\'")}','${k.emoji||'🏢'}','${(k.description||'').replace(/'/g,"\\'")}','${k.categorie||'Service Immobilier'}')`
    : `openKit('${k.id}','${(k.nom||'').replace(/'/g,"\\'")}','${k.emoji||'🎁'}')`;
  
  return `
  <div class="kit-card" onclick="${onclickFn}">
    <div class="kit-img-wrap" style="background:${catColor}">
      ${imgHtml}
    </div>
    <div class="kit-body">
      <div class="kit-badge">${k.categorie||'Kit'}</div>
      <div class="kit-name">${k.nom||'Kit'}</div>
      <div class="kit-desc">${k.description||''}</div>
      <div class="kit-footer">
        <div class="kit-price" style="font-size:${k.contact?'11px':'14px'}">${prixStr}</div>
        <div class="kit-count">${articlesCount} article${articlesCount>1?'s':''}</div>
      </div>
    </div>
    <div class="kit-arrow">›</div>
  </div>`;
}

async function openKit(kitId, kitNom, kitEmoji) {
  const container = document.getElementById('kit-detail-items');
  const titleEl = document.getElementById('kit-detail-name');
  const descEl  = document.getElementById('kit-detail-desc');
  const priceEl = document.getElementById('kit-detail-price');
  const headerIco = document.getElementById('kit-detail-ico');

  if (titleEl) titleEl.textContent = kitNom;
  if (headerIco) { headerIco.textContent = kitEmoji; }
  const heroNameEl = document.getElementById('kit-hero-name');
  if (heroNameEl) heroNameEl.textContent = kitNom;
  const heroEl = document.getElementById('kit-hero');
  if (heroEl) heroEl.setAttribute('data-emoji', kitEmoji);

  showView('kit-detail');

  // Chercher le kit dans DB ou defaults
  let kit = null;
  try {
    const snap = await getDoc(doc(db,'kits',kitId));
    if (snap.exists()) kit = { id:snap.id, ...snap.data() };
  } catch(e) {}
  if (!kit) kit = DEFAULT_KITS.find(k => k.id === kitId);
  if (!kit) { if(container) container.innerHTML='<p>Kit introuvable.</p>'; return; }

  currentKit = kit;
  if (descEl) descEl.textContent = kit.description||'';
  if (priceEl) priceEl.textContent = kit.prix_total ? fmt(kit.prix_total) : '';

  const articles = kit.articles || [];
  if (!articles.length) {
    if(container) container.innerHTML = `<div style="text-align:center;padding:30px;color:#9999BB">Aucun article dans ce kit.</div>`;
    return;
  }

  if(container) container.innerHTML = articles.map(a => `
    <div class="kit-article-row">
      <div class="kit-article-emoji">${a.emoji||'📦'}</div>
      <div class="kit-article-info">
        <div class="kit-article-name">${a.name}</div>
        <div class="kit-article-qty">× ${a.qty} ${a.unit||''}</div>
      </div>
      ${a.prix ? `<div class="kit-article-price">${fmt(a.prix*a.qty)}</div>` : ''}
    </div>`).join('');
}
window.openKit = openKit;

async function commanderKit() {
  if (!currentKit) return;
  if (!currentUser) { openAuthModal('login'); return; }

  // Remplir le panier avec les articles du kit
  cart = {};
  const articles = currentKit.articles || [];
  articles.forEach((a, i) => {
    const id = `kit_${currentKit.id}_${i}`;
    cart[id] = { id, name: a.name, price: a.prix || 0, qty: a.qty || 1, emoji: a.emoji||'📦' };
  });
  // Si le kit a un prix total fixe, l'utiliser
  if (currentKit.prix_total) {
    // Utiliser un seul article "Kit" avec le prix total
    cart = {};
    cart[`kit_${currentKit.id}`] = {
      id: `kit_${currentKit.id}`,
      name: currentKit.nom,
      price: currentKit.prix_total,
      qty: 1,
      emoji: currentKit.emoji || '🎁'
    };
  }

  currentService = 'kits';
  updateCartBar();

  // Aller à la vue livraison
  const backBtn = document.getElementById('delivery-back-btn');
  if (backBtn) backBtn.onclick = () => showView('kit-detail');
  showView('delivery');
}
window.commanderKit = commanderKit;


async function loadCatalogue(svcId) {
  const container = document.getElementById('catalogue-items');
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--light)"><div class="spinner" style="border-color:rgba(30,111,190,.2);border-top-color:var(--blue)"></div><div style="margin-top:10px;font-size:12px">Chargement...</div></div>`;
  updateCartBar();

  // 1. Charger les articles personnalisés depuis Firestore
  let dbArticles = [];
  try {
    let snap;
    try {
      const q = query(collection(db,'articles'), where('service','==',svcId), orderBy('ordre','asc'));
      snap = await getDocs(q);
    } catch(_) {
      // Index composite absent → sans tri Firestore, on trie côté client
      const q2 = query(collection(db,'articles'), where('service','==',svcId));
      snap = await getDocs(q2);
    }
    snap.forEach(d => dbArticles.push({ id:d.id, _src:'db', ...d.data() }));
  } catch(e) {
    console.warn('[Catalogue] Firestore indisponible :', e.message);
  }

  // 2. Standards non encore gérés dans Firestore (même ID absent)
  const dbIds = new Set(dbArticles.map(a => a.id));
  const stdArticles = (DEFAULT_ARTICLES[svcId] || [])
    .filter(a => !dbIds.has(a.id))
    .map(a => ({ ...a, _src:'std', stock:'en_stock', actif:true }));

  // 3. Fusion : version DB en priorité, puis standards restants
  let articles = [...dbArticles, ...stdArticles];

  // 4. Cacher les articles masqués par l'admin (actif:false)
  articles = articles.filter(a => a.actif !== false);

  // 5. Tri : ordre croissant puis alpha
  articles.sort((a,b) => (a.ordre ?? 99) - (b.ordre ?? 99) || (a.name||'').localeCompare(b.name||''));

  if (!articles.length) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--light)">Aucun article disponible pour le moment.</div>`;
    return;
  }
  container.innerHTML = articles.map(a => renderArticleCard(a)).join('');
}

function renderArticleCard(a) {
  const inCart  = cart[a.id];
  const qty     = inCart ? inCart.qty : 0;
  const epuise  = (a.stock === 'epuise');
  const imgHtml = a.imageUrl
    ? `<img src="${a.imageUrl}" alt="${a.name}" loading="lazy"/>`
    : `<span style="font-size:42px">${a.emoji||'📦'}</span>`;

  return `<div class="article-card${qty>0?' selected':''}" id="acard-${a.id}"${epuise?' style="pointer-events:none;opacity:.6"':''}>
    <div class="art-img-wrap">
      ${imgHtml}
      ${epuise ? `<div style="position:absolute;top:8px;left:8px;background:#C62828;color:#fff;font-size:9px;font-weight:800;padding:3px 9px;border-radius:999px;letter-spacing:.5px">ÉPUISÉ</div>` : ''}
    </div>
    <div class="art-check">✓</div>
    <div class="art-body">
      <div class="art-name">${a.name}</div>
      <div class="art-desc">${a.desc||''}</div>
      <div class="art-footer">
        <div>
          <span class="art-price"${epuise?' style="text-decoration:line-through;color:var(--light)"':''}>${fmt(a.price)}</span>
          ${a.unit ? `<span class="art-price-unit">/ ${a.unit}</span>` : ''}
        </div>
        ${epuise
          ? `<span style="font-size:10px;font-weight:700;color:#C62828;background:#FFEBEE;border-radius:8px;padding:6px 11px">Épuisé</span>`
          : `<button class="art-add" onclick="addToCart('${a.id}',event)" title="Ajouter">+</button>
             <div class="art-qty">
               <button class="qty-btn" onclick="changeQty('${a.id}',-1,event)">−</button>
               <span class="qty-num" id="qty-${a.id}">${qty}</span>
               <button class="qty-btn" onclick="changeQty('${a.id}',1,event)">+</button>
             </div>`
        }
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════
// GESTION PANIER
// ════════════════════════════════════════
function addToCart(id, e) {
  if(e) e.stopPropagation();
  // Chercher dans les standards d'abord, puis lire le DOM comme fallback
  const allDefaults = [...(DEFAULT_ARTICLES[currentService]||[])];
  let art = allDefaults.find(a => a.id === id);
  if (!art) {
    // Pour les restaurants, chercher via le DOM directement
    const card = document.getElementById(`acard-${id}`);
    if (!card) return;
    const name      = card.querySelector('.art-name')?.textContent || '';
    const priceText = card.querySelector('.art-price')?.textContent.replace(/[^\d]/g,'') || '0';
    art = { id, name, price: parseInt(priceText) || 0 };
  }
  if (cart[id]) cart[id].qty++;
  else cart[id] = { ...art, qty:1 };
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
    const restaurantInfo = (currentService === 'restaurant' && currentRestaurant)
      ? { restaurantId: currentRestaurant.id, restaurantNom: currentRestaurant.nom }
      : {};
    const kitInfo = (currentService === 'kits' && currentKit)
      ? { kitId: currentKit.id, kitNom: currentKit.nom }
      : {};
    const docRef = await addDoc(collection(db,'commandes'), {
      service:      currentService,
      serviceName:  currentService === 'restaurant' && currentRestaurant
                      ? `Restaurants — ${currentRestaurant.nom}`
                      : currentService === 'kits' && currentKit
                        ? `Kits/PACKS — ${currentKit.nom}`
                        : svc.name,
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
      ...restaurantInfo,
      ...kitInfo,
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
    cart = {};
    updateCartBar();
    showSuccessView();
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
    showSuccessView();
  } catch(err) {
    showToast('❌ Erreur d\'envoi. Vérifiez votre connexion.','#C62828');
    btn.innerHTML = '📨 Envoyer ma demande';
    btn.disabled = false;
  }
}
window.submitStandardForm = submitStandardForm;

// ════════════════════════════════════════
// IMMOBILIER — VUE OPTIONS & FORMULAIRE
// ════════════════════════════════════════
let currentImmoCategory = null; // catégorie immo sélectionnée (ex: immo4)
let currentImmoOption   = null; // mini-prestation sélectionnée

function openImmoCategory(kitId, kitNom, kitEmoji, kitDesc, kitCat) {
  currentImmoCategory = null;

  // Chercher le kit dans DEFAULT_KITS
  let cat = DEFAULT_KITS.find(k => k.id === kitId);
  if (!cat) { showToast('❌ Catégorie introuvable.', '#C62828'); return; }
  currentImmoCategory = cat;

  // Mettre à jour le header
  const ico   = document.getElementById('immo-options-ico');
  const title = document.getElementById('immo-options-title');
  const back  = document.getElementById('immo-options-back-btn');
  if (ico)   { ico.textContent = kitEmoji; }
  if (title) title.textContent = kitNom;
  if (back)  back.onclick = () => showView('kits');

  // Rendre les options (articles du kit)
  const list = document.getElementById('immo-options-list');
  if (!list) return;
  const articles = cat.articles || [];
  if (!articles.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:#9999BB">Aucune prestation disponible.</div>`;
    showView('immo-options');
    return;
  }

  list.innerHTML = articles.map((a, idx) => `
    <div class="kit-card" onclick="openImmoForm('${kitId}','${(kitNom||'').replace(/'/g,"\\'")}','${kitEmoji}','${kitCat||''}',${idx})" style="cursor:pointer">
      <div class="kit-img-wrap" style="background:#E8F5E9">
        <span style="font-size:42px">${a.emoji||'🏢'}</span>
      </div>
      <div class="kit-body">
        <div class="kit-badge" style="color:#2E7D32;background:#E8F5E9">${kitCat||'Immobilier'}</div>
        <div class="kit-name">${a.name}</div>
        <div class="kit-desc">${a.unit ? a.unit : ''}</div>
        <div class="kit-footer">
          <div style="font-size:11px;color:#1E6FBE;font-weight:600">Faire une demande</div>
          <div class="kit-count">→</div>
        </div>
      </div>
      <div class="kit-arrow">›</div>
    </div>`).join('');

  showView('immo-options');
}
window.openImmoCategory = openImmoCategory;

function openImmoForm(kitId, kitNom, kitEmoji, kitCat, articleIdx) {
  if (!currentImmoCategory) {
    let cat = DEFAULT_KITS.find(k => k.id === kitId);
    if (cat) currentImmoCategory = cat;
  }

  const article = currentImmoCategory?.articles?.[articleIdx];
  if (!article) { showToast('❌ Prestation introuvable.', '#C62828'); return; }

  currentImmoOption = { kitId, kitNom, kitEmoji, kitCat, article, articleIdx };

  // Mettre à jour le header et le hero
  document.getElementById('immo-form-ico').textContent = article.emoji || kitEmoji;
  document.getElementById('immo-form-title').textContent = article.name;
  document.getElementById('immo-form-hero-emoji').textContent = article.emoji || kitEmoji;
  document.getElementById('immo-form-category').textContent = kitCat || 'Service Immobilier';
  document.getElementById('immo-form-prestation-name').textContent = article.name;
  document.getElementById('immo-form-prestation-desc').textContent = currentImmoCategory?.description || '';

  // Bouton retour vers les options
  const backBtn = document.getElementById('immo-form-back-btn');
  if (backBtn) backBtn.onclick = () => showView('immo-options');

  // Afficher le bandeau "bientôt disponible" si service pas encore actif
  const svc = SVCS['immobilier'];
  const soonEl = document.getElementById('immo-form-soon');
  if (soonEl) soonEl.style.display = (!svc.active && svc.soon) ? 'block' : 'none';

  // Réinitialiser les champs
  ['immo-ff-besoin','immo-ff-localisation','immo-ff-budget','immo-ff-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const dateEl = document.getElementById('immo-ff-date');
  if (dateEl) dateEl.value = '';

  showView('immo-form');
}
window.openImmoForm = openImmoForm;

async function submitImmoForm() {
  if (!currentUser) { openAuthModal('login'); return; }
  if (!currentImmoOption) return;

  const besoin       = document.getElementById('immo-ff-besoin')?.value.trim();
  const locEl        = document.getElementById('immo-ff-localisation');
  const localisation = locEl?.style.display !== 'none' ? locEl?.value.trim() : '';
  const budgetEl     = document.getElementById('immo-ff-budget');
  const budget       = budgetEl?.style.display !== 'none' ? budgetEl?.value.trim() : '';
  const date         = document.getElementById('immo-ff-date')?.value.trim();
  const notes        = document.getElementById('immo-ff-notes')?.value.trim();

  // Localisation obligatoire seulement si le champ est visible (Assistance/Gestion)
  const locRequired = locEl && locEl.style.display !== 'none';

  if (!besoin || (locRequired && !localisation)) {
    const besoinEl = document.getElementById('immo-ff-besoin');
    if (!besoin && besoinEl) besoinEl.style.borderColor = '#F5820A';
    if (locRequired && !localisation && locEl) locEl.style.borderColor = '#F5820A';
    showToast('⚠️ Remplissez les champs obligatoires', '#F5820A');
    return;
  }

  const btn = document.getElementById('immo-form-submit-btn');
  btn.innerHTML = '<span class="spinner"></span> Envoi...';
  btn.disabled = true;

  try {
    const docRef = await addDoc(collection(db,'commandes'), {
      service:           'immobilier',
      serviceName:       `Immobilier — ${currentImmoOption.kitNom} — ${currentImmoOption.article.name}`,
      statut:            'En attente',
      // Catégorie et prestation
      immoCategorieId:   currentImmoOption.kitId,
      immoCategorieNom:  currentImmoOption.kitNom,
      immoPrestation:    currentImmoOption.article.name,
      immoPrestationEmoji: currentImmoOption.article.emoji || '🏢',
      // Champs du formulaire
      besoin,
      localisation,
      budget:            budget || '',
      dateSouhaitee:     date   || '',
      notes:             notes  || '',
      // Infos client
      uid:               currentUser.uid,
      clientNom:         currentUser.nom    || '',
      clientPrenom:      currentUser.prenom || '',
      clientGenre:       currentUser.genre  || '',
      phone:             currentUser.phone  || '',
      clientVille:       currentUser.ville  || '',
      createdAt:         serverTimestamp()
    });

    document.getElementById('succ-msg').innerHTML =
      `Demande <strong style="color:var(--blue)">${currentImmoOption.article.name}</strong> envoyée !<br/>
       Référence : <strong>#${docRef.id.slice(0,8).toUpperCase()}</strong><br/>
       Notre équipe immobilière vous contactera très bientôt.<br/>
       <small style="color:var(--light)">Contact : ${currentUser.phone || ''}</small>`;
    const succBtn = document.getElementById('succ-view-orders-btn');
    if (succBtn) succBtn.style.display = 'block';
    currentImmoOption = null;
    currentImmoCategory = null;
    showSuccessView();
  } catch(err) {
    console.error(err);
    showToast('❌ Erreur d\'envoi. Vérifiez votre connexion.', '#C62828');
    btn.innerHTML = '📨 Envoyer ma demande';
    btn.disabled = false;
  }
}
window.submitImmoForm = submitImmoForm;

// ════════════════════════════════════════
// ANNULATION / SUPPRESSION DE COMMANDE
// (seulement si statut = "En attente")
// ════════════════════════════════════════
async function cancelOrder(orderId, orderName) {
  if (!currentUser) return;

  // Confirmation via la modal dédiée dans le HTML
  const modal = document.getElementById('cancel-order-modal');
  const nameEl = document.getElementById('cancel-order-name');
  const refEl  = document.getElementById('cancel-order-ref');
  if (!modal) {
    // Fallback confirm natif
    if (!confirm(`Annuler et supprimer la commande "${orderName}" ?`)) return;
    await _doDeleteOrder(orderId);
    return;
  }
  if (nameEl) nameEl.textContent = orderName || 'cette commande';
  if (refEl)  refEl.textContent  = '#' + orderId.slice(0, 8).toUpperCase();
  modal.style.display = 'flex';
  // Les boutons de la modal appellent confirmCancelOrder / closeCancelModal
  window._pendingCancelId   = orderId;
  window._pendingCancelName = orderName;
}
window.cancelOrder = cancelOrder;

async function confirmCancelOrder() {
  const id = window._pendingCancelId;
  if (!id) return;
  closeCancelModal();
  await _doDeleteOrder(id);
  window._pendingCancelId   = null;
  window._pendingCancelName = null;
}
window.confirmCancelOrder = confirmCancelOrder;

function closeCancelModal() {
  const modal = document.getElementById('cancel-order-modal');
  if (modal) modal.style.display = 'none';
}
window.closeCancelModal = closeCancelModal;

async function _doDeleteOrder(orderId) {
  try {
    // Vérifier une dernière fois que le statut est bien "En attente"
    const snap = await getDoc(doc(db, 'commandes', orderId));
    if (!snap.exists()) { showToast('❌ Commande introuvable.', '#C62828'); return; }
    const data = snap.data();
    if (data.statut !== 'En attente') {
      showToast('⛔ Impossible : la commande n\'est plus en attente.', '#C62828');
      loadMyOrders();
      return;
    }
    // Mettre le statut à "Annulée" au lieu de supprimer (les rules Firestore permettent l'update)
    await updateDoc(doc(db, 'commandes', orderId), {
      statut: 'Annulée',
      cancelledAt: serverTimestamp()
    });
    showToast('🗑️ Commande annulée avec succès.', '#4A4A6A');
    loadMyOrders();
  } catch(e) {
    console.error(e);
    showToast('❌ Erreur lors de l\'annulation.', '#C62828');
  }
}

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
      const orderName = (o.serviceName||o.service||'Service').replace(/'/g,"\\'");

      // Bouton d'annulation uniquement si "En attente"
      const cancelBtn = (o.statut === 'En attente' || !o.statut)
        ? `<button class="o-cancel-btn" onclick="cancelOrder('${o.id}','${orderName}')">
             🗑️ Annuler la commande
           </button>`
        : '';

      // Bouton "Voir les articles commandés" — toujours visible, même quand Terminée
      const articlesBtn = `<button class="o-articles-btn" onclick="showOrderArticles('${o.id}')">
           📋 Voir les articles commandés
         </button>`;

      h += `<div class="o-card" id="ocard-${o.id}">
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
        <div class="o-actions">
          ${articlesBtn}
          ${cancelBtn}
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
// MODAL — VOIR LES ARTICLES D'UNE COMMANDE
// ════════════════════════════════════════
async function showOrderArticles(orderId) {
  // Créer/récupérer le modal
  let modal = document.getElementById('order-articles-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'order-articles-modal';
    modal.style.cssText = `
      position:fixed;inset:0;z-index:4000;
      background:rgba(10,18,32,.7);backdrop-filter:blur(4px);
      display:flex;align-items:flex-end;justify-content:center;
      padding:0;
    `;
    modal.innerHTML = `
      <div id="order-articles-sheet" style="
        background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:520px;
        max-height:82vh;display:flex;flex-direction:column;
        box-shadow:0 -8px 40px rgba(0,0,0,.2);
        animation:slideUp .25s cubic-bezier(.4,0,.2,1)
      ">
        <div style="background:linear-gradient(135deg,#1E6FBE,#155A9C);padding:18px 20px;border-radius:24px 24px 0 0;display:flex;align-items:center;gap:12px;flex-shrink:0">
          <div style="font-size:22px">📋</div>
          <div style="flex:1">
            <div style="font-family:'Nunito',sans-serif;font-size:16px;font-weight:800;color:#fff" id="oam-title">Articles commandés</div>
            <div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:1px" id="oam-ref">Réf —</div>
          </div>
          <button onclick="document.getElementById('order-articles-modal').remove()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>
        </div>
        <div id="oam-body" style="overflow-y:auto;flex:1;padding:16px"></div>
        <div style="padding:14px 16px;flex-shrink:0;border-top:1px solid #F0F0F8">
          <button onclick="document.getElementById('order-articles-modal').remove()" style="width:100%;background:#F4F6FA;border:1.5px solid #E8EAF0;border-radius:12px;padding:12px;font-size:13px;font-weight:700;color:#1A1A2E;cursor:pointer;font-family:'Poppins',sans-serif">Fermer</button>
        </div>
      </div>
    `;
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  // Afficher le loading
  const body = document.getElementById('oam-body');
  if (body) body.innerHTML = `<div style="text-align:center;padding:40px;color:#9999BB"><div class="spinner" style="border-color:rgba(30,111,190,.2);border-top-color:#1E6FBE;margin:0 auto 10px"></div>Chargement...</div>`;

  try {
    const snap = await getDoc(doc(db, 'commandes', orderId));
    if (!snap.exists()) {
      if (body) body.innerHTML = `<div style="text-align:center;padding:40px;color:#9999BB">Commande introuvable.</div>`;
      return;
    }
    const o = { id: snap.id, ...snap.data() };

    // Mettre à jour le titre/ref
    const titleEl = document.getElementById('oam-title');
    const refEl   = document.getElementById('oam-ref');
    if (titleEl) titleEl.textContent = o.serviceName || o.service || 'Articles commandés';
    if (refEl)   refEl.textContent   = `Réf #${o.id.slice(0,8).toUpperCase()} · ${o.statut || 'En attente'}`;

    // Construire la liste d'articles
    const articles = o.articles || [];
    const SC = {'En attente':{c:'#F5820A',bg:'#FFF3E0'},'Confirmée':{c:'#1E6FBE',bg:'#E3F2FD'},'En cours':{c:'#7B1FA2',bg:'#F3E5F5'},'Terminée':{c:'#2E7D32',bg:'#E8F5E9'},'Annulée':{c:'#C62828',bg:'#FFEBEE'}};
    const sc = SC[o.statut] || SC['En attente'];

    // Statut pill en haut du contenu
    let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 12px;background:${sc.bg};border-radius:12px">
      <span style="font-size:13px;font-weight:700;color:${sc.c}">● ${o.statut || 'En attente'}</span>
      ${o.total ? `<span style="margin-left:auto;font-size:13px;font-weight:800;color:#1A1A2E">${fmt(o.total)}</span>` : ''}
    </div>`;

    if (articles.length > 0) {
      html += `<div style="font-size:11px;font-weight:800;color:#9999BB;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">🛒 ${articles.length} article${articles.length>1?'s':''}</div>`;
      html += articles.map(a => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#F8F9FE;border-radius:14px;margin-bottom:8px">
          <div style="width:44px;height:44px;border-radius:12px;background:#E8F0FE;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">📦</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#1A1A2E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.name}</div>
            <div style="font-size:11px;color:#9999BB;margin-top:2px">Quantité : <strong style="color:#4A4A6A">× ${a.qty||1}</strong></div>
          </div>
          ${a.price > 0 ? `<div style="font-size:13px;font-weight:800;color:#1E6FBE;white-space:nowrap">${fmt(a.price*(a.qty||1))}</div>` : ''}
        </div>`).join('');
    } else {
      // Formulaire (pas d'articles discrets) — afficher les infos de la demande
      html += `<div style="font-size:11px;font-weight:800;color:#9999BB;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">📝 Détails de la demande</div>`;
      const fields = ['besoin','localisation','type','type_event','nb_personnes','adresse','date','budget','notes','immoPrestation','kitNom'];
      const labels = {besoin:'Besoin',localisation:'Localisation',type:'Type',type_event:'Événement',nb_personnes:'Nb personnes',adresse:'Adresse',date:'Date',budget:'Budget',notes:'Remarques',immoPrestation:'Prestation',kitNom:'Catégorie'};
      let hasField = false;
      fields.forEach(f => {
        if (o[f]) {
          hasField = true;
          html += `<div style="padding:10px 12px;background:#F8F9FE;border-radius:12px;margin-bottom:8px">
            <div style="font-size:10px;font-weight:700;color:#9999BB;text-transform:uppercase;letter-spacing:.5px">${labels[f]||f}</div>
            <div style="font-size:13px;color:#1A1A2E;margin-top:3px;line-height:1.5">${o[f]}</div>
          </div>`;
        }
      });
      if (!hasField) html += `<div style="text-align:center;padding:30px;color:#9999BB;font-size:13px">Aucun détail d'article disponible pour cette commande.</div>`;
    }

    // Infos livraison si disponibles
    if (o.adresse || o.modePaiement) {
      html += `<div style="margin-top:16px;padding:12px;background:#F0F7FF;border-radius:14px;font-size:12px;color:#4A4A6A">`;
      if (o.adresse) html += `<div style="margin-bottom:4px">📍 <strong>Livraison :</strong> ${o.adresse}</div>`;
      if (o.modePaiement) html += `<div>💳 <strong>Paiement :</strong> ${o.modePaiement}</div>`;
      html += `</div>`;
    }

    if (body) body.innerHTML = html;

  } catch(err) {
    console.error(err);
    if (body) body.innerHTML = `<div style="text-align:center;padding:40px;color:#9999BB">Erreur de chargement. Vérifiez votre connexion.</div>`;
  }
}
window.showOrderArticles = showOrderArticles;

// ════════════════════════════════════════
// SUPPRESSION D'UNE COMMANDE (statut "En attente" seulement)
// ════════════════════════════════════════
function confirmDeleteOrder(orderId, orderName) {
  // Supprimer l'overlay existant s'il y en a un
  const existing = document.getElementById('delete-confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'delete-confirm-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,18,32,.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;';

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:28px 24px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.25);text-align:center">
      <div style="font-size:48px;margin-bottom:14px">🗑️</div>
      <div style="font-family:'Nunito',sans-serif;font-size:18px;font-weight:800;color:#1A1A2E;margin-bottom:8px">Supprimer cette commande ?</div>
      <div style="font-size:13px;color:#4A4A6A;line-height:1.6;margin-bottom:6px">
        <strong style="color:#1E6FBE">${orderName}</strong>
      </div>
      <div style="font-size:12px;color:#9999BB;line-height:1.6;margin-bottom:22px">
        Cette action est irréversible. Votre demande sera définitivement supprimée.<br/>
        <span style="color:#C62828;font-weight:700">Suppression impossible si la commande est déjà confirmée.</span>
      </div>
      <div style="display:flex;gap:12px">
        <button onclick="document.getElementById('delete-confirm-overlay').remove()"
          style="flex:1;background:#F4F6FA;border:1.5px solid #E8EAF0;border-radius:14px;padding:14px;font-size:13px;font-weight:700;color:#4A4A6A;cursor:pointer;font-family:'Poppins',sans-serif">
          ← Annuler
        </button>
        <button onclick="executeDeleteOrder('${orderId}')"
          style="flex:1;background:linear-gradient(135deg,#C62828,#8B0000);border:none;border-radius:14px;padding:14px;font-size:13px;font-weight:700;color:#fff;cursor:pointer;font-family:'Poppins',sans-serif;box-shadow:0 4px 16px rgba(198,40,40,.35)">
          🗑️ Supprimer
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
window.confirmDeleteOrder = confirmDeleteOrder;

async function executeDeleteOrder(orderId) {
  const overlay = document.getElementById('delete-confirm-overlay');

  // Vérifier en temps réel que le statut est bien "En attente"
  try {
    const snap = await getDoc(doc(db, 'commandes', orderId));
    if (!snap.exists()) {
      if (overlay) overlay.remove();
      showToast('❌ Commande introuvable.', '#C62828');
      return;
    }
    const data = snap.data();
    if (data.statut && data.statut !== 'En attente') {
      if (overlay) overlay.remove();
      showToast(`⛔ Impossible : la commande est "${data.statut}". Seules les commandes "En attente" peuvent être supprimées.`, '#C62828');
      return;
    }

    // Supprimer dans Firestore
    await deleteDoc(doc(db, 'commandes', orderId));

    // Animer la carte disparaissant
    const card = document.getElementById(`ocard-${orderId}`);
    if (card) {
      card.style.transition = 'all .35s cubic-bezier(.4,0,.2,1)';
      card.style.opacity = '0';
      card.style.transform = 'translateX(60px) scale(.95)';
      setTimeout(() => card.remove(), 380);
    }

    if (overlay) overlay.remove();
    showToast('✅ Commande supprimée avec succès.', '#2E7D32');

    // Recharger la liste après un court délai
    setTimeout(() => loadMyOrders(), 500);

  } catch(err) {
    console.error(err);
    if (overlay) overlay.remove();
    showToast('❌ Erreur lors de la suppression. Réessayez.', '#C62828');
  }
}
window.executeDeleteOrder = executeDeleteOrder;


// ════════════════════════════════════════
// BANDEAU PUBLICITAIRE
// loadPartnerSlides() charge Firestore, injecte les cartes,
// puis appelle startAdband() — zero setTimeout aveugle.
// ════════════════════════════════════════

const PROMO_LABELS = {
  partenaire:'PARTENAIRE OFFICIEL', sponsor:'SPONSOR',
  collaborateur:'COLLABORATEUR', nouveaute:'NOUVEAUTE',
  promotion:'PROMOTION', evenement:'EVENEMENT'
};

const STD_BANNER_IDS = new Set([
  'std-delivery','std-restaurant','std-food','std-cleaning','std-clothes','std-kits'
]);

function startAdband() {
  const track    = document.getElementById('adband-track');
  const dotsWrap = document.getElementById('adband-dots');
  if (!track) return;

  const INTERVAL = 2400;
  let idx = 0;
  let originals = Array.from(track.querySelectorAll('.adcard'));
  let clone = null, timer = null, paused = false, jumping = false;

  if (originals.length < 2) return;

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    originals.forEach(function(_,i) {
      var d = document.createElement('span');
      d.className = 'adband-dot' + (i===0?' on':'');
      dotsWrap.appendChild(d);
    });
  }

  function updateDot(i) {
    if (!dotsWrap) return;
    dotsWrap.querySelectorAll('.adband-dot').forEach(function(d,j){ d.classList.toggle('on', j===i); });
  }
  function scrollTo(el, smooth) {
    track.scrollTo({ left: el.offsetLeft - track.offsetLeft, behavior: smooth?'smooth':'instant' });
  }
  function next() {
    if (jumping) return;
    if (idx+1 < originals.length) {
      scrollTo(originals[++idx], true); updateDot(idx);
    } else {
      scrollTo(clone, true); updateDot(0); jumping=true;
      setTimeout(function(){ idx=0; scrollTo(originals[0],false); jumping=false; }, 420);
    }
  }
  function prev() {
    idx = (idx-1+originals.length) % originals.length;
    scrollTo(originals[idx],true); updateDot(idx);
  }

  clone = originals[0].cloneNode(true);
  clone.setAttribute('aria-hidden','true');
  clone.style.pointerEvents = 'none';
  track.appendChild(clone);

  scrollTo(originals[0], false);
  updateDot(0);
  timer = setInterval(function(){ if(!paused && !jumping) next(); }, INTERVAL);

  track.addEventListener('mouseenter', function(){ paused=true; });
  track.addEventListener('mouseleave', function(){ paused=false; });
  var tx=0;
  track.addEventListener('touchstart', function(e){ paused=true; tx=e.touches[0].clientX; }, {passive:true});
  track.addEventListener('touchend',   function(e){
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx)>40) { if(dx<0) next(); else prev(); }
    setTimeout(function(){ paused=false; }, INTERVAL);
  }, {passive:true});
}

async function loadPartnerSlides() {
  const track = document.getElementById('adband-track');
  if (!track) { startAdband(); return; }

  try {
    // ── 1. Charger les personnalisations de bandeaux (collection 'bandeaux') ──
    try {
      const bSnap = await getDocs(collection(db,'bandeaux'));
      bSnap.forEach(function(d) {
        const b = d.data();
        const id = d.id; // ex: 'delivery', 'food', 'cleaning'...
        const stdCard = track.querySelector('[data-service="'+id+'"]');
        if (!stdCard) return;
        // Appliquer chaque champ si présent
        if (b.emoji)  { const el=stdCard.querySelector('.adcard-emoji-bg');  if(el) el.textContent=b.emoji; }
        if (b.badge)  { const el=stdCard.querySelector('.adcard-badge');      if(el) el.textContent=b.badge; }
        if (b.promo)  { const el=stdCard.querySelector('.adcard-promo');      if(el) el.textContent=b.promo; }
        if (b.titre1) {
          const el=stdCard.querySelector('.adcard-title');
          if(el) el.innerHTML=b.titre1+(b.titre2?'<br/><span style="color:rgba(255,255,255,.75)">'+b.titre2+'</span>':'');
        }
        if (b.sub)    { const el=stdCard.querySelector('.adcard-sub');        if(el) el.textContent=b.sub; }
        if (b.cta)    { const el=stdCard.querySelector('.adcard-cta');        if(el) el.textContent=b.cta; }
        if (b.bg)     { const zone=stdCard.querySelector('.adcard-img');       if(zone) zone.style.background=b.bg; }
      });
    } catch(_) { /* bandeaux override silencieux si collection absente */ }

    // ── 2. Charger les partenaires (collection 'partenaires') ──
    const snap = await getDocs(query(collection(db,'partenaires'), orderBy('ordre','asc')));

    snap.forEach(function(d) {
      const p = Object.assign({ id:d.id }, d.data());

      // Override d'un bandeau standard
      if (STD_BANNER_IDS.has(p.id)) {
        const service = p.id.replace('std-','');
        const stdCard = track.querySelector('[data-service="'+service+'"]');
        if (!stdCard) return;
        if (p.actif === false) {
          stdCard.remove();
        } else {
          if (p.nom)         { const el=stdCard.querySelector('.adcard-title'); if(el) el.textContent=p.nom; }
          if (p.badge)       { const el=stdCard.querySelector('.adcard-badge'); if(el) el.textContent=p.badge; }
          if (p.description) { const el=stdCard.querySelector('.adcard-sub');   if(el) el.textContent=p.description; }
          if (p.imageUrl) {
            const zone = stdCard.querySelector('.adcard-img');
            if (zone) {
              const img = document.createElement('img');
              img.src=p.imageUrl; img.alt=p.nom||'';
              img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1';
              img.onerror=function(){ img.remove(); };
              zone.prepend(img);
            }
          }
        }
        return;
      }

      // Partenaire pur Firestore
      if (p.actif===false || (!p.nom && !p.imageUrl)) return;

      const card = document.createElement('div');
      card.className = 'adcard';
      if (p.lien) { card.style.cursor='pointer'; card.onclick=function(){ window.open(p.lien,'_blank'); }; }
      const badge = p.badge || (p.nom ? '🤝 '+p.nom : '🤝 Partenaire');
      const promoTxt = PROMO_LABELS[p.promo] || 'PARTENAIRE OFFICIEL';
      const imgHtml = p.imageUrl
        ? '<img src="'+p.imageUrl+'" alt="'+(p.nom||'')+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'"/>'
        : '<span class="adcard-emoji-bg">🤝</span>';
      const ctaHtml = p.lien ? '<div class="adcard-cta">Decouvrir</div>' : '';
      card.innerHTML =
        '<div class="adcard-img" style="background:linear-gradient(135deg,#1A1A2E 0%,#1E6FBE 100%)">'
        +'<div class="adcard-gradient"></div>'
        +imgHtml
        +'<div class="adcard-badge">'+badge+'</div>'
        +'</div>'
        +'<div class="adcard-body">'
        +'<div class="adcard-promo">'+promoTxt+'</div>'
        +'<div class="adcard-title">'+(p.nom||'Partenaire')+'</div>'
        +'<div class="adcard-sub">'+(p.description||'')+'</div>'
        +ctaHtml
        +'</div>';
      track.appendChild(card);
    });

  } catch(e) {
    console.warn('Partenaires Firestore indisponibles :', e.message);
  }

  // Lancer le slider APRES injection de toutes les cartes
  startAdband();
}
loadPartnerSlides();

function filterServices(q) {
  if (!document.getElementById('t-services')?.classList.contains('on')) goTab('services');
  document.querySelectorAll('#view-list .svc-row').forEach(r => {
    r.style.display = !q || r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
window.filterServices = filterServices;

// ════════════════════════════════════════
// ÉCOUTE TEMPS RÉEL — STATUTS COMMANDES (Notifications)
// ════════════════════════════════════════
let _orderStatusListener  = null;
let _knownOrderStatuts    = {};   // { orderId: statut }
let _listenerInitialized  = false;

function startOrderStatusListener() {
  if (!currentUser) return;
  // Arrêter l'ancien listener s'il existe
  stopOrderStatusListener();

  try {
    const q = query(
      collection(db, 'commandes'),
      where('uid', '==', currentUser.uid)
    );

    _orderStatusListener = onSnapshot(q, (snap) => {
      if (!_listenerInitialized) {
        // Première lecture : juste mémoriser les statuts sans notifier
        snap.forEach(d => { _knownOrderStatuts[d.id] = d.data().statut || ''; });
        _listenerInitialized = true;
        return;
      }

      snap.docChanges().forEach(change => {
        if (change.type === 'modified' || change.type === 'added') {
          const data   = change.doc.data();
          const id     = change.doc.id;
          const statut = data.statut || '';
          const prev   = _knownOrderStatuts[id];

          if (prev !== undefined && prev !== statut) {
            const ref     = '#' + id.slice(0, 8).toUpperCase();
            const svcName = data.serviceName || data.service || 'votre service';

            if (statut === 'En cours') {
              if (typeof window.addNotification === 'function') {
                window.addNotification(
                  '🚀 Commande en cours !',
                  `Votre commande ${ref} (${svcName}) est maintenant prise en charge par notre équipe.`,
                  'en_cours', id
                );
              }
            } else if (statut === 'Terminée') {
              if (typeof window.addNotification === 'function') {
                window.addNotification(
                  '✅ Commande terminée !',
                  `Votre commande ${ref} (${svcName}) est terminée. Merci de votre confiance — OmniService TG 🙏`,
                  'terminee', id
                );
              }
            }
          }
          _knownOrderStatuts[id] = statut;
        }
      });
    }, (err) => {
      console.warn('[Notifs] Listener erreur :', err.message);
    });
  } catch(e) {
    console.warn('[Notifs] Impossible de démarrer le listener :', e.message);
  }
}

function stopOrderStatusListener() {
  if (_orderStatusListener) {
    _orderStatusListener(); // unsubscribe
    _orderStatusListener  = null;
    _listenerInitialized  = false;
    _knownOrderStatuts    = {};
  }
}
