import { useState, useEffect, useRef } from "react";
import { ChevronRight, Shield, Star, Zap, Clock } from "lucide-react";

const ADS = [
  { bg:"linear-gradient(135deg,#1E6FBE,#155A9C)", emoji:"🚀", title:"Livraison Express", sub:"Vos courses livrées rapidement à Lomé", cta:"Commander" },
  { bg:"linear-gradient(135deg,#F5820A,#D96E00)", emoji:"✨", title:"Nettoyage Professionnel", sub:"Votre maison mérite le meilleur traitement", cta:"Réserver" },
  { bg:"linear-gradient(135deg,#1E6FBE,#F5820A)", emoji:"🥘", title:"Alimentation Fraîche", sub:"Tilapia, volailles, légumes livrés chez vous", cta:"Commander" },
  { bg:"linear-gradient(135deg,#155A9C,#1E6FBE)", emoji:"🍽️", title:"Service Traiteur", sub:"Plats restaurants & traiteur événementiel", cta:"Découvrir" },
];

// Services en ROUGE dans le doc = opérationnels maintenant
const SERVICES = [
  { id:"food",        icon:"🥘", label:"Alimentation",  bg:"#FFF3E0", color:"#F5820A", active:true },
  { id:"restaurant",  icon:"🍽️", label:"Restauration",  bg:"#E3F2FD", color:"#1E6FBE", active:true },
  { id:"delivery",    icon:"🚚", label:"Livraison",      bg:"#FFF3E0", color:"#F5820A", active:true },
  { id:"maintenance", icon:"🔧", label:"Maintenance",    bg:"#E3F2FD", color:"#1E6FBE", active:false, soon:"16 Mars" },
  { id:"clothes",     icon:"👗", label:"Prêt-à-porter",  bg:"#FFF3E0", color:"#F5820A", active:true },
  { id:"cleaning",    icon:"🧹", label:"Nettoyage",      bg:"#E3F2FD", color:"#1E6FBE", active:true },
  { id:"security",    icon:"🛡️", label:"Gardiennage",    bg:"#E3F2FD", color:"#1E6FBE", active:false, soon:"7 Avril" },
];

const MARQUEE = "✔ Professionnalisme  ✔ Fiabilité  ✔ Excellence  ✔ Respect  ✔ Transparence  —  OmniService TG  —  Simplifiez votre quotidien  —  Appelez, on s'en charge !      ";

