/* ══════════════════════════════════════════
   OmniService TG — app.js
   Firebase Firestore intégré
   ══════════════════════════════════════════ */

// ── Firebase Config ──────────────────────────
// Remplacez ces valeurs par votre config Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query,
  where, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Toast helper ─────────────────────────────
function showToast(msg, color = "#1E6FBE") {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.style.background = color;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

// ── Navigation par onglets ────────────────────
function goTab(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("on"));
  document.querySelectorAll(".btab").forEach(b => b.classList.remove("on"));
  document.getElementById("p-" + id).classList.add("on");
  const t = document.getElementById("t-" + id);
  if (t) t.classList.add("on");
  document.getElementById("scrl").scrollTop = 0;
}
window.goTab = goTab;

// ── Slider ───────────────────────────────────
let cur = 0;
const slides = document.querySelectorAll(".slide");
const dots   = document.querySelectorAll(".dot");

function goSlide(i) {
  slides[cur].classList.remove("on"); dots[cur].classList.remove("on"); dots[cur].style.width = "6px";
  cur = i;
  slides[cur].classList.add("on"); dots[cur].classList.add("on"); dots[cur].style.width = "18px";
}
window.goSlide = goSlide;
setInterval(() => goSlide((cur + 1) % slides.length), 4200);

// ── Définition des services ──────────────────
const SVCS = {
  food: {
    name: "Alimentation & Produits locaux", icon: "🥘", bg: "#FFF3E0", active: true,
    fields: [
      { n: "produits", l: "Produits souhaités", t: "textarea", ph: "Ex : 2 kg de Tilapia, 1 bouteille de vin de palme..." },
      { n: "adresse",  l: "Adresse de livraison", t: "text", ph: "Votre adresse à Lomé" },
      { n: "date",     l: "Date de livraison", t: "date" },
      { n: "phone",    l: "Téléphone", t: "tel", ph: "+228 XX XX XX XX" },
      { n: "notes",    l: "Remarques (optionnel)", t: "textarea", ph: "Toute précision...", opt: true }
    ]
  },
  restaurant: {
    name: "Restauration", icon: "🍽️", bg: "#E3F2FD", active: true,
    fields: [
      { n: "type",     l: "Type de service", t: "select", opts: ["Plat restaurant partenaire", "Service traiteur événement"] },
      { n: "commande", l: "Plat ou menu souhaité", t: "textarea", ph: "Décrivez votre commande..." },
      { n: "personnes",l: "Nombre de personnes", t: "number", ph: "Ex : 4" },
      { n: "adresse",  l: "Adresse de livraison", t: "text", ph: "Votre adresse à Lomé" },
      { n: "phone",    l: "Téléphone", t: "tel", ph: "+228 XX XX XX XX" }
    ]
  },
  delivery: {
    name: "Livraison & Courses", icon: "🚚", bg: "#FFF3E0", active: true,
    fields: [
      { n: "type",    l: "Type", t: "select", opts: ["Livraison express", "Courses personnalisées", "Livraison entreprise", "Livraison de plats"] },
      { n: "detail",  l: "Lieu de collecte / Liste de courses", t: "textarea", ph: "Adresse ou liste d'articles..." },
      { n: "adresse", l: "Adresse de livraison", t: "text", ph: "Votre adresse à Lomé" },
      { n: "urgence", l: "Urgence", t: "select", opts: ["Express (< 1h)", "Dans la journée", "Planifier"] },
      { n: "phone",   l: "Téléphone", t: "tel", ph: "+228 XX XX XX XX" }
    ]
  },
  maintenance: {
    name: "Maintenance Technique", icon: "🔧", bg: "#E3F2FD", active: false, soon: "16 Mars 2026",
    fields: [
      { n: "type",    l: "Type d'intervention", t: "select", opts: ["Dépannage Électricité", "Dépannage Plomberie", "Dépannage Voiture", "Réparation Électroménager", "Réparation Informatique", "Pose TV / Antenne", "Petits travaux"] },
      { n: "problem", l: "Description du problème", t: "textarea", ph: "Décrivez le problème..." },
      { n: "adresse", l: "Adresse", t: "text", ph: "Votre adresse à Lomé" },
      { n: "phone",   l: "Téléphone", t: "tel", ph: "+228 XX XX XX XX" }
    ]
  },
  clothes: {
    name: "Prêt-à-porter", icon: "👗", bg: "#FFF3E0", active: true,
    fields: [
      { n: "categorie", l: "Catégorie", t: "select", opts: ["Vêtements Homme", "Vêtements Femme", "Vêtements Enfant", "Sacs", "Chaussures", "Cosmétiques & Accessoires"] },
      { n: "article",   l: "Article souhaité", t: "textarea", ph: "Couleur, taille, style..." },
      { n: "budget",    l: "Budget estimé (FCFA)", t: "number", ph: "Ex : 15000" },
      { n: "adresse",   l: "Adresse de livraison", t: "text", ph: "Votre adresse à Lomé" },
      { n: "phone",     l: "Téléphone", t: "tel", ph: "+228 XX XX XX XX" }
    ]
  },
  cleaning: {
    name: "Entretien & Nettoyage", icon: "🧹", bg: "#E3F2FD", active: true,
    fields: [
      { n: "type",      l: "Type", t: "select", opts: ["Nettoyage résidentiel", "Nettoyage bureaux", "Entretien régulier", "Entretien industriel"] },
      { n: "superficie",l: "Superficie (m²)", t: "number", ph: "Ex : 60" },
      { n: "adresse",   l: "Adresse", t: "text", ph: "Votre adresse à Lomé" },
      { n: "date",      l: "Date souhaitée", t: "date" },
      { n: "phone",     l: "Téléphone", t: "tel", ph: "+228 XX XX XX XX" }
    ]
  },
  security: {
    name: "Gardiennage & Sécurité", icon: "🛡️", bg: "#E3F2FD", active: false, soon: "7 Avril 2026",
    fields: [
      { n: "type",   l: "Type", t: "select", opts: ["Gardiennage Résidentiel", "Gardiennage Boutique", "Sécurité Événementielle", "Surveillance Temporaire"] },
      { n: "detail", l: "Description du besoin", t: "textarea", ph: "Vos besoins en sécurité..." },
      { n: "adresse",l: "Lieu / Adresse", t: "text", ph: "Votre adresse à Lomé" },
      { n: "phone",  l: "Téléphone", t: "tel", ph: "+228 XX XX XX XX" }
    ]
  }
};

