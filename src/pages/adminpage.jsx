import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

const PASS = "omni@admin2026";

const STATUS_LIST = ["En attente","Confirmée","En cours","Terminée","Annulée"];
const STATUS_CFG  = {
  "En attente": { color:"#F5820A", bg:"#FFF3E0" },
  "Confirmée":  { color:"#1E6FBE", bg:"#E3F2FD" },
  "En cours":   { color:"#7B1FA2", bg:"#F3E5F5" },
  "Terminée":   { color:"#2E7D32", bg:"#E8F5E9" },
  "Annulée":    { color:"#C62828", bg:"#FFEBEE" },
};

function fmt(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR",{ day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
}

export default function AdminPage() {
  const [authed, setAuthed]   = useState(sessionStorage.getItem("omni_adm") === "1");
  const [pass,   setPass]     = useState("");
  const [orders, setOrders]   = useState([]);
  const [filter, setFilter]   = useState("Tous");
  const [expand, setExpand]   = useState(null);
  const [loading, setLoading] = useState(true);

  const login = () => {
    if (pass === PASS) { sessionStorage.setItem("omni_adm","1"); setAuthed(true); }
    else alert("Mot de passe incorrect");
  };

  useEffect(() => {
    if (!authed) return;
    const q = query(collection(db,"commandes"), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      setLoading(false);
    });
  }, [authed]);

  const updateStatus = (id, s) => updateDoc(doc(db,"commandes",id),{ statut:s });

  /* ── Login screen ── */
  if (!authed) return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(135deg,#1E6FBE,#155A9C)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }}>
      <div style={{ background:"#fff", borderRadius:24, padding:32, width:"100%", maxWidth:360, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔐</div>
        <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:22, fontWeight:900, color:"#1A1A2E", marginBottom:4 }}>
          Espace Admin
        </div>
        <div style={{ fontSize:12, color:"#9999BB", marginBottom:22 }}>OmniService TG — Accès réservé</div>
        <input type="password" className="input-field"
          placeholder="Mot de passe administrateur"
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key==="Enter" && login()}
          style={{ marginBottom:14 }}
        />
        <button className="btn-blue" onClick={login} style={{ width:"100%", justifyContent:"center" }}>
          Se connecter
        </button>
      </div>
    </div>
  );

  const counts = STATUS_LIST.reduce((a,s) => ({ ...a, [s]: orders.filter(o=>o.statut===s).length }), {});
  const visible = filter==="Tous" ? orders : orders.filter(o=>o.statut===filter);

  return (
    <div style={{ minHeight:"100vh", background:"#F4F6FA", fontFamily:"'Poppins',sans-serif" }}>
      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg,#1E6FBE,#155A9C)",
        padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center",
        position:"sticky", top:0, zIndex:100, boxShadow:"0 4px 20px rgba(30,111,190,0.35)",
      }}>
        <div>
          <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:18, fontWeight:900, color:"#fff" }}>
            OmniService <span style={{ color:"#F5820A" }}>Admin</span>
          </div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)" }}>Gestion des commandes</div>
        </div>
        <button onClick={() => { sessionStorage.removeItem("omni_adm"); setAuthed(false); }} style={{
          background:"rgba(245,130,10,0.25)", border:"none", borderRadius:10,
          padding:"8px 14px", color:"#F5820A", fontSize:12, fontWeight:700, cursor:"pointer",
        }}>Déconnexion</button>
      </div>

      <div style={{ padding:16, maxWidth:820, margin:"0 auto" }}>
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
          <div style={{
            gridColumn:"span 3", background:"#fff", borderRadius:13, padding:"13px 16px",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
          }}>
            <span style={{ fontSize:13, fontWeight:700 }}>📋 Total : {orders.length} commandes</span>
            <span style={{
              background:"#FFF3E0", color:"#F5820A",
              fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:999,
            }}>{counts["En attente"]} en attente</span>
          </div>
          {["Confirmée","En cours","Terminée"].map(s => (
            <div key={s} style={{
              background:"#fff", borderRadius:12, padding:12, textAlign:"center",
              boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize:22, fontWeight:900, color:STATUS_CFG[s].color, fontFamily:"'Nunito',sans-serif" }}>
                {counts[s]}
              </div>
              <div style={{ fontSize:10, color:"#9999BB", marginTop:2 }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:4, marginBottom:14 }}>
          {["Tous",...STATUS_LIST].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              background: filter===s ? "#1E6FBE" : "#fff",
              color: filter===s ? "#fff" : "#4A4A6A",
              border:"none", borderRadius:999, padding:"8px 15px",
              fontSize:11.5, fontWeight:600, cursor:"pointer",
              whiteSpace:"nowrap", flexShrink:0,
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
            }}>
              {s}{s!=="Tous" ? ` (${counts[s]||0})` : ""}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign:"center", padding:40, color:"#9999BB" }}>Chargement…</div>}

        {/* Order rows */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {visible.map(o => {
            const st = STATUS_CFG[o.statut] || STATUS_CFG["En attente"];
            const open = expand === o.id;
            return (
              <div key={o.id} style={{ background:"#fff", borderRadius:13, overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                <div onClick={() => setExpand(open ? null : o.id)} style={{
                  padding:"13px 15px", display:"flex", alignItems:"center",
                  gap:12, cursor:"pointer", borderBottom: open ? "1px solid #F4F6FA" : "none",
                }}>
                  <div style={{ width:10, height:10, background:st.color, borderRadius:"50%", flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1A1A2E" }}>{o.serviceLabel}</div>
                    <div style={{ fontSize:10.5, color:"#9999BB", marginTop:2 }}>
                      📞 {o.phone||"—"} · {fmt(o.createdAt)}
                    </div>
                  </div>
                  <span style={{
                    background:st.bg, color:st.color,
                    fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:999,
                  }}>{o.statut}</span>
                  <span style={{ color:"#C5C5D8", fontSize:14 }}>{open?"▲":"▼"}</span>
                </div>

                {open && (
                  <div style={{ padding:"13px 15px" }}>
                    <div style={{ background:"#F4F6FA", borderRadius:10, padding:12, marginBottom:13 }}>
                      {Object.entries(o)
                        .filter(([k]) => !["id","service","serviceLabel","statut","createdAt"].includes(k))
                        .map(([k,v]) => (
                          <div key={k} style={{ display:"flex", gap:8, fontSize:12, marginBottom:6 }}>
                            <span style={{ color:"#9999BB", minWidth:90, textTransform:"capitalize", flexShrink:0 }}>
                              {k.replace(/_/g," ")}:
                            </span>
                            <span style={{ fontWeight:600, color:"#1A1A2E" }}>{String(v)}</span>
                          </div>
                        ))}
                    </div>
                    <label style={{ fontSize:10, fontWeight:700, color:"#9999BB", textTransform:"uppercase", letterSpacing:.5 }}>
                      Changer le statut
                    </label>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:7 }}>
                      {STATUS_LIST.map(s => (
                        <button key={s} onClick={() => updateStatus(o.id, s)} style={{
                          background: o.statut===s ? STATUS_CFG[s].color : "#fff",
                          color: o.statut===s ? "#fff" : STATUS_CFG[s].color,
                          border:`1.5px solid ${STATUS_CFG[s].color}`,
                          borderRadius:999, padding:"6px 12px",
                          fontSize:11, fontWeight:700, cursor:"pointer",
                        }}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
