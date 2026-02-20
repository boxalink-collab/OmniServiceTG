import { useState } from "react";
import { ShoppingCart, User, Search } from "lucide-react";
import logo from "../assets/logo.png";

export default function TopNav({ cartCount = 0, onCart, onProfile }) {
  const [q, setQ] = useState("");

  return (
    <header style={{
      background: "linear-gradient(135deg, #1E6FBE 0%, #155A9C 100%)",
      padding: "0 14px",
      position: "sticky", top: 0, zIndex: 200,
      boxShadow: "0 3px 20px rgba(30,111,190,0.35)",
    }}>
      {/* Brand row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:12, paddingBottom:8 }}>
        {/* Logo + name */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:40, height:40, background:"#fff",
            borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
            overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
          }}>
            <img src={logo} alt="OmniService TG" style={{ width:36, height:36, objectFit:"contain" }} />
          </div>
          <div>
            <div style={{
              fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:18,
              color:"#fff", lineHeight:1.1, letterSpacing:"-0.3px",
            }}>
              OmniService <span style={{ color:"#F5820A" }}>TG</span>
            </div>
            <div style={{ fontSize:9.5, color:"rgba(255,255,255,0.6)", letterSpacing:".3px" }}>
              Appelez, on s'en charge
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:7 }}>
          <button onClick={onCart} style={{
            background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10,
            width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"#fff", position:"relative", transition:"background .2s",
          }}>
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span style={{
                position:"absolute", top:-4, right:-4,
                background:"#F5820A", color:"#fff",
                fontSize:9, fontWeight:700,
                width:16, height:16, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>{cartCount}</span>
            )}
          </button>
          <button onClick={onProfile} style={{
            background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10,
            width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"#fff", transition:"background .2s",
          }}>
            <User size={18} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position:"relative", paddingBottom:12 }}>
        <Search size={15} style={{
          position:"absolute", left:12, top:"50%", transform:"translateY(-60%)",
          color:"rgba(255,255,255,0.5)",
        }} />
        <input
          type="text"
          placeholder="Rechercher un service..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{
            width:"100%", padding:"9px 14px 9px 36px",
            background:"rgba(255,255,255,0.12)",
            border:"1.5px solid rgba(255,255,255,0.2)",
            borderRadius:12, color:"#fff", fontSize:12,
            outline:"none", fontFamily:"'Poppins',sans-serif",
          }}
        />
      </div>
    </header>
  );
}
