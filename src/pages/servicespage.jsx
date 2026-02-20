import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config.js";

export const ALL_SERVICES = [
  {
    id:"food", icon:"🥘", label:"Alimentation & Produits locaux",
    color:"#F5820A", bg:"#FFF3E0", active:true,
    desc:"Kits alimentaires, produits frais (Tilapia, Volailles, Légumes), Néré, Vin de palme embouteillé.",
    fields:[
      { name:"produits",  label:"Produits souhaités",       type:"textarea", ph:"Ex : 2 kg de Tilapia, 1 bouteille de vin de palme..." },
      { name:"adresse",   label:"Adresse de livraison",     type:"text",     ph:"Votre adresse à Lomé" },
      { name:"date",      label:"Date de livraison",        type:"date" },
      { name:"phone",     label:"Téléphone",                type:"tel",      ph:"+228 XX XX XX XX" },
      { name:"notes",     label:"Remarques (optionnel)",    type:"textarea", ph:"Toute précision utile...", optional:true },
    ],
  },
  {
    id:"restaurant", icon:"🍽️", label:"Restauration",
    color:"#1E6FBE", bg:"#E3F2FD", active:true,
    desc:"Plats de restaurants partenaires, service traiteur pour vos événements.",
    fields:[
      { name:"type",      label:"Type de service",          type:"select",   options:["Plat restaurant partenaire","Service traiteur événement"] },
      { name:"commande",  label:"Plat ou menu souhaité",    type:"textarea", ph:"Décrivez votre commande ou le menu traiteur..." },
      { name:"personnes", label:"Nombre de personnes",      type:"number",   ph:"Ex : 4" },
      { name:"adresse",   label:"Adresse de livraison",     type:"text",     ph:"Votre adresse à Lomé" },
      { name:"datetime",  label:"Date et heure souhaitées", type:"datetime-local" },
      { name:"phone",     label:"Téléphone",                type:"tel",      ph:"+228 XX XX XX XX" },
    ],
  },
  {
    id:"delivery", icon:"🚚", label:"Livraison & Courses",
    color:"#F5820A", bg:"#FFF3E0", active:true,
    desc:"Livraison express, courses personnalisées, livraison entreprise et de plats.",
    fields:[
      { name:"type",      label:"Type de livraison",        type:"select",   options:["Livraison express","Courses personnalisées","Livraison entreprise","Livraison de plats"] },
      { name:"detail",    label:"Lieu de collecte / Liste", type:"textarea", ph:"Adresse ou liste de courses à effectuer..." },
      { name:"adresse",   label:"Adresse de livraison",     type:"text",     ph:"Votre adresse à Lomé" },
      { name:"urgence",   label:"Urgence",                  type:"select",   options:["Express (< 1h)","Dans la journée","Planifier"] },
      { name:"phone",     label:"Téléphone",                type:"tel",      ph:"+228 XX XX XX XX" },
      { name:"notes",     label:"Instructions (optionnel)", type:"textarea", ph:"Précisions pour le livreur...", optional:true },
    ],
  },
  {
    id:"maintenance", icon:"🔧", label:"Maintenance Technique",
    color:"#1E6FBE", bg:"#E3F2FD", active:false, soon:"16 Mars 2026",
    desc:"Électricité, plomberie, voiture, électroménager, électronique, informatique, pose TV/antenne, petits travaux.",
    fields:[
      { name:"type",      label:"Type d'intervention",      type:"select",   options:["Dépannage Électricité","Dépannage Plomberie / Sanitaires","Dépannage Voiture","Réparation Électroménager","Réparation Électronique","Réparation Informatique","Pose TV / Antenne","Petits travaux"] },
      { name:"problem",   label:"Description du problème",  type:"textarea", ph:"Décrivez le problème en détail..." },
      { name:"adresse",   label:"Adresse d'intervention",   type:"text",     ph:"Votre adresse à Lomé" },
      { name:"urgence",   label:"Urgence",                  type:"select",   options:["Urgent (aujourd'hui)","Sous 48h","À planifier"] },
      { name:"phone",     label:"Téléphone",                type:"tel",      ph:"+228 XX XX XX XX" },
    ],
  },
  {
    id:"clothes", icon:"👗", label:"Prêt-à-porter",
    color:"#F5820A", bg:"#FFF3E0", active:true,
    desc:"Vêtements homme/femme/enfant, sacs, chaussures, cosmétiques et accessoires.",
    fields:[
      { name:"categorie", label:"Catégorie",                type:"select",   options:["Vêtements Homme","Vêtements Femme","Vêtements Enfant","Sacs Homme","Sacs Femme","Chaussures Homme","Chaussures Femme","Chaussures Enfant","Cosmétiques & Accessoires"] },
      { name:"article",   label:"Article souhaité",         type:"textarea", ph:"Couleur, taille, style, modèle..." },
      { name:"budget",    label:"Budget estimé (FCFA)",     type:"number",   ph:"Ex : 15000" },
      { name:"adresse",   label:"Adresse de livraison",     type:"text",     ph:"Votre adresse à Lomé" },
      { name:"phone",     label:"Téléphone",                type:"tel",      ph:"+228 XX XX XX XX" },
    ],
  },
  {
    id:"cleaning", icon:"🧹", label:"Entretien & Nettoyage",
    color:"#1E6FBE", bg:"#E3F2FD", active:true,
    desc:"Nettoyage résidentiel, bureaux, entretien régulier et industriel.",
    fields:[
      { name:"type",      label:"Type de nettoyage",        type:"select",   options:["Nettoyage résidentiel","Nettoyage bureaux","Entretien régulier","Entretien industriel"] },
      { name:"superficie",label:"Superficie (m²)",          type:"number",   ph:"Ex : 60" },
      { name:"frequence", label:"Fréquence",                type:"select",   options:["Une seule fois","Hebdomadaire","Mensuel","À discuter"] },
      { name:"adresse",   label:"Adresse",                  type:"text",     ph:"Votre adresse à Lomé" },
      { name:"date",      label:"Date souhaitée",           type:"date" },
      { name:"phone",     label:"Téléphone",                type:"tel",      ph:"+228 XX XX XX XX" },
      { name:"notes",     label:"Besoins particuliers (opt)",type:"textarea",ph:"Zones, produits préférés...", optional:true },
    ],
  },
  {
    id:"security", icon:"🛡️", label:"Gardiennage & Sécurité",
    color:"#1E6FBE", bg:"#E3F2FD", active:false, soon:"7 Avril 2026",
    desc:"Gardiennage résidentiel/boutique/bureau, sécurité événementielle, surveillance temporaire.",
    fields:[
      { name:"type",      label:"Type de gardiennage",      type:"select",   options:["Gardiennage Résidentiel","Gardiennage Boutique","Gardiennage Bureau","Sécurité Événementielle","Surveillance Temporaire"] },
      { name:"detail",    label:"Description du besoin",   type:"textarea", ph:"Décrivez vos besoins en sécurité..." },
      { name:"adresse",   label:"Adresse / Lieu",           type:"text",     ph:"Votre adresse à Lomé" },
      { name:"debut",     label:"Date de début",            type:"date" },
      { name:"duree",     label:"Durée estimée",            type:"text",     ph:"Ex : 3 jours, 1 semaine, permanent..." },
      { name:"phone",     label:"Téléphone",                type:"tel",      ph:"+228 XX XX XX XX" },
    ],
  },
];