// ── Ouvrir un formulaire de service ──────────
function openForm(id) {
  goTab("services");
  const svc = SVCS[id];
  document.getElementById("svc-list-v").style.display = "none";
  document.getElementById("svc-success-v").style.display = "none";
  const fv = document.getElementById("svc-form-v");
  fv.style.display = "block";

  let html = `<div class="form-hdr">
    <button class="back-btn" onclick="closeForm()">←</button>
    <div style="width:35px;height:35px;background:${svc.bg};border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px">${svc.icon}</div>
    <div><div style="font-size:13px;font-weight:700;color:#1A1A2E">${svc.name}</div><div style="font-size:10px;color:#9999BB">Formulaire de demande</div></div>
  </div>
  <div class="form-body">`;

  if (!svc.active) {
    html += `<div class="warn-box"><div class="warn-title">⏳ Service bientôt disponible</div><div class="warn-desc">Opérationnel le <strong>${svc.soon}</strong>. Vous pouvez déjà soumettre votre demande.</div></div>`;
  }

  html += `<div class="form-card" id="form-fields-${id}">`;
  svc.fields.forEach(f => {
    html += `<label class="f-label">${f.l}${f.opt ? ' <span style="text-transform:none;font-weight:400;color:#C5C5D8">(optionnel)</span>' : ''}</label>`;
    if (f.t === "textarea") {
      html += `<textarea class="f-textarea" rows="3" placeholder="${f.ph || ''}" name="${f.n}" id="f-${id}-${f.n}"></textarea>`;
    } else if (f.t === "select") {
      html += `<select class="f-select" name="${f.n}" id="f-${id}-${f.n}"><option value="">— Choisir —</option>`;
      f.opts.forEach(o => html += `<option value="${o}">${o}</option>`);
      html += `</select>`;
    } else {
      html += `<input type="${f.t}" class="f-input" placeholder="${f.ph || ''}" name="${f.n}" id="f-${id}-${f.n}"/>`;
    }
  });
  html += `<button class="submit-btn" id="submit-btn-${id}" onclick="submitForm('${id}')">📨 Envoyer ma demande</button>`;
  html += `</div></div>`;
  fv.innerHTML = html;
}
window.openForm = openForm;

