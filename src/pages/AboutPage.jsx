import { MapPin, Phone, Mail, Globe, Star } from "lucide-react";

const VALUES = [
  { emoji: "🎯", label: "Professionnalisme", desc: "Chaque intervention est planifiée et exécutée selon des standards élevés." },
  { emoji: "🔒", label: "Fiabilité", desc: "Nos engagements sont respectés. Vous pouvez compter sur nous." },
  { emoji: "🤝", label: "Respect", desc: "Respect de nos clients, de nos équipes et de nos partenaires." },
  { emoji: "🔍", label: "Transparence", desc: "Tarifs clairs, communications honnêtes, pas de surprises." },
  { emoji: "⭐", label: "Excellence", desc: "Nous visons toujours le meilleur résultat pour vous." },
];

export default function AboutPage() {
  return (
    <div className="page" style={{ background: "#F4F6FA" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
        padding: "32px 20px 40px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 26, fontWeight: 900,
          color: "white",
          marginBottom: 8
        }}>
          OmniService <span style={{ color: "#E94560" }}>TG</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
          Appelez, on s'en charge
        </div>
        <div style={{
          display: "inline-block",
          background: "rgba(233,69,96,0.2)",
          border: "1px solid rgba(233,69,96,0.4)",
          borderRadius: 999,
          padding: "6px 16px",
          color: "#FF6B6B",
          fontSize: 11,
          fontWeight: 700,
          marginTop: 12,
          letterSpacing: "0.5px"
        }}>
          🇹🇬 Entreprise togolaise
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Mission */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: 18,
          marginBottom: 16,
          boxShadow: "0 2px 12px rgba(26,26,46,0.06)"
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A2E", marginBottom: 8, fontFamily: "'Nunito', sans-serif" }}>
            🎯 Notre Mission
          </div>
          <p style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 1.8 }}>
            Offrir aux ménages et entreprises togolais des services multisectoriels professionnels, 
            accessibles et structurés, qui simplifient leur quotidien et valorisent leur cadre de vie.
          </p>
        </div>

        {/* Vision */}
        <div style={{
          background: "linear-gradient(135deg, rgba(233,69,96,0.05), rgba(245,166,35,0.05))",
          border: "1px solid rgba(233,69,96,0.12)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 16
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A2E", marginBottom: 8, fontFamily: "'Nunito', sans-serif" }}>
            🚀 Notre Vision
          </div>
          <p style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 1.8 }}>
            Construire un Togo où chaque foyer et chaque entreprise accède à des services fiables, 
            modernes et dignes des standards internationaux. OmniService TG vise à devenir une 
            <strong style={{ color: "#E94560" }}> référence nationale</strong> dans le secteur des services professionnels.
          </p>
        </div>

        {/* Values */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Nos Valeurs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {VALUES.map((v) => (
              <div key={v.label} style={{
                background: "white",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 2px 12px rgba(26,26,46,0.05)"
              }}>
                <div style={{
                  width: 42, height: 42,
                  background: "rgba(233,69,96,0.08)",
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0
                }}>{v.emoji}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: "#9999BB", marginTop: 2, lineHeight: 1.5 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who we serve */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Pour qui ?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: "👨‍👩‍👧‍👦", title: "Particuliers", desc: "Familles, propriétaires, locataires cherchant un service organisé" },
              { icon: "🏢", title: "Entreprises & PME", desc: "Bureaux, commerces, sociétés en croissance" }
            ].map((item) => (
              <div key={item.title} style={{
                background: "white",
                borderRadius: 14,
                padding: 14,
                boxShadow: "0 2px 12px rgba(26,26,46,0.05)"
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "#9999BB", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 2px 12px rgba(26,26,46,0.06)"
        }}>
          <div className="section-title" style={{ marginBottom: 14 }}>📞 Contact</div>
          {[
            { icon: <MapPin size={16} color="#E94560" />, label: "Basé à Lomé, Togo" },
            { icon: <Phone size={16} color="#E94560" />, label: "+228 XX XX XX XX", href: "tel:+228XXXXXXXX" },
            { icon: <Mail size={16} color="#E94560" />, label: "contact@omniservicetg.com", href: "mailto:contact@omniservicetg.com" },
            { icon: <Globe size={16} color="#E94560" />, label: "www.omniservicetg.com", href: "https://www.omniservicetg.com" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0",
              borderBottom: i < 3 ? "1px solid #F4F6FA" : "none"
            }}>
              <div style={{
                width: 34, height: 34,
                background: "rgba(233,69,96,0.08)",
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>{item.icon}</div>
              {item.href ? (
                <a href={item.href} style={{ fontSize: 13, color: "#1A1A2E", textDecoration: "none", fontWeight: 500 }}>
                  {item.label}
                </a>
              ) : (
                <span style={{ fontSize: 13, color: "#4A4A6A" }}>{item.label}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
