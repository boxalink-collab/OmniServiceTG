/* ══════════════════════════════════════════
   OmniService TG — app.js v2.0
   Catalogue + Panier + Commande + Firestore
   ══════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where,
  getDocs, orderBy, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Config Firebase — remplacez par vos vraies valeurs ──
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);

// ════════════════════════════════════════
// ÉTAT GLOBAL
// ════════════════════════════════════════
let currentService  = null;   // id du service actif
let cart            = {};     // { articleId: { ...article, qty } }
let locMode         = 'gps';
let gpsCoords       = null;
let selectedPayment = 'livraison';
let sliderIdx       = 0;
let sliderTimer     = null;
let allSlides       = [];     // slides (défaut + partenaires depuis Firestore)

// Services avec catalogue (prix affichés)
const CATALOGUE_SERVICES = ['food', 'restaurant', 'clothes'];

// ════════════════════════════════════════
// DÉFINITION DES SERVICES
// ════════════════════════════════════════
const SVCS = {
  food: {
    name:"Alimentation & Produits locaux", icon:"🥘", bg:"#FFF3E0", active:true,
    fields:[
      {n:"produits",l:"Produits souhaités",t:"textarea",ph:"Ex : 2 kg de Tilapia, 1 bouteille de vin de palme..."},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"},
      {n:"date",l:"Date souhaitée",t:"date"},
      {n:"phone",l:"Téléphone",t:"tel",ph:"+228 XX XX XX XX"},
      {n:"notes",l:"Remarques (optionnel)",t:"textarea",ph:"Précisions...",opt:true}
    ]
  },
  restaurant: {
    name:"Restauration", icon:"🍽️", bg:"#E3F2FD", active:true,
    fields:[
      {n:"type",l:"Type de service",t:"select",opts:["Plat restaurant partenaire","Service traiteur événement"]},
      {n:"commande",l:"Plat ou menu souhaité",t:"textarea",ph:"Décrivez votre commande..."},
      {n:"personnes",l:"Nombre de personnes",t:"number",ph:"Ex : 4"},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"},
      {n:"phone",l:"Téléphone",t:"tel",ph:"+228 XX XX XX XX"}
    ]
  },
  delivery: {
    name:"Livraison & Courses", icon:"🚚", bg:"#FFF3E0", active:true,
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Livraison express","Courses personnalisées","Livraison entreprise","Livraison de plats"]},
      {n:"detail",l:"Lieu de collecte / Liste d'articles",t:"textarea",ph:"Adresse ou liste..."},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"},
      {n:"urgence",l:"Urgence",t:"select",opts:["Express (< 1h)","Dans la journée","Planifier"]},
      {n:"phone",l:"Téléphone",t:"tel",ph:"+228 XX XX XX XX"}
    ]
  },
  maintenance: {
    name:"Maintenance Technique", icon:"🔧", bg:"#E3F2FD", active:false, soon:"16 Mars 2026",
    fields:[
      {n:"type",l:"Type d'intervention",t:"select",opts:["Électricité","Plomberie","Voiture","Électroménager","Informatique","Pose TV/Antenne","Autres travaux"]},
      {n:"problem",l:"Description du problème",t:"textarea",ph:"Décrivez le problème..."},
      {n:"adresse",l:"Adresse",t:"text",ph:"Votre adresse à Lomé"},
      {n:"phone",l:"Téléphone",t:"tel",ph:"+228 XX XX XX XX"}
    ]
  },
  clothes: {
    name:"Prêt-à-porter", icon:"👗", bg:"#FFF3E0", active:true,
    fields:[
      {n:"categorie",l:"Catégorie",t:"select",opts:["Vêtements Homme","Vêtements Femme","Vêtements Enfant","Sacs","Chaussures","Cosmétiques & Accessoires"]},
      {n:"article",l:"Article souhaité",t:"textarea",ph:"Couleur, taille, style..."},
      {n:"budget",l:"Budget estimé (FCFA)",t:"number",ph:"Ex : 15000"},
      {n:"adresse",l:"Adresse de livraison",t:"text",ph:"Votre adresse à Lomé"},
      {n:"phone",l:"Téléphone",t:"tel",ph:"+228 XX XX XX XX"}
    ]
  },
  cleaning: {
    name:"Entretien & Nettoyage", icon:"🧹", bg:"#E3F2FD", active:true,
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Nettoyage résidentiel","Nettoyage bureaux","Entretien régulier","Entretien industriel"]},
      {n:"superficie",l:"Superficie (m²)",t:"number",ph:"Ex : 60"},
      {n:"adresse",l:"Adresse",t:"text",ph:"Votre adresse à Lomé"},
      {n:"date",l:"Date souhaitée",t:"date"},
      {n:"phone",l:"Téléphone",t:"tel",ph:"+228 XX XX XX XX"}
    ]
  },
  security: {
    name:"Gardiennage & Sécurité", icon:"🛡️", bg:"#E3F2FD", active:false, soon:"7 Avril 2026",
    fields:[
      {n:"type",l:"Type",t:"select",opts:["Gardiennage Résidentiel","Gardiennage Boutique","Sécurité Événementielle","Surveillance Temporaire"]},
      {n:"detail",l:"Description du besoin",t:"textarea",ph:"Vos besoins en sécurité..."},
      {n:"adresse",l:"Lieu / Adresse",t:"text",ph:"Votre adresse à Lomé"},
      {n:"phone",l:"Téléphone",t:"tel",ph:"+228 XX XX XX XX"}
    ]
  }
};

// ════════════════════════════════════════
// ARTICLES PAR DÉFAUT (si rien dans Firestore)
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
  document.getElementById("p-" + id).classList.add("on");
  document.querySelectorAll(".btab").forEach(b => b.classList.remove("on"));
  const bt = document.getElementById("t-" + id);
  if (bt) bt.classList.add("on");
  document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("on"));
  const nl = document.getElementById("nl-" + id);
  if (nl) nl.classList.add("on");
  window.scrollTo({top:0,behavior:"smooth"});
  // Si on va sur services, afficher liste
  if (id === 'services') showView('list');
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
  goTab('services');
  currentService = id;
  cart = {};
  const svc = SVCS[id];
  if (!svc) return;

  if (CATALOGUE_SERVICES.includes(id)) {
    // → Catalogue avec prix
    document.getElementById('cat-ico').style.background = svc.bg;
    document.getElementById('cat-ico').textContent = svc.icon;
    document.getElementById('cat-title').textContent = svc.name;
    loadCatalogue(id);
    showView('catalogue');
  } else {
    // → Formulaire standard
    document.getElementById('form-ico').style.background = svc.bg;
    document.getElementById('form-ico').textContent = svc.icon;
    document.getElementById('form-title').textContent = svc.name;
    // Bientôt dispo ?
    const soonEl = document.getElementById('form-soon');
    const soonDateEl = document.getElementById('form-soon-date');
    if (!svc.active && svc.soon) {
      soonEl.style.display = 'block';
      soonDateEl.textContent = `Opérationnel le ${svc.soon}. Vous pouvez déjà pré-enregistrer votre demande.`;
    } else {
      soonEl.style.display = 'none';
    }
    // Générer champs
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
    if (!snap.empty) {
      snap.forEach(d => articles.push({id:d.id,...d.data()}));
    }
  } catch(e) {
    console.log('Firestore articles non disponibles, utilisation des articles par défaut');
  }

  // Fallback sur articles par défaut
  if (articles.length === 0) {
    articles = DEFAULT_ARTICLES[svcId] || [];
  }

  if (articles.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--light)">Aucun article disponible pour le moment.</div>`;
    return;
  }

  container.innerHTML = articles.map(a => renderArticleCard(a)).join('');
}

function renderArticleCard(a) {
  const inCart = cart[a.id];
  const qty = inCart ? inCart.qty : 0;
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
  // Trouver l'article dans les defaults ou firestore cache
  const allArticles = [
    ...(DEFAULT_ARTICLES[currentService]||[])
  ];
  let art = allArticles.find(a=>a.id===id);
  if (!art) {
    // Lire depuis le DOM
    const card = document.getElementById(`acard-${id}`);
    const name = card.querySelector('.art-name').textContent;
    const priceText = card.querySelector('.art-price').textContent.replace(/[^\d]/g,'');
    art = {id, name, price:parseInt(priceText)||0};
  }
  if (cart[id]) {
    cart[id].qty++;
  } else {
    cart[id] = {...art, qty:1};
  }
  refreshCard(id);
  updateCartBar();
  showToast(`✅ ${art.name} ajouté !`, "#2E7D32");
}
window.addToCart = addToCart;

function changeQty(id, delta, e) {
  if(e) e.stopPropagation();
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) {
    delete cart[id];
  }
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

function cartTotal() {
  return Object.values(cart).reduce((s,a) => s + a.price*a.qty, 0);
}
function cartCount() {
  return Object.values(cart).reduce((s,a) => s + a.qty, 0);
}

function updateCartBar() {
  const bar = document.getElementById('cart-bar');
  const cnt = cartCount();
  if (cnt > 0) {
    bar.style.display = 'flex';
    document.getElementById('cb-count').textContent = `${cnt} article${cnt>1?'s':''}`;
    document.getElementById('cb-total').textContent = fmt(cartTotal());
  } else {
    bar.style.display = 'none';
  }
}

// ════════════════════════════════════════
// PAGE LIVRAISON
// ════════════════════════════════════════
function setLocMode(mode) {
  locMode = mode;
  document.getElementById('loc-btn-gps').className = 'loc-btn' + (mode==='gps'?' on':'');
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
  const phone = document.getElementById('del-phone').value.trim();
  const addr  = document.getElementById('del-address').value.trim();
  if (!phone) { showToast('⚠️ Entrez votre numéro de téléphone','#F5820A'); return; }
  if (!addr && locMode==='gps' && !gpsCoords) {
    showToast('⚠️ Obtenez votre position GPS ou utilisez la description','#F5820A'); return;
  }
  if (locMode==='desc' && !document.getElementById('del-desc').value.trim()) {
    showToast('⚠️ Décrivez votre position','#F5820A'); return;
  }

  // Construire récap
  const svc = SVCS[currentService];
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
  const svc   = SVCS[currentService];
  const phone = document.getElementById('del-phone').value.trim();
  const addr  = document.getElementById('del-address').value.trim();
  const notes = document.getElementById('del-notes').value.trim();

  let positionData = {};
  if (locMode === 'gps' && gpsCoords) {
    positionData = {positionType:'GPS', lat:gpsCoords.lat, lng:gpsCoords.lng};
  } else {
    positionData = {positionType:'description', positionDesc: document.getElementById('del-desc').value.trim()};
  }

  const btn = document.getElementById('confirm-btn');
  btn.innerHTML = '<span class="spinner"></span> Traitement...';
  btn.disabled = true;

  try {
    const items = Object.values(cart).map(a=>({id:a.id,name:a.name,price:a.price,qty:a.qty}));
    const total = cartTotal();
    const docRef = await addDoc(collection(db,'commandes'), {
      service: currentService,
      serviceName: svc.name,
      statut: 'En attente',
      phone,
      adresse: addr,
      notes,
      modePaiement: selectedPayment,
      articles: items,
      total,
      ...positionData,
      createdAt: serverTimestamp()
    });

    // Succès
    document.getElementById('succ-msg').innerHTML =
      `Commande <strong style="color:var(--blue)">${svc.name}</strong> confirmée !<br/>
       Référence : <strong>#${docRef.id.slice(0,8).toUpperCase()}</strong><br/>
       ${selectedPayment === 'livraison'
         ? '💵 Paiement à la livraison — notre agent vous contacte bientôt.'
         : '📱 Paiement '+selectedPayment+' — traitement en cours.'}<br/>
       <small style="color:var(--light)">Téléphone enregistré : ${phone}</small>`;
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
// FORMULAIRE STANDARD (sans catalogue)
// ════════════════════════════════════════
async function submitStandardForm() {
  const svc = SVCS[currentService];
  const btn = document.getElementById('form-submit-btn');
  const data = {service:currentService, serviceName:svc.name, statut:'En attente', createdAt:serverTimestamp()};
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
// RECHERCHE COMMANDES
// ════════════════════════════════════════
async function searchOrders() {
  const ph  = document.getElementById('ph-inp').value.trim();
  const out = document.getElementById('orders-out');
  if (!ph) { out.innerHTML=`<div class="empty-st"><div class="empty-ico">📱</div><div class="empty-txt">Entrez votre numéro</div></div>`; return; }
  out.innerHTML=`<div class="empty-st"><div class="empty-ico">⏳</div><div class="empty-txt">Recherche...</div></div>`;
  try {
    const q = query(collection(db,'commandes'), where('phone','==',ph));
    const snap = await getDocs(q);
    if (snap.empty) { out.innerHTML=`<div class="empty-st"><div class="empty-ico">🔍</div><div class="empty-txt">Aucune commande trouvée<br/>pour ce numéro</div></div>`; return; }
    const SC = {
      'En attente':{c:'#F5820A',bg:'#FFF3E0'},
      'Confirmée': {c:'#1E6FBE',bg:'#E3F2FD'},
      'En cours':  {c:'#7B1FA2',bg:'#F3E5F5'},
      'Terminée':  {c:'#2E7D32',bg:'#E8F5E9'},
      'Annulée':   {c:'#C62828',bg:'#FFEBEE'}
    };
    const STEPS = ['En attente','Confirmée','En cours','Terminée'];
    let h='';
    snap.forEach(doc => {
      const o={id:doc.id,...doc.data()};
      const s=SC[o.statut]||SC['En attente'];
      const idx=STEPS.indexOf(o.statut);
      const dateStr=o.createdAt?new Date(o.createdAt.seconds*1000).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
      const prog=STEPS.map((st,i)=>{
        const act=i<=idx;
        return `<div class="prog-dot" style="background:${act?'#1E6FBE':'#E8EAF0'}">${act?'✓':''}</div>${i<3?`<div class="prog-line" style="background:${i<idx?'#1E6FBE':'#E8EAF0'}"></div>`:''}`;
      }).join('');
      const totalStr = o.total ? `— Total : ${fmt(o.total)}` : '';
      h+=`<div class="o-card">
        <div class="o-head">
          <div><div class="o-name">${o.serviceName||o.service}</div><div class="o-date">📅 ${dateStr} ${totalStr}</div></div>
          <span class="o-pill" style="background:${s.bg};color:${s.c}">${o.statut}</span>
        </div>
        <div class="o-detail">
          ${o.adresse?`<div class="o-drow"><span class="o-dk">Adresse :</span><span class="o-dv">${o.adresse}</span></div>`:''}
          ${o.modePaiement?`<div class="o-drow"><span class="o-dk">Paiement :</span><span class="o-dv">${o.modePaiement}</span></div>`:''}
          <div class="o-drow"><span class="o-dk">Réf :</span><span class="o-dv">#${o.id.slice(0,8).toUpperCase()}</span></div>
        </div>
        <div class="prog">${prog}</div>
        <div class="prog-lbls"><span class="prog-lbl">Reçue</span><span class="prog-lbl">Confirmée</span><span class="prog-lbl">En cours</span><span class="prog-lbl">Terminée</span></div>
      </div>`;
    });
    out.innerHTML=h;
  } catch(err) {
    console.error(err);
    out.innerHTML=`<div class="empty-st"><div class="empty-ico">❌</div><div class="empty-txt">Erreur de connexion.<br/>Vérifiez votre réseau.</div></div>`;
  }
}
window.searchOrders = searchOrders;

// ════════════════════════════════════════
// SLIDER HERO (avec slides partenaires)
// ════════════════════════════════════════
const defaultSlides = document.querySelectorAll('.slide');
const dotsEl = document.getElementById('slider-dots');
let slides = [...defaultSlides];

function goSlide(i) {
  slides[sliderIdx].classList.remove('on');
  dotsEl.querySelectorAll('.dot')[sliderIdx]?.classList.remove('on');
  sliderIdx = i % slides.length;
  slides[sliderIdx].classList.add('on');
  dotsEl.querySelectorAll('.dot')[sliderIdx]?.classList.add('on');
}
window.goSlide = goSlide;

function startSlider() {
  if (sliderTimer) clearInterval(sliderTimer);
  sliderTimer = setInterval(() => goSlide((sliderIdx+1) % slides.length), 4500);
}
startSlider();

// Charger slides partenaires depuis Firestore
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
      // Ajouter un dot
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.onclick = () => goSlide(slides.length);
      dotsEl.appendChild(dot);
      slides.push(slide);
    });
    // Réinitialiser slider
    clearInterval(sliderTimer);
    startSlider();
  } catch(e) {
    console.log('Partenaires Firestore non disponibles');
  }
}
loadPartnerSlides();

// ════════════════════════════════════════
// FILTRE RECHERCHE SERVICES
// ════════════════════════════════════════
function filterServices(q) {
  if (!document.getElementById('t-services').classList.contains('on')) goTab('services');
  document.querySelectorAll('#view-list .svc-row').forEach(r => {
    r.style.display = !q || r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
window.filterServices = filterServices;

// ════════════════════════════════════════
// PROFIL
// ════════════════════════════════════════
function saveProfile() {
  const n = document.getElementById('p-name-inp').value || 'Mon Profil';
  const p = document.getElementById('p-phone-inp').value || 'Ajoutez vos informations';
  document.getElementById('prof-name-disp').textContent = n;
  document.getElementById('prof-phone-disp').textContent = p;
  localStorage.setItem('omni_name', n);
  localStorage.setItem('omni_phone', p);
  showToast('✅ Profil enregistré !');
}
window.saveProfile = saveProfile;

// Restaurer profil
window.addEventListener('DOMContentLoaded', () => {
  const n = localStorage.getItem('omni_name');
  const p = localStorage.getItem('omni_phone');
  if (n) { document.getElementById('prof-name-disp').textContent=n; document.getElementById('p-name-inp').value=n; }
  if (p) { document.getElementById('prof-phone-disp').textContent=p; document.getElementById('p-phone-inp').value=p; }
  // Pré-remplir le téléphone sur la page livraison si connu
  if (p && p !== 'Ajoutez vos informations') {
    const phEl = document.getElementById('del-phone');
    if (phEl) phEl.value = p;
  }
});
