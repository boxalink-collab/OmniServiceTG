import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { Search } from "lucide-react";

const STATUS = {
  "En attente": { color:"#F5820A", bg:"#FFF3E0" },
  "Confirmée":  { color:"#1E6FBE", bg:"#E3F2FD" },
  "En cours":   { color:"#7B1FA2", bg:"#F3E5F5" },
  "Terminée":   { color:"#2E7D32", bg:"#E8F5E9" },
  "Annulée":    { color:"#C62828", bg:"#FFEBEE" },
};
const STEPS = ["En attente","Confirmée","En cours","Terminée"];

function fmt(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR",{ day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
}

export default function OrdersPage() {
  const [phone, setPhone]   = useState("");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search) { setOrders([]); return; }
    setLoading(true);
    const q = query(
      collection(db, "commandes"),
      where("phone","==", search),
      orderBy("createdAt","desc")
    );
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [search]);

  return (
    <div className="page-content" style={{ padding:14, background:"#F4F6FA" }}>
      <div style={{ marginBottom:16 }}>
        <div className="section-title">Mes Commandes</div>
        <div className="section-sub">Suivez l'état de vos demandes</div>
      </div>

      {/* Search */}
      <div style={{
        background:"#fff", borderRadius:14, padding:15,
        boxShadow:"0 2px 10px rgba(0,0,0,0.06)", marginBottom:18,
      }}>
        <label className="input-label">Votre numéro de téléphone</label>
        <div style={{ display:"flex", gap:9 }}>
          <input type="tel" className="input-field" style={{ flex:1 }}
            placeholder="+228 XX XX XX XX"
            value={phone} onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setSearch(phone)}
          />
          <button className="btn-blue" onClick={() => setSearch(phone)}
            style={{ padding:"12px 15px", borderRadius:12, flexShrink:0 }}>
            <Search size={16} />
          </button>
        </div>
        <div style={{ fontSize:10.5, color:"#9999BB", marginTop:7 }}>
          Numéro utilisé lors de votre commande
        </div>
      </div>

      {/* States */}
      {!search && (
        <div style={{ textAlign:"center", paddingTop:40 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>📦</div>
          <div style={{ fontSize:13, color:"#9999BB" }}>Entrez votre numéro pour voir vos commandes</div>
        </div>
      )}
      {search && loading && <div style={{ textAlign:"center", color:"#9999BB", padding:40 }}>Chargement…</div>}
      {search && !loading && orders.length === 0 && (
        <div style={{ textAlign:"center", paddingTop:40 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:13, color:"#9999BB" }}>Aucune commande pour ce numéro</div>
        </div>
      )}

      {/* Order cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {orders.map(o => {
          const st = STATUS[o.statut] || STATUS["En attente"];
          const idx = STEPS.indexOf(o.statut);
          return (
            <div key={o.id} style={{
              background:"#fff", borderRadius:16, padding:15,
              boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:11 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1A1A2E" }}>{o.serviceLabel}</div>
                  <div style={{ fontSize:10.5, color:"#9999BB", marginTop:2 }}>{fmt(o.createdAt)}</div>
                </div>
                <span style={{
                  background:st.bg, color:st.color,
                  fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:999,
                }}>{o.statut}</span>
              </div>

              <div style={{ background:"#F4F6FA", borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
                {Object.entries(o)
                  .filter(([k]) => !["id","service","serviceLabel","statut","createdAt"].includes(k))
                  .slice(0, 3)
                  .map(([k,v]) => (
                    <div key={k} style={{ display:"flex", gap:8, fontSize:11, marginBottom:4 }}>
                      <span style={{ color:"#9999BB", minWidth:75, textTransform:"capitalize" }}>{k.replace(/_/g," ")}:</span>
                      <span style={{ fontWeight:600, color:"#1A1A2E" }}>{String(v).slice(0,55)}</span>
                    </div>
                  ))}
              </div>

              {/* Progress bar */}
              <div style={{ display:"flex", alignItems:"center" }}>
                {STEPS.map((s, i) => (
                  <div key={s} style={{ display:"flex", alignItems:"center", flex: i<3 ? 1 : 0 }}>
                    <div style={{
                      width:20, height:20, borderRadius:"50%", flexShrink:0,
                      background: i<=idx ? "#1E6FBE" : "#E8EAF0",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      border: i===idx ? "2px solid #155A9C" : "none",
                    }}>
                      {i<=idx && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
                    </div>
                    {i<3 && <div style={{ flex:1, height:2, background: i<idx ? "#1E6FBE" : "#E8EAF0" }} />}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                {["Reçue","Confirmée","En cours","Terminée"].map(s => (
                  <span key={s} style={{ fontSize:8, color:"#9999BB", width:44, textAlign:"center" }}>{s}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
