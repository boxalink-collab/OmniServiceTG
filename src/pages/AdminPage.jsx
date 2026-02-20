import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Package, Clock, CheckCircle, Loader, XCircle, BarChart2, RefreshCw } from "lucide-react";

const STATUS_OPTIONS = ["En attente", "Confirmée", "En cours", "Terminée", "Annulée"];

const STATUS_CONFIG = {
  "En attente": { color: "#F5A623", bg: "#FEF5E7" },
  "Confirmée": { color: "#3498DB", bg: "#EBF5FB" },
  "En cours": { color: "#9B59B6", bg: "#F4ECF7" },
  "Terminée": { color: "#27AE60", bg: "#E8F8EF" },
  "Annulée": { color: "#E94560", bg: "#FDEEF1" },
};

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Simple password protection (à remplacer par Firebase Auth en production)
const ADMIN_PASS = "omni2026admin";

export default function AdminPage() {
  const [auth, setAuth] = useState(sessionStorage.getItem("omni_admin") === "1");
  const [pass, setPass] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tous");
  const [expanded, setExpanded] = useState(null);

  const login = () => {
    if (pass === ADMIN_PASS) {
      sessionStorage.setItem("omni_admin", "1");
      setAuth(true);
    } else {
      alert("Mot de passe incorrect");
    }
  };

  useEffect(() => {
    if (!auth) return;
    const q = query(collection(db, "commandes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [auth]);

  const updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, "commandes", id), { statut: newStatus });
  };

  if (!auth) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}>
        <div style={{
          background: "white",
          borderRadius: 24,
          padding: 32,
          width: "100%",
          maxWidth: 380,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 22, fontWeight: 900,
            color: "#1A1A2E",
            marginBottom: 4
          }}>Espace Admin</div>
          <div style={{ fontSize: 12, color: "#9999BB", marginBottom: 24 }}>
            OmniService TG — Accès réservé
          </div>
          <input
            type="password"
            className="input-field"
            placeholder="Mot de passe administrateur"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            style={{ marginBottom: 14 }}
          />
          <button className="btn-primary" onClick={login} style={{ width: "100%" }}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const filtered = filter === "Tous" ? orders : orders.filter(o => o.statut === filter);

  const stats = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.statut === s).length;
    return acc;
  }, {});

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F4F6FA",
      fontFamily: "'Poppins', sans-serif"
    }}>
      {/* Admin Top Bar */}
      <div style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0, zIndex: 100,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}>
        <div>
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 18, fontWeight: 900,
            color: "white"
          }}>
            OmniService <span style={{ color: "#E94560" }}>Admin</span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            Gestion des commandes
          </div>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem("omni_admin"); setAuth(false); }}
          style={{
            background: "rgba(233,69,96,0.2)",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            color: "#FF6B6B",
            fontSize: 12, fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Déconnexion
        </button>
      </div>

      <div style={{ padding: "16px", maxWidth: 900, margin: "0 auto" }}>
        {/* Stats cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 20
        }}>
          <div style={{
            background: "white",
            borderRadius: 14,
            padding: "14px",
            boxShadow: "0 2px 12px rgba(26,26,46,0.06)",
            gridColumn: "span 3",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>
              📋 Total commandes: {orders.length}
            </span>
            <span style={{
              background: "rgba(233,69,96,0.1)",
              color: "#E94560",
              fontSize: 11, fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 999
            }}>
              {stats["En attente"]} en attente
            </span>
          </div>

          {["Confirmée", "En cours", "Terminée"].map((s) => (
            <div key={s} style={{
              background: "white",
              borderRadius: 12,
              padding: 12,
              textAlign: "center",
              boxShadow: "0 2px 12px rgba(26,26,46,0.06)"
            }}>
              <div style={{
                fontSize: 22, fontWeight: 900,
                color: STATUS_CONFIG[s].color,
                fontFamily: "'Nunito', sans-serif"
              }}>{stats[s]}</div>
              <div style={{ fontSize: 10, color: "#9999BB", marginTop: 2 }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          marginBottom: 16
        }}>
          {["Tous", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: filter === s ? "#E94560" : "white",
                color: filter === s ? "white" : "#4A4A6A",
                border: "none",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(26,26,46,0.06)",
                flexShrink: 0
              }}
            >
              {s} {s !== "Tous" ? `(${stats[s] || 0})` : ""}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading && <div style={{ textAlign: "center", padding: 40, color: "#9999BB" }}>Chargement...</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((order) => {
            const status = STATUS_CONFIG[order.statut] || STATUS_CONFIG["En attente"];
            const isExpanded = expanded === order.id;
            return (
              <div key={order.id} style={{
                background: "white",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(26,26,46,0.06)"
              }}>
                {/* Header */}
                <div
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    borderBottom: isExpanded ? "1px solid #F4F6FA" : "none"
                  }}
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div style={{
                    width: 10, height: 10,
                    background: status.color,
                    borderRadius: "50%",
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>
                      {order.serviceLabel}
                    </div>
                    <div style={{ fontSize: 11, color: "#9999BB", marginTop: 2 }}>
                      📞 {order.phone || "—"} · {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <span style={{
                    background: status.bg, color: status.color,
                    fontSize: 10, fontWeight: 700,
                    padding: "4px 10px", borderRadius: 999
                  }}>{order.statut}</span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: "14px 16px" }}>
                    {/* All fields */}
                    <div style={{
                      background: "#F4F6FA",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 14
                    }}>
                      {Object.entries(order)
                        .filter(([k]) => !["id", "service", "serviceLabel", "statut", "createdAt"].includes(k))
                        .map(([key, val]) => (
                          <div key={key} style={{
                            display: "flex", gap: 8, fontSize: 12,
                            marginBottom: 6, alignItems: "flex-start"
                          }}>
                            <span style={{ color: "#9999BB", minWidth: 100, textTransform: "capitalize", flexShrink: 0 }}>
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span style={{ fontWeight: 600, color: "#1A1A2E" }}>{String(val)}</span>
                          </div>
                        ))
                      }
                    </div>

                    {/* Status change */}
                    <div>
                      <label className="input-label">Changer le statut</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s)}
                            style={{
                              background: order.statut === s ? STATUS_CONFIG[s].color : "white",
                              color: order.statut === s ? "white" : STATUS_CONFIG[s].color,
                              border: `1.5px solid ${STATUS_CONFIG[s].color}`,
                              borderRadius: 999,
                              padding: "6px 12px",
                              fontSize: 11, fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
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
