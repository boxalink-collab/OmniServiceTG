import { useState, useEffect, useRef } from "react";
import { ChevronRight, Star, Zap, Clock, Shield } from "lucide-react";

// Slides publicitaires
const ADS = [
  {
    id: 1,
    title: "Livraison Express",
    subtitle: "Vos courses livrées en moins d'une heure",
    cta: "Commander maintenant",
    bg: "linear-gradient(135deg, #E94560 0%, #c73652 100%)",
    emoji: "🚀"
  },
  {
    id: 2,
    title: "Nettoyage Professionnel",
    subtitle: "Votre maison mérite le meilleur traitement",
    cta: "Réserver",
    bg: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
    emoji: "✨"
  },
  {
    id: 3,
    title: "Maintenance Technique",
    subtitle: "Électricité, plomberie, électroménager... on s'en charge",
    cta: "Dépanner maintenant",
    bg: "linear-gradient(135deg, #F5A623 0%, #e8950a 100%)",
    emoji: "🔧",
    note: "Dès le 16 Mars"
  },
  {
    id: 4,
    title: "Alimentation Fraîche",
    subtitle: "Tilapia, volailles, légumes frais livrés chez vous",
    cta: "Commander",
    bg: "linear-gradient(135deg, #27AE60 0%, #1e8449 100%)",
    emoji: "🥗"
  }
];

// Services prioritaires (opérationnels maintenant)
const PRIORITY_SERVICES = [
  { id: "food", icon: "🥘", label: "Alimentation", color: "#27AE60", bg: "#E8F8EF" },
  { id: "delivery", icon: "🚚", label: "Livraison", color: "#E94560", bg: "#FDEEF1" },
  { id: "restaurant", icon: "🍽️", label: "Restauration", color: "#F5A623", bg: "#FEF5E7" },
  { id: "cleaning", icon: "🧹", label: "Nettoyage", color: "#3498DB", bg: "#EBF5FB" },
  { id: "clothes", icon: "👗", label: "Prêt-à-porter", color: "#9B59B6", bg: "#F4ECF7" },
  { id: "maintenance", icon: "🔧", label: "Maintenance", color: "#E67E22", bg: "#FEF0E6", comingSoon: "16 Mars" },
  { id: "security", icon: "🛡️", label: "Gardiennage", color: "#1A1A2E", bg: "#EAEAF2", comingSoon: "7 Avril" },
];

const BANNER_TEXT = "✔ Professionnalisme  ✔ Fiabilité  ✔ Excellence  ✔ Transparence  ✔ Respect  —  ";