// ── Soumettre le formulaire → Firestore ──────
async function submitForm(id) {
  const svc = SVCS[id];
  const btn = document.getElementById(`submit-btn-${id}`);

  // Collecte des valeurs
  const data = { service: id, serviceName: svc.name, statut: "En attente", createdAt: serverTimestamp() };
  let valid = true;

  svc.fields.forEach(f => {
    const el = document.getElementById(`f-${id}-${f.n}`);
    if (!el) return;
    const val = el.value.trim();
    if (!f.opt && !val) {
      el.style.borderColor = "#F5820A";
      valid = false;
    } else {
      el.style.borderColor = "";
      data[f.n] = val;
    }
  });

  if (!valid) { showToast("⚠️ Veuillez remplir tous les champs obligatoires", "#F5820A"); return; }

  // Envoi Firestore
  btn.innerHTML = `<span class="spinner"></span> Envoi...`;
  btn.disabled = true;

  try {
    const docRef = await addDoc(collection(db, "commandes"), data);
    // Afficher la page succès
    document.getElementById("svc-form-v").style.display = "none";
    document.getElementById("svc-success-v").style.display = "block";
    document.getElementById("succ-msg").innerHTML =
      `Votre demande de <strong style="color:#1E6FBE">${svc.name}</strong> a bien été reçue.<br/>
       Réf : <strong>#${docRef.id.slice(0, 8).toUpperCase()}</strong><br/>
       Notre équipe vous contactera très bientôt.`;
  } catch (err) {
    console.error(err);
    showToast("❌ Erreur d'envoi. Vérifiez votre connexion.", "#C62828");
    btn.innerHTML = "📨 Envoyer ma demande";
    btn.disabled = false;
  }
}
window.submitForm = submitForm;

// ── Fermer le formulaire ─────────────────────
function closeForm() {
  document.getElementById("svc-list-v").style.display = "block";
  document.getElementById("svc-form-v").style.display = "none";
  document.getElementById("svc-success-v").style.display = "none";
  document.getElementById("scrl").scrollTop = 0;
}
window.closeForm = closeForm;

// ── Statuts & couleurs ───────────────────────
const SC = {
  "En attente": { c: "#F5820A", bg: "#FFF3E0" },
  "Confirmée":  { c: "#1E6FBE", bg: "#E3F2FD" },
  "En cours":   { c: "#7B1FA2", bg: "#F3E5F5" },
  "Terminée":   { c: "#2E7D32", bg: "#E8F5E9" },
  "Annulée":    { c: "#C62828", bg: "#FFEBEE" }
};
const STEPS = ["En attente", "Confirmée", "En cours", "Terminée"];

