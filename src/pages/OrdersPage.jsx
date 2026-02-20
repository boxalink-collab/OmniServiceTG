import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { Package, Clock, CheckCircle, XCircle, Loader } from "lucide-react";

const STATUS_CONFIG = {
  "En attente": { color: "#F5A623", bg: "#FEF5E7", icon: <Clock size={14} />, label: "En attente" },
  "Confirmée": { color: "#3498DB", bg: "#EBF5FB", icon: <CheckCircle size={14} />, label: "Confirmée" },
  "En cours": { color: "#9B59B6", bg: "#F4ECF7", icon: <Loader size={14} />, label: "En cours" },
  "Terminée": { color: "#27AE60", bg: "#E8F8EF", icon: <CheckCircle size={14} />, label: "Terminée" },
  "Annulée": { color: "#E94560", bg: "#FDEEF1", icon: <XCircle size={14} />, label: "Annulée" },
};

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OrdersPage({ userPhone = "" }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState(userPhone);
  const [searchPhone, setSearchPhone] = useState("");

  useEffect(() => {
    if (!searchPhone) { setOrders([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, "commandes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = all.filter(o => o.phone === searchPhone);
      setOrders(filtered);
      setLoading(false);
    });
    return unsub;
  }, [searchPhone]);

  return (
    <div className="page" style={{ padding: "16px", background: "#F4F6FA" }}>
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Mes Commandes</div>
        <div className="section-sub">Suivez l'état de vos demandes</div>
      </div>

      {/* Phone search */}
      <div style={{
        background: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        boxShadow: "0 2px 12px rgba(26,26,46,0.06)"
      }}>
        <label className="input-label">Votre numéro de téléphone</label>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="tel"
            className="input-field"
            placeholder="+228 XX XX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={() => setSearchPhone(phone)}
            style={{ padding: "12px 16px", borderRadius: 12, flexShrink: 0 }}
          >
            Rechercher
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#9999BB", marginTop: 8 }}>
          Entrez le numéro utilisé lors de votre commande
        </div>
      </div>

      {/* Orders list */}
      {!searchPhone && (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ color: "#9999BB", fontSize: 14 }}>
            Entrez votre numéro pour consulter vos commandes
          </div>
        </div>
      )}

      {searchPhone && loading && (
        <div style={{ textAlign: "center", paddingTop: 40, color: "#9999BB" }}>
          Chargement...
        </div>
      )}

      {searchPhone && !loading && orders.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ color: "#9999BB", fontSize: 14 }}>
            Aucune commande trouvée pour ce numéro
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map((order) => {
          const status = STATUS_CONFIG[order.statut] || STATUS_CONFIG["En attente"];
          return (
            <div key={order.id} style={{
              background: "white",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 2px 12px rgba(26,26,46,0.06)"
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>
                    {order.serviceLabel}
                  </div>
                  <div style={{ fontSize: 11, color: "#9999BB", marginTop: 2 }}>
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: status.bg, color: status.color,
                  fontSize: 11, fontWeight: 700,
                  padding: "4px 10px", borderRadius: 999
                }}>
                  {status.icon} {status.label}
                </span>
              </div>

              {/* Details */}
              <div style={{
                background: "#F4F6FA",
                borderRadius: 10,
                padding: "10px 12px"
              }}>
                {Object.entries(order)
                  .filter(([k]) => !["id", "service", "serviceLabel", "statut", "createdAt"].includes(k))
                  .slice(0, 3)
                  .map(([key, val]) => (
                    <div key={key} style={{
                      display: "flex", gap: 8, fontSize: 11.5,
                      marginBottom: 4, color: "#4A4A6A"
                    }}>
                      <span style={{ color: "#9999BB", minWidth: 80, textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span style={{ fontWeight: 600 }}>{String(val).slice(0, 60)}</span>
                    </div>
                  ))
                }
              </div>

              {/* Progress tracker */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {["En attente", "Confirmée", "En cours", "Terminée"].map((s, i) => {
                    const statuses = ["En attente", "Confirmée", "En cours", "Terminée"];
                    const currentIdx = statuses.indexOf(order.statut);
                    const isActive = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: isActive ? "#E94560" : "#E8EAF0",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          transition: "background 0.3s",
                          border: isCurrent ? "2px solid #c73652" : "none"
                        }}>
                          {isActive && <span style={{ color: "white", fontSize: 9, fontWeight: 700 }}>✓</span>}
                        </div>
                        {i < 3 && (
                          <div style={{
                            flex: 1, height: 2,
                            background: i < currentIdx ? "#E94560" : "#E8EAF0",
                            transition: "background 0.3s"
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {["Reçue", "Confirmée", "En cours", "Terminée"].map((s) => (
                    <span key={s} style={{ fontSize: 8.5, color: "#9999BB", width: 44, textAlign: "center" }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