export default function HomePage({ onService, onNavigate }) {
  const [cur, setCur] = useState(0);
  const [fading, setFading] = useState(false);
  const timer = useRef(null);

  const goTo = (i) => {
    clearInterval(timer.current);
    setFading(true);
    setTimeout(() => { setCur(i); setFading(false); }, 280);
    timer.current = setInterval(() => advance(), 4500);
  };

  const advance = () => {
    setFading(true);
    setTimeout(() => { setCur(p => (p + 1) % ADS.length); setFading(false); }, 280);
  };

  useEffect(() => {
    timer.current = setInterval(advance, 4500);
    return () => clearInterval(timer.current);
  }, []);

  const ad = ADS[cur];

  return (
    <div className="page-content" style={{ background:"#F4F6FA" }}>

      {/* ── Slider ── */}
      <div style={{ padding:"14px 14px 0" }}>
        <div style={{ borderRadius:20, overflow:"hidden", height:175, position:"relative" }}>
          <div style={{
            background: ad.bg, height:"100%", padding:"22px 18px",
            display:"flex", flexDirection:"column", justifyContent:"space-between",
            opacity: fading ? 0 : 1, transition:"opacity .28s ease",
          }}>
            <div>
              <div style={{ fontSize:34, marginBottom:6 }}>{ad.emoji}</div>
              <div style={{
                fontFamily:"'Nunito',sans-serif", fontSize:21, fontWeight:900,
                color:"#fff", lineHeight:1.2, textShadow:"0 2px 8px rgba(0,0,0,0.2)",
              }}>{ad.title}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", marginTop:4 }}>{ad.sub}</div>
            </div>
            <button style={{
              alignSelf:"flex-start",
              background:"rgba(255,255,255,0.22)", border:"1.5px solid rgba(255,255,255,0.5)",
              borderRadius:999, color:"#fff", fontSize:12, fontWeight:700,
              padding:"7px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:6,
              fontFamily:"'Poppins',sans-serif",
            }}>
              {ad.cta} <ChevronRight size={13} />
            </button>
          </div>
          {/* Dots */}
          <div style={{ position:"absolute", bottom:10, right:13, display:"flex", gap:5 }}>
            {ADS.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: i===cur ? 20 : 6, height:6, borderRadius:3, padding:0, border:"none",
                background: i===cur ? "#fff" : "rgba(255,255,255,0.4)",
                cursor:"pointer", transition:"all .3s",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Marquee ── */}
      <div style={{ margin:"13px 0", background:"#1E6FBE", padding:"9px 0", overflow:"hidden" }}>
        <div style={{ display:"flex", animation:"marquee 24s linear infinite", whiteSpace:"nowrap" }}>
          {[0,1,2].map(n => (
            <span key={n} style={{ color:"#fff", fontSize:11.5, fontWeight:600, paddingRight:48, flexShrink:0 }}>
              {MARQUEE}
            </span>
          ))}
        </div>
      </div>

      {/* ── Services prioritaires ── */}
      <div style={{ padding:"0 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:13 }}>
          <div>
            <div className="section-title">Services disponibles</div>
            <div className="section-sub">Choisissez ce dont vous avez besoin</div>
          </div>
          <button onClick={() => onNavigate("services")} style={{
            background:"none", border:"none", color:"#F5820A",
            fontSize:12, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", gap:3, fontFamily:"'Poppins',sans-serif",
          }}>
            Tous <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:22 }}>
          {SERVICES.map(s => (
            <button key={s.id} onClick={() => onService(s.id)} style={{
              background:"#fff", border:"none", borderRadius:14,
              padding:"11px 4px", display:"flex", flexDirection:"column",
              alignItems:"center", gap:5, cursor:"pointer",
              boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
              transition:"all .2s", position:"relative",
              opacity: s.active ? 1 : 0.78,
            }}>
              {s.soon && (
                <span style={{
                  position:"absolute", top:-6, right:-2,
                  background:"#F5820A", color:"#fff",
                  fontSize:7, fontWeight:800, padding:"2px 5px",
                  borderRadius:999, lineHeight:1.4,
                }}>{s.soon}</span>
              )}
              <div style={{
                width:42, height:42, background:s.bg, borderRadius:11,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
              }}>{s.icon}</div>
              <span style={{ fontSize:9, fontWeight:600, color:"#4A4A6A", textAlign:"center", lineHeight:1.3 }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Pourquoi nous ── */}
      <div style={{ padding:"0 14px", marginBottom:20 }}>
        <div className="section-title" style={{ marginBottom:12 }}>Pourquoi nous choisir ?</div>
        {[
          { Icon:Shield, color:"#1E6FBE", bg:"#E3F2FD", title:"Organisation structurée", desc:"Chaque intervention planifiée et encadrée." },
          { Icon:Star,   color:"#F5820A", bg:"#FFF3E0", title:"Équipe identifiable",      desc:"Personnel formé, professionnel et fiable." },
          { Icon:Zap,    color:"#1E6FBE", bg:"#E3F2FD", title:"Service moderne",          desc:"Communication claire et suivi efficace." },
          { Icon:Clock,  color:"#F5820A", bg:"#FFF3E0", title:"Engagement qualité",       desc:"Délais et standards toujours respectés." },
        ].map(({ Icon, color, bg, title, desc }, i) => (
          <div key={i} style={{
            background:"#fff", borderRadius:14, padding:"12px 14px",
            display:"flex", alignItems:"center", gap:13, marginBottom:9,
            boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              width:40, height:40, background:bg, borderRadius:10,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1A1A2E" }}>{title}</div>
              <div style={{ fontSize:11, color:"#9999BB", marginTop:2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div style={{ padding:"0 14px 8px" }}>
        <div style={{
          background:"linear-gradient(135deg,#1E6FBE 0%,#F5820A 100%)",
          borderRadius:20, padding:"22px 18px", textAlign:"center",
        }}>
          <div style={{
            fontFamily:"'Nunito',sans-serif", fontSize:19, fontWeight:900,
            color:"#fff", marginBottom:7,
          }}>Prêt à travailler avec des professionnels ?</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginBottom:16, lineHeight:1.7 }}>
            Contactez OmniService TG et découvrez une nouvelle manière de gérer vos services.
          </div>
          <a href="tel:+22800000000" style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"#fff", color:"#1E6FBE",
            borderRadius:999, padding:"11px 22px",
            fontSize:13, fontWeight:700, textDecoration:"none",
          }}>
            📞 Nous contacter
          </a>
        </div>
      </div>
    </div>
  );
}