// ── Recherche de commandes par téléphone ─────
async function searchOrders() {
  const ph  = document.getElementById("ph-inp").value.trim();
  const out = document.getElementById("orders-out");

  if (!ph) {
    out.innerHTML = `<div class="empty-st"><div class="empty-ico">📱</div><div class="empty-txt">Veuillez entrer votre numéro</div></div>`;
    return;
  }

  out.innerHTML = `<div class="empty-st"><div class="empty-ico">⏳</div><div class="empty-txt">Recherche en cours...</div></div>`;

  try {
    const q = query(collection(db, "commandes"), where("phone", "==", ph));
    const snap = await getDocs(q);

    if (snap.empty) {
      out.innerHTML = `<div class="empty-st"><div class="empty-ico">🔍</div><div class="empty-txt">Aucune commande trouvée<br/>pour ce numéro</div></div>`;
      return;
    }

    let h = "";
    snap.forEach(doc => {
      const o = { id: doc.id, ...doc.data() };
      const s = SC[o.statut] || SC["En attente"];
      const idx = STEPS.indexOf(o.statut);
      const dateStr = o.createdAt
        ? new Date(o.createdAt.seconds * 1000).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "—";

      const prog = STEPS.map((st, i) => {
        const act = i <= idx;
        return `<div class="prog-dot" style="background:${act ? "#1E6FBE" : "#E8EAF0"}">${act ? "✓" : ""}</div>${i < 3 ? `<div class="prog-line" style="background:${i < idx ? "#1E6FBE" : "#E8EAF0"}"></div>` : ""}`;
      }).join("");

      h += `<div class="order-card">
        <div class="o-head">
          <div>
            <div class="o-name">${o.serviceName || o.service}</div>
            <div class="o-date">📅 ${dateStr}</div>
          </div>
          <span class="o-pill" style="background:${s.bg};color:${s.c}">${o.statut}</span>
        </div>
        <div class="o-detail">
          ${o.type    ? `<div class="o-drow"><span class="o-dk">Type :</span><span class="o-dv">${o.type}</span></div>` : ""}
          ${o.produits ? `<div class="o-drow"><span class="o-dk">Produits :</span><span class="o-dv">${o.produits}</span></div>` : ""}
          ${o.adresse  ? `<div class="o-drow"><span class="o-dk">Adresse :</span><span class="o-dv">${o.adresse}</span></div>` : ""}
          <div class="o-drow"><span class="o-dk">Réf :</span><span class="o-dv">#${o.id.slice(0, 8).toUpperCase()}</span></div>
        </div>
        <div class="prog">${prog}</div>
        <div class="prog-lbls"><span class="prog-lbl">Reçue</span><span class="prog-lbl">Confirmée</span><span class="prog-lbl">En cours</span><span class="prog-lbl">Terminée</span></div>
      </div>`;
    });
    out.innerHTML = h;

  } catch (err) {
    console.error(err);
    out.innerHTML = `<div class="empty-st"><div class="empty-ico">❌</div><div class="empty-txt">Erreur de connexion.<br/>Vérifiez votre réseau.</div></div>`;
  }
}
window.searchOrders = searchOrders;

// ── Profil (localStorage pour persistance légère) ──
function saveProfile() {
  const n = document.getElementById("p-name-inp").value || "Mon Profil";
  const p = document.getElementById("p-phone-inp").value || "Ajoutez vos informations";
  document.getElementById("prof-name-disp").textContent = n;
  document.getElementById("prof-phone-disp").textContent = p;
  localStorage.setItem("omni_name", n);
  localStorage.setItem("omni_phone", p);
  const btn = document.getElementById("p-save-btn");
  btn.textContent = "✅ Enregistré !";
  setTimeout(() => btn.textContent = "Enregistrer", 2000);
  showToast("✅ Profil enregistré !");
}
window.saveProfile = saveProfile;

// Restaurer profil au chargement
window.addEventListener("DOMContentLoaded", () => {
  const n = localStorage.getItem("omni_name");
  const p = localStorage.getItem("omni_phone");
  if (n) { document.getElementById("prof-name-disp").textContent = n; document.getElementById("p-name-inp").value = n; }
  if (p) { document.getElementById("prof-phone-disp").textContent = p; document.getElementById("p-phone-inp").value = p; }
});
