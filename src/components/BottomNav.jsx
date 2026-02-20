import { Home, Grid, ShoppingBag, Info } from "lucide-react";

const tabs = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "services", label: "Services", icon: Grid },
  { id: "orders", label: "Commandes", icon: ShoppingBag },
  { id: "about", label: "À propos", icon: Info },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      background: "white",
      borderTop: "1px solid #E8EAF0",
      display: "flex",
      height: 70,
      zIndex: 200,
      boxShadow: "0 -4px 24px rgba(26,26,46,0.08)"
    }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s"
            }}
          >
            {isActive && (
              <span style={{
                position: "absolute",
                top: 0,
                width: 36,
                height: 3,
                background: "#E94560",
                borderRadius: "0 0 4px 4px"
              }} />
            )}
            <div style={{
              width: 40, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 10,
              background: isActive ? "rgba(233,69,96,0.1)" : "transparent",
              transition: "background 0.2s"
            }}>
              <Icon
                size={20}
                color={isActive ? "#E94560" : "#9999BB"}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#E94560" : "#9999BB",
              letterSpacing: "-0.1px"
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