/* ── Form Component ── */
function ServiceForm({ svc, onBack }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const validate = () => {
    const e = {};
    svc.fields.forEach(f => {
      if (!f.optional && !form[f.name]) e[f.name] = "Champ requis";
    });
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "commandes"), {
        service: svc.id, serviceLabel: svc.label,
        ...form, statut: "En attente", createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Erreur réseau. Vérifiez votre connexion.");
    }
    setLoading(false);
  };

  if (done) return (
    <div style={{ padding:"40px 20px", textAlign:"center" }}>
      <div style={{ fontSize:68, marginBottom:16, animation:"fadeUp .4s" }}>✅</div>
      <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:22, fontWeight:900, color:"#1A1A2E", marginBottom:8 }}>
        Demande envoyée !
      </div>
      <div style={{ fontSize:13, color:"#9999BB", lineHeight:1.8, marginBottom:28 }}>
        Votre demande de <strong style={{ color:"#1E6FBE" }}>{svc.label}</strong><br/>a été reçue. Nous vous contactons très bientôt.
      </div>
      <button className="btn-blue" onClick={onBack} style={{ width:"100%", justifyContent:"center" }}>
        Retour aux services
      </button>
    </div>
  );

  return (
    <div className="page-content" style={{ background:"#F4F6FA" }}>
      {/* Header */}
      <div style={{
        background:"#fff", padding:"12px 14px",
        display:"flex", alignItems:"center", gap:10,
        boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
        position:"sticky", top:0, zIndex:10,
      }}>
        <button onClick={onBack} style={{
          width:36, height:36, background:"#F4F6FA", border:"none",
          borderRadius:10, display:"flex", alignItems:"center",
          justifyContent:"center", cursor:"pointer",
        }}>
          <ArrowLeft size={18} color="#1A1A2E" />
        </button>
        <div style={{
          width:36, height:36, background:svc.bg, borderRadius:9,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
        }}>{svc.icon}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#1A1A2E" }}>{svc.label}</div>
          <div style={{ fontSize:10, color:"#9999BB" }}>Formulaire de demande</div>
        </div>
      </div>

      <div style={{ padding:14 }}>
        {!svc.active && (
          <div style={{
            background:"linear-gradient(135deg,#F5820A,#D96E00)",
            borderRadius:13, padding:"13px 15px", marginBottom:14, color:"#fff",
          }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>⏳ Service bientôt disponible</div>
            <div style={{ fontSize:11.5, opacity:.9 }}>
              Opérationnel le <strong>{svc.soon}</strong>. Vous pouvez déjà soumettre votre demande.
            </div>
          </div>
        )}

        <div style={{ background:"#fff", borderRadius:14, padding:16, boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          {svc.fields.map(f => (
            <div key={f.name} style={{ marginBottom:15 }}>
              <label className="input-label">
                {f.label}{f.optional && <span style={{ color:"#C5C5D8", fontWeight:400, textTransform:"none" }}> (optionnel)</span>}
              </label>

              {f.type === "textarea" ? (
                <textarea rows={3} className="input-field"
                  placeholder={f.ph || ""}
                  value={form[f.name] || ""}
                  onChange={e => set(f.name, e.target.value)}
                  style={{ resize:"none" }}
                />
              ) : f.type === "select" ? (
                <select className="input-field"
                  value={form[f.name] || ""}
                  onChange={e => set(f.name, e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} className="input-field"
                  placeholder={f.ph || ""}
                  value={form[f.name] || ""}
                  onChange={e => set(f.name, e.target.value)}
                />
              )}

              {errors[f.name] && (
                <div style={{ color:"#F5820A", fontSize:11, marginTop:3 }}>⚠ {errors[f.name]}</div>
              )}
            </div>
          ))}

          <button className="btn-blue" onClick={submit} disabled={loading}
            style={{ width:"100%", justifyContent:"center", opacity: loading ? .7 : 1, marginTop:4 }}>
            {loading ? "Envoi..." : <><Send size={15} /> Envoyer ma demande</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Services List ── */
export default function ServicesPage({ initialService }) {
  const [selected, setSelected] = useState(
    initialService ? ALL_SERVICES.find(s => s.id === initialService) : null
  );

  if (selected) return <ServiceForm svc={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="page-content" style={{ background:"#F4F6FA" }}>
      <div style={{ padding:"16px 14px 10px" }}>
        <div className="section-title">Nos Services</div>
        <div className="section-sub">Une solution intégrée pour tous vos besoins</div>
      </div>

      <div style={{ padding:"0 14px", display:"flex", flexDirection:"column", gap:10 }}>
        {ALL_SERVICES.map(svc => (
          <button key={svc.id} onClick={() => setSelected(svc)} style={{
            background:"#fff", border:"none", borderRadius:16, padding:"15px",
            display:"flex", alignItems:"center", gap:13, cursor:"pointer",
            boxShadow:"0 2px 10px rgba(0,0,0,0.06)", textAlign:"left", width:"100%",
            transition:"all .2s",
          }}>
            <div style={{
              width:52, height:52, background:svc.bg, borderRadius:13,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:24, flexShrink:0,
            }}>{svc.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#1A1A2E" }}>{svc.label}</span>
                {svc.soon && (
                  <span style={{
                    background:"linear-gradient(135deg,#F5820A,#D96E00)",
                    color:"#fff", fontSize:8, fontWeight:800,
                    padding:"2px 8px", borderRadius:999, letterSpacing:.3,
                  }}>{svc.soon}</span>
                )}
              </div>
              <div style={{ fontSize:11, color:"#9999BB", lineHeight:1.5 }}>{svc.desc}</div>
            </div>
            <span style={{ fontSize:18, color:"#E8EAF0", flexShrink:0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
