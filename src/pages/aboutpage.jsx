import { MapPin, Phone, Mail, Globe } from "lucide-react";

const VALUES = [
  { e:"🎯", n:"Professionnalisme", d:"Chaque intervention exécutée selon des standards élevés." },
  { e:"🔒", n:"Fiabilité",         d:"Nos engagements sont respectés. Comptez sur nous." },
  { e:"🤝", n:"Respect",           d:"De nos clients, équipes et partenaires." },
  { e:"🔍", n:"Transparence",      d:"Tarifs clairs, communications honnêtes, pas de surprises." },
  { e:"⭐", n:"Excellence",         d:"Toujours le meilleur résultat pour vous." },
];

export default function AboutPage() {
  return (
    <div className="page-content" style={{ background:"#F4F6FA" }}>
      {/* Hero */}
      <div style={{
        background:"linear-gradient(135deg,#1E6FBE 0%,#155A9C 100%)",
        padding:"30px 18px 38px", textAlign:"center",
      }}>
        <div style={{ fontSize:48, marginBottom:10 }}>🌐</div>
        <div style={{
          fontFamily:"'Nunito',sans-serif", fontSize:26, fontWeight:900, color:"#fff",
        }}>OmniService <span style={{ color:"#F5820A" }}>TG</span></div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:4 }}>
          Appelez, on s'en charge
        </div>
        <div style={{
          display:"inline-block", marginTop:12,
          background:"rgba(245,130,10,0.25)", border:"1px solid rgba(245,130,10,0.5)",
          borderRadius:999, padding:"5px 14px", color:"#FFB84D",
          fontSize:11, fontWeight:700,
        }}>🇹🇬 Entreprise togolaise</div>
      </div>

      <div style={{ padding:"18px 14px" }}>
        {/* Mission */}
        <div style={{
          background:"#fff", borderRadius:14, padding:16,
          boxShadow:"0 2px 10px rgba(0,0,0,0.06)", marginBottom:13,
        }}>
          <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:800, color:"#1A1A2E", marginBottom:7 }}>
            🎯 Notre Mission
          </div>
          <p style={{ fontSize:13, color:"#4A4A6A", lineHeight:1.8 }}>
            Offrir aux ménages et entreprises togolais des services multisectoriels professionnels,
            accessibles et structurés, qui simplifient leur quotidien et valorisent leur cadre de vie.
          </p>
        </div>

        {/* Vision */}
        <div style={{
          background:"linear-gradient(135deg,rgba(30,111,190,0.05),rgba(245,130,10,0.05))",
          border:"1px solid rgba(30,111,190,0.12)",
          borderRadius:14, padding:16, marginBottom:13,
        }}>
          <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:800, color:"#1A1A2E", marginBottom:7 }}>
            🚀 Notre Vision
          </div>
          <p style={{ fontSize:13, color:"#4A4A6A", lineHeight:1.8 }}>
            Construire un Togo où chaque foyer et chaque entreprise accède à des services fiables,
            modernes et dignes des standards internationaux. OmniService TG vise à devenir une{" "}
            <strong style={{ color:"#1E6FBE" }}>référence nationale</strong> dans le secteur des services professionnels.
          </p>
        </div>

        {/* Values */}
        <div style={{ marginBottom:13 }}>
          <div className="section-title" style={{ marginBottom:11 }}>Nos Valeurs</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {VALUES.map(v => (
              <div key={v.n} style={{
                background:"#fff", borderRadius:13, padding:"12px 14px",
                display:"flex", alignItems:"center", gap:13,
                boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <div style={{
                  width:40, height:40, borderRadius:10, flexShrink:0,
                  background:"rgba(30,111,190,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
                }}>{v.e}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1A1A2E" }}>{v.n}</div>
                  <div style={{ fontSize:11, color:"#9999BB", marginTop:2 }}>{v.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For whom */}
        <div style={{ marginBottom:13 }}>
          <div className="section-title" style={{ marginBottom:11 }}>Pour qui ?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
            {[
              { e:"👨‍👩‍👧‍👦", t:"Particuliers",    d:"Familles, propriétaires, locataires cherchant un service organisé et fiable." },
              { e:"🏢",       t:"Entreprises & PME", d:"Bureaux, commerces, sociétés en croissance." },
            ].map(item => (
              <div key={item.t} style={{
                background:"#fff", borderRadius:13, padding:14,
                boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
              }}>
                <div style={{ fontSize:28, marginBottom:7 }}>{item.e}</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#1A1A2E", marginBottom:4 }}>{item.t}</div>
                <div style={{ fontSize:10.5, color:"#9999BB", lineHeight:1.5 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ background:"#fff", borderRadius:14, padding:16, boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          <div className="section-title" style={{ marginBottom:13 }}>📞 Contact</div>
          {[
            { Icon:MapPin, text:"Basé à Lomé, Togo" },
            { Icon:Phone,  text:"+228 XX XX XX XX",          href:"tel:+228XXXXXXXX" },
            { Icon:Mail,   text:"contact@omniservicetg.com", href:"mailto:contact@omniservicetg.com" },
            { Icon:Globe,  text:"www.omniservicetg.com",     href:"https://www.omniservicetg.com" },
          ].map((item, i, arr) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:12, padding:"10px 0",
              borderBottom: i < arr.length-1 ? "1px solid #F4F6FA" : "none",
            }}>
              <div style={{
                width:34, height:34, background:"rgba(30,111,190,0.08)",
                borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <item.Icon size={16} color="#1E6FBE" />
              </div>
              {item.href
                ? <a href={item.href} style={{ fontSize:13, color:"#1A1A2E", textDecoration:"none", fontWeight:500 }}>{item.text}</a>
                : <span style={{ fontSize:13, color:"#4A4A6A" }}>{item.text}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
