import { useState } from "react";
import { User, Phone, Bell, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";

export default function ProfilePage({ onNavigate }) {
  const [name, setName] = useState(localStorage.getItem("omni_name") || "");
  const [phone, setPhone] = useState(localStorage.getItem("omni_phone") || "");
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("omni_name", name);
    localStorage.setItem("omni_phone", phone);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page" style={{ background: "#F4F6FA" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
        padding: "32px 20px 48px",
        textAlign: "center"
      }}>
        <div style={{
          width: 80, height: 80,
          background: "linear-gradient(135deg, #E94560, #c73652)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
          boxShadow: "0 8px 24px rgba(233,69,96,0.4)"
        }}>
          <User size={36} color="white" strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 900, color: "white" }}>
          {name || "Mon Profil"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          {phone || "Ajoutez vos informations"}
        </div>
      </div>

      <div style={{ padding: "16px", marginTop: -20 }}>
        {/* Profile form */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: 18,
          marginBottom: 16,
          boxShadow: "0 4px 20px rgba(26,26,46,0.1)"
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 16 }}>
            Mes informations
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Nom complet</label>
            <div style={{ position: "relative" }}>
              <User size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9999BB" }} />
              <input
                type="text"
                className="input-field"
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="input-label">Téléphone</label>
            <div style={{ position: "relative" }}>
              <Phone size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9999BB" }} />
              <input
                type="tel"
                className="input-field"
                placeholder="+228 XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={save}
            style={{ width: "100%" }}
          >
            {saved ? "✅ Enregistré !" : "Enregistrer"}
          </button>
        </div>

        {/* Menu options */}
        <div style={{
          background: "white",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(26,26,46,0.06)"
        }}>
          {[
            { icon: <Bell size={18} color="#F5A623" />, label: "Notifications", bg: "#FEF5E7" },
            { icon: <Shield size={18} color="#3498DB" />, label: "Confidentialité", bg: "#EBF5FB" },
            { icon: <HelpCircle size={18} color="#27AE60" />, label: "Aide & Support", bg: "#E8F8EF" },
          ].map((item, i) => (
            <button key={i} style={{
              width: "100%",
              background: "white",
              border: "none",
              borderBottom: i < 2 ? "1px solid #F4F6FA" : "none",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
              textAlign: "left"
            }}>
              <div style={{
                width: 38, height: 38,
                background: item.bg,
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>{item.icon}</div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{item.label}</span>
              <ChevronRight size={16} color="#C5C5D8" />
            </button>
          ))}
        </div>

        {/* App info */}
        <div style={{ textAlign: "center", marginTop: 24, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#C5C5D8" }}>OmniService TG v1.0</div>
          <div style={{ fontSize: 10, color: "#C5C5D8", marginTop: 4 }}>
            Le service professionnel à la hauteur de vos ambitions
          </div>
        </div>
      </div>
    </div>
  );
}
