import { useState } from "react";
import { ArrowLeft, ChevronRight, Send, CheckCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const SERVICES = [
  {
    id: "food",
    icon: "🥘",
    label: "Alimentation & Produits locaux",
    color: "#27AE60",
    bg: "#E8F8EF",
    description: "Kits alimentaires, produits frais (Tilapia, Volailles, Légumes), Néré, Vin de palme...",
    operational: true,
    form: [
      { name: "produits", label: "Produits souhaités", type: "textarea", placeholder: "Ex: 2kg de Tilapia, 1 bouteille de vin de palme..." },
      { name: "adresse", label: "Adresse de livraison", type: "text", placeholder: "Votre adresse à Lomé" },
      { name: "date", label: "Date de livraison souhaitée", type: "date" },
      { name: "phone", label: "Téléphone", type: "tel", placeholder: "+228 XX XX XX XX" },
      { name: "notes", label: "Remarques supplémentaires", type: "textarea", placeholder: "Toute précision utile...", optional: true }
    ]
  },
  {
    id: "restaurant",
    icon: "🍽️",
    label: "Restauration",
    color: "#F5A623",
    bg: "#FEF5E7",
    description: "Plats de restaurants partenaires, service traiteur pour événements.",
    operational: true,
    form: [
      { name: "type", label: "Type de service", type: "select", options: ["Plat restaurant partenaire", "Service traiteur événement"] },
      { name: "plat", label: "Plat ou menu souhaité", type: "textarea", placeholder: "Décrivez votre commande ou le menu pour le traiteur..." },
      { name: "personnes", label: "Nombre de personnes", type: "number", placeholder: "Ex: 4" },
      { name: "adresse", label: "Adresse de livraison", type: "text", placeholder: "Votre adresse à Lomé" },
      { name: "date", label: "Date et heure souhaitées", type: "datetime-local" },
      { name: "phone", label: "Téléphone", type: "tel", placeholder: "+228 XX XX XX XX" },
    ]
  },
  {
    id: "delivery",
    icon: "🚚",
    label: "Livraison & Courses",
    color: "#E94560",
    bg: "#FDEEF1",
    description: "Livraison express, courses personnalisées, livraison entreprise.",
    operational: true,
    form: [
      { name: "type", label: "Type de livraison", type: "select", options: ["Livraison express", "Courses personnalisées", "Livraison entreprise", "Livraison de plats"] },
      { name: "pickup", label: "Lieu de collecte / Ce qu'il faut acheter", type: "textarea", placeholder: "Adresse de collecte ou liste de courses..." },
      { name: "adresse", label: "Adresse de livraison", type: "text", placeholder: "Votre adresse à Lomé" },
      { name: "urgence", label: "Urgence", type: "select", options: ["Express (< 1h)", "Dans la journée", "Planifier"] },
      { name: "phone", label: "Téléphone", type: "tel", placeholder: "+228 XX XX XX XX" },
      { name: "notes", label: "Instructions", type: "textarea", placeholder: "Précisions pour le livreur...", optional: true }
    ]
  },
  {
    id: "maintenance",
    icon: "🔧",
    label: "Maintenance Technique",
    color: "#E67E22",
    bg: "#FEF0E6",
    description: "Électricité, plomberie, voiture, électroménager, électronique, informatique, pose TV/antenne...",
    operational: false,
    comingSoon: "16 Mars 2026",
    form: [
      { name: "type", label: "Type d'intervention", type: "select", options: [
        "Dépannage Électricité",
        "Dépannage Plomberie / Sanitaires",
        "Dépannage Voiture",
        "Réparation Électroménager",
        "Réparation Électronique",
        "Réparation Informatique",
        "Pose TV / Antenne",
        "Petits travaux"
      ]},
      { name: "description", label: "Description du problème", type: "textarea", placeholder: "Décrivez le problème en détail..." },
      { name: "adresse", label: "Adresse d'intervention", type: "text", placeholder: "Votre adresse à Lomé" },
      { name: "urgence", label: "Niveau d'urgence", type: "select", options: ["Urgent (aujourd'hui)", "Planifier sous 48h", "À planifier"] },
      { name: "phone", label: "Téléphone", type: "tel", placeholder: "+228 XX XX XX XX" },
    ]
  },
  {
    id: "clothes",
    icon: "👗",
    label: "Prêt-à-porter",
    color: "#9B59B6",
    bg: "#F4ECF7",
    description: "Vêtements homme/femme/enfant, sacs, chaussures, cosmétiques et accessoires.",
    operational: true,
    form: [
      { name: "categorie", label: "Catégorie", type: "select", options: [
        "Vêtements Homme", "Vêtements Femme", "Vêtements Enfant",
        "Sacs Homme", "Sacs Femme",
        "Chaussures Homme", "Chaussures Femme", "Chaussures Enfant",
        "Cosmétiques & Accessoires"
      ]},
      { name: "description", label: "Description / Article souhaité", type: "textarea", placeholder: "Décrivez l'article, la couleur, la taille..." },
      { name: "budget", label: "Budget estimé (FCFA)", type: "number", placeholder: "Ex: 15000" },
      { name: "adresse", label: "Adresse de livraison", type: "text", placeholder: "Votre adresse à Lomé" },
      { name: "phone", label: "Téléphone", type: "tel", placeholder: "+228 XX XX XX XX" },
    ]
  },
  {
    id: "cleaning",
    icon: "🧹",
    label: "Entretien & Nettoyage",
    color: "#3498DB",
    bg: "#EBF5FB",
    description: "Nettoyage résidentiel, bureaux, entretien régulier et industriel.",
    operational: true,
    form: [
      { name: "type", label: "Type de nettoyage", type: "select", options: [
        "Nettoyage résidentiel",
        "Nettoyage bureaux",
        "Entretien régulier",
        "Entretien industriel"
      ]},
      { name: "superficie", label: "Superficie approximative (m²)", type: "number", placeholder: "Ex: 60" },
      { name: "frequence", label: "Fréquence souhaitée", type: "select", options: ["Une seule fois", "Hebdomadaire", "Mensuel", "À discuter"] },
      { name: "adresse", label: "Adresse", type: "text", placeholder: "Votre adresse à Lomé" },
      { name: "date", label: "Date souhaitée", type: "date" },
      { name: "phone", label: "Téléphone", type: "tel", placeholder: "+228 XX XX XX XX" },
      { name: "notes", label: "Besoins particuliers", type: "textarea", placeholder: "Zones à traiter, produits préférés...", optional: true }
    ]
  },
  {
    id: "security",
    icon: "🛡️",
    label: "Gardiennage & Sécurité",
    color: "#1A1A2E",
    bg: "#EAEAF2",
    description: "Gardiennage résidentiel / boutique / bureau, sécurité événementielle, surveillance temporaire.",
    operational: false,
    comingSoon: "7 Avril 2026",
    form: [
      { name: "type", label: "Type de gardiennage", type: "select", options: [
        "Gardiennage Résidentiel",
        "Gardiennage Boutique",
        "Gardiennage Bureau",
        "Sécurité Événementielle",
        "Surveillance Temporaire"
      ]},
      { name: "description", label: "Description du besoin", type: "textarea", placeholder: "Décrivez vos besoins en sécurité..." },
      { name: "adresse", label: "Adresse / Lieu", type: "text", placeholder: "Votre adresse à Lomé" },
      { name: "date_debut", label: "Date de début", type: "date" },
      { name: "duree", label: "Durée estimée", type: "text", placeholder: "Ex: 3 jours, 1 semaine, CDI..." },
      { name: "phone", label: "Téléphone", type: "tel", placeholder: "+228 XX XX XX XX" },
    ]
  }
];

function ServiceForm({ service, onBack, onSuccess }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    service.form.forEach(field => {
      if (!field.optional && (!form[field.name] || form[field.name].trim?.() === "")) {
        errs[field.name] = "Ce champ est requis";
      }
    });
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "commandes"), {
        service: service.id,
        serviceLabel: service.label,
        ...form,
        statut: "En attente",
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (e) {
      console.error("Erreur Firestore:", e);
      alert("Une erreur s'est produite. Réessayez.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900, color: "#1A1A2E", marginBottom: 8 }}>
          Commande envoyée !
        </div>
        <div style={{ fontSize: 13, color: "#9999BB", lineHeight: 1.7, marginBottom: 32 }}>
          Votre demande de <strong style={{ color: "#E94560" }}>{service.label}</strong> a bien été reçue.<br/>
          Notre équipe vous contactera très bientôt.
        </div>
        <button className="btn-primary" onClick={onBack} style={{ width: "100%" }}>
          Retour aux services
        </button>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: "#F4F6FA" }}>
      {/* Header */}
      <div style={{
        background: "white",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 2px 12px rgba(26,26,46,0.06)",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <button onClick={onBack} style={{
          background: "#F4F6FA", border: "none", borderRadius: 10,
          width: 38, height: 38, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer"
        }}>
          <ArrowLeft size={18} color="#1A1A2E" />
        </button>
        <div style={{
          width: 38, height: 38, background: service.bg, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
        }}>{service.icon}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>{service.label}</div>
          <div style={{ fontSize: 10, color: "#9999BB" }}>Formulaire de demande</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Coming soon warning */}
        {!service.operational && (
          <div style={{
            background: "linear-gradient(135deg, #F5A623, #e8950a)",
            borderRadius: 14, padding: "14px 16px",
            marginBottom: 16, color: "white"
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>⏳ Service bientôt disponible</div>
            <div style={{ fontSize: 11.5, opacity: 0.9 }}>
              Ce service sera opérationnel le <strong>{service.comingSoon}</strong>. Vous pouvez néanmoins soumettre votre demande à l'avance.
            </div>
          </div>
        )}

        {/* Form */}
        <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(26,26,46,0.06)" }}>
          {service.form.map((field) => (
            <div key={field.name} style={{ marginBottom: 16 }}>
              <label className="input-label">
                {field.label} {field.optional && <span style={{ color: "#C5C5D8", fontWeight: 400 }}>(Optionnel)</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={(e) => { setForm({ ...form, [field.name]: e.target.value }); setErrors({ ...errors, [field.name]: null }); }}
                  style={{ resize: "none" }}
                />
              ) : field.type === "select" ? (
                <select
                  className="input-field"
                  value={form[field.name] || ""}
                  onChange={(e) => { setForm({ ...form, [field.name]: e.target.value }); setErrors({ ...errors, [field.name]: null }); }}
                >
                  <option value="">— Choisir —</option>
                  {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  className="input-field"
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={(e) => { setForm({ ...form, [field.name]: e.target.value }); setErrors({ ...errors, [field.name]: null }); }}
                />
              )}

              {errors[field.name] && (
                <div style={{ color: "#E94560", fontSize: 11, marginTop: 4 }}>
                  ⚠ {errors[field.name]}
                </div>
              )}
            </div>
          ))}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%", marginTop: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Envoi en cours..." : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Send size={16} /> Envoyer ma demande
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage({ initialService = null }) {
  const [selectedService, setSelectedService] = useState(
    initialService ? SERVICES.find(s => s.id === initialService) : null
  );

  if (selectedService) {
    return (
      <ServiceForm
        service={selectedService}
        onBack={() => setSelectedService(null)}
        onSuccess={() => setSelectedService(null)}
      />
    );
  }

  return (
    <div className="page" style={{ padding: "16px", background: "#F4F6FA" }}>
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Nos Services</div>
        <div className="section-sub">Une solution intégrée pour tous vos besoins</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SERVICES.map((svc) => (
          <button
            key={svc.id}
            onClick={() => setSelectedService(svc)}
            style={{
              background: "white",
              border: "none",
              borderRadius: 16,
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(26,26,46,0.06)",
              textAlign: "left",
              width: "100%",
              transition: "all 0.2s"
            }}
          >
            <div style={{
              width: 52, height: 52,
              background: svc.bg,
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, flexShrink: 0
            }}>{svc.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>{svc.label}</span>
                {svc.comingSoon && (
                  <span className="coming-soon">{svc.comingSoon}</span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: "#9999BB", lineHeight: 1.5 }}>{svc.description}</div>
            </div>
            <ChevronRight size={18} color="#C5C5D8" />
          </button>
        ))}
      </div>
    </div>
  );
}

export { SERVICES };
