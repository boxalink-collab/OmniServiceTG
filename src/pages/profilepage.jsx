import { useState } from "react";
import { User, Phone, Bell, Shield, HelpCircle, ChevronRight } from "lucide-react";

export default function ProfilePage() {
  const [name,  setName]  = useState(localStorage.getItem("omni_name")  || "");
  const [phone, setPhone] = useState(localStorage.getItem("omni_phone") || "");
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("omni_name",  name);
    localStorage.setItem("omni_phone", phone);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="page-content" style={{ background:"#F4F6FA" }}>
      {/* Hero */}
      <div style={{
        background:"linear-gradient(135deg,#1E6FBE,#155A9C)",
        padding:"30px 18px 50px", textAlign:"center",
      }}>
        <div style={{
          width:78, height:78, margin:"0 auto 11px",
          background:"linear-gradient(135deg,#F5820A,#D96E00)",
          borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 8px 24px rgba(245,130,10,0.4)",
        }}>
          <User size={36} color="#fff" strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:20, fontWeight:900, color:"#fff" }}>
          {name || "Mon Profil"}
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:4 }}>
          {phone || "Ajoutez vos informations"}
        </div>
      </div>

      <div style={{ padding:14, marginTop:-22 }}>
        {/* Form */}
        <div style={{
          background:"#fff", borderRadius:16, padding:16, marginBottom:14,
          boxShadow:"0 4px 20px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1A1A2E", marginBottom:14 }}>
            Mes informations
          </div>
          <div style={{ position:"relative", marginBottom:12 }}>
            <User size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9999BB" }} />
            <input type="text" className="input-field" style={{ paddingLeft:34 }}
              placeholder="Votre nom complet"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          <div style={{ position:"relative", marginBottom:16 }}>
            <Phone size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9999BB" }} />
            <input type="tel" className="input-field" style={{ paddingLeft:34 }}
              placeholder="+228 XX XX XX XX"
              value={phone} onChange={e => setPhone(e.target.value)}
            />
          </div>
          <button className="btn-blue" onClick={save}
            style={{ width:"100%", justifyContent:"center", background: saved ? "linear-gradient(135deg,#2E7D32,#1B5E20)" : undefined }}>
            {saved ? "✅ Enregistré !" : "Enregistrer"}
          </button>
        </div>

        {/* Menu */}
        <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          {[
            { Icon:Bell,       bg:"#FFF3E0", color:"#F5820A", label:"Notifications" },
            { Icon:Shield,     bg:"#E3F2FD", color:"#1E6FBE", label:"Confidentialité" },
            { Icon:HelpCircle, bg:"#FFF3E0", color:"#F5820A", label:"Aide & Support" },
          ].map(({ Icon, bg, color, label }, i, arr) => (
            <button key={label} style={{
              width:"100%", background:"#fff", border:"none",
              borderBottom: i < arr.length-1 ? "1px solid #F4F6FA" : "none",
              padding:"15px", display:"flex", alignItems:"center", gap:13, cursor:"pointer",
            }}>
              <div style={{ width:38, height:38, background:bg, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ flex:1, fontSize:14, fontWeight:600, color:"#1A1A2E", textAlign:"left" }}>{label}</span>
              <ChevronRight size={16} color="#C5C5D8" />
            </button>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:22 }}>
          <div style={{ fontSize:10.5, color:"#C5C5D8" }}>OmniService TG v1.0.0</div>
          <div style={{ fontSize:9.5, color:"#C5C5D8", marginTop:3 }}>
            Le service professionnel à la hauteur de vos ambitions
          </div>
        </div>
      </div>
    </div>
  );
}