export default function HomePage({ onServiceSelect, onNavigate }) {
  const [currentAd, setCurrentAd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);

  // Auto-slide
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentAd((prev) => (prev + 1) % ADS.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const goToAd = (idx) => {
    clearInterval(intervalRef.current);
    setCurrentAd(idx);
    intervalRef.current = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ADS.length);
    }, 4000);
  };

  const ad = ADS[currentAd];

  return (
    <div className="page" style={{ padding: 0, background: "#F4F6FA" }}>
      {/* === Slider Publicitaire === */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          height: 180
        }}>
          <div style={{
            background: ad.bg,
            height: "100%",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: isTransitioning ? 0 : 1,
            transition: "opacity 0.3s ease"
          }}>
            <div>
              <div style={{ fontSize: 36, marginBottom: 6 }}>{ad.emoji}</div>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 20, fontWeight: 900,
                color: "white",
                lineHeight: 1.2,
                textShadow: "0 2px 8px rgba(0,0,0,0.2)"
              }}>{ad.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
                {ad.subtitle}
              </div>
              {ad.note && (
                <span style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 10px",
                  borderRadius: 999,
                  marginTop: 6
                }}>{ad.note}</span>
              )}
            </div>
            <button style={{
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.2)",
              border: "1.5px solid rgba(255,255,255,0.5)",
              borderRadius: 999,
              color: "white",
              fontSize: 12, fontWeight: 700,
              padding: "7px 16px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", gap: 6
            }}>
              {ad.cta} <ChevronRight size={14} />
            </button>
          </div>

          {/* Dots */}
          <div style={{
            position: "absolute", bottom: 10, right: 14,
            display: "flex", gap: 5
          }}>
            {ADS.map((_, i) => (
              <button
                key={i}
                onClick={() => goToAd(i)}
                style={{
                  width: i === currentAd ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === currentAd ? "white" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  padding: 0
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* === Bande défilante d'accroche === */}
      <div style={{
        margin: "14px 0",
        background: "#1A1A2E",
        padding: "10px 0",
        overflow: "hidden"
      }}>
        <div style={{
          display: "flex",
          animation: "marquee 20s linear infinite",
          whiteSpace: "nowrap"
        }}>
          {[1, 2, 3].map((n) => (
            <span key={n} style={{
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.3px",
              paddingRight: 40
            }}>
              {BANNER_TEXT}
              <span style={{ color: "#E94560" }}>OmniService TG</span>
              &nbsp;&nbsp;—&nbsp;&nbsp;Simplifiez votre quotidien. Appelez, on s'en charge !&nbsp;&nbsp;
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-33.33%); }
          }
        `}</style>
      </div>

      {/* === Services Prioritaires === */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div className="section-title">Services disponibles</div>
            <div className="section-sub">Choisissez ce dont vous avez besoin</div>
          </div>
          <button
            onClick={() => onNavigate("services")}
            style={{
              background: "none", border: "none",
              color: "#E94560", fontSize: 12, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 3
            }}
          >
            Tous <ChevronRight size={14} />
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 24
        }}>
          {PRIORITY_SERVICES.map((svc) => (
            <button
              key={svc.id}
              onClick={() => !svc.comingSoon && onServiceSelect(svc.id)}
              style={{
                background: "white",
                border: "none",
                borderRadius: 14,
                padding: "12px 4px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: svc.comingSoon ? "default" : "pointer",
                boxShadow: "0 2px 12px rgba(26,26,46,0.07)",
                transition: "all 0.2s",
                opacity: svc.comingSoon ? 0.75 : 1,
                position: "relative"
              }}
            >
              {svc.comingSoon && (
                <span style={{
                  position: "absolute",
                  top: -6, right: -2,
                  background: "#F5A623",
                  color: "white",
                  fontSize: 7, fontWeight: 800,
                  padding: "2px 5px",
                  borderRadius: 999,
                  lineHeight: 1.4
                }}>{svc.comingSoon}</span>
              )}
              <div style={{
                width: 42, height: 42,
                background: svc.bg,
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20
              }}>
                {svc.icon}
              </div>
              <span style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: "#4A4A6A",
                textAlign: "center",
                lineHeight: 1.3
              }}>{svc.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* === Pourquoi nous choisir === */}
      <div style={{ padding: "0 16px", marginBottom: 24 }}>
        <div className="section-title">Pourquoi nous choisir ?</div>
        <div className="section-sub">Ce qui nous distingue</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: <Shield size={18} color="#E94560" />, title: "Organisation structurée", desc: "Chaque intervention est planifiée et encadrée." },
            { icon: <Star size={18} color="#F5A623" />, title: "Équipe identifiable", desc: "Personnel formé, professionnel et de confiance." },
            { icon: <Zap size={18} color="#27AE60" />, title: "Service moderne", desc: "Communication claire et suivi efficace." },
            { icon: <Clock size={18} color="#3498DB" />, title: "Engagement qualité", desc: "Nous respectons nos délais et nos standards." },
          ].map((item, i) => (
            <div key={i} style={{
              background: "white",
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 2px 12px rgba(26,26,46,0.06)"
            }}>
              <div style={{
                width: 40, height: 40,
                background: "#F4F6FA",
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{item.title}</div>
                <div style={{ fontSize: 11.5, color: "#9999BB", marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === CTA Final === */}
      <div style={{ padding: "0 16px 8px" }}>
        <div style={{
          background: "linear-gradient(135deg, #1A1A2E 0%, #E94560 100%)",
          borderRadius: 20,
          padding: "24px 20px",
          textAlign: "center"
        }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 20, fontWeight: 900,
            color: "white",
            marginBottom: 8
          }}>
            Prêt à travailler avec des professionnels ?
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 18, lineHeight: 1.6 }}>
            Contactez OmniService TG et découvrez une nouvelle manière de gérer vos services.
          </div>
          <a href="tel:+22800000000" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "white",
            color: "#E94560",
            borderRadius: 999,
            padding: "12px 24px",
            fontSize: 14, fontWeight: 700,
            textDecoration: "none"
          }}>
            📞 Nous contacter
          </a>
        </div>
      </div>
    </div>
  );
}
