import { useState } from "react";
import { ShoppingCart, Search, User, Bell } from "lucide-react";
import logo from "../assets/logo.png";

export default function TopNav({ cartCount = 0, onSearch, onCartClick, onProfileClick }) {
  const [searchVal, setSearchVal] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal);
  };

  return (
    <header style={{
      background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
      padding: "0 16px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 2px 20px rgba(0,0,0,0.25)"
    }}>
      {/* Brand row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 12,
        paddingBottom: 8
      }}>
        {/* Logo + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: "white",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden"
          }}>
            <img src={logo} alt="OmniService TG" style={{ width: 34, height: 34, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 17,
              color: "white",
              lineHeight: 1.1,
              letterSpacing: "-0.3px"
            }}>OmniService <span style={{ color: "#E94560" }}>TG</span></div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.3px" }}>
              Appelez, on s'en charge
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 10,
              width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.8)",
              position: "relative"
            }}
            onClick={onCartClick}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                background: "#E94560",
                color: "white", fontSize: 9, fontWeight: 700,
                width: 16, height: 16,
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{cartCount}</span>
            )}
          </button>

          <button
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 10,
              width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.8)"
            }}
            onClick={onProfileClick}
          >
            <User size={18} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ paddingBottom: 12 }}>
        <form onSubmit={handleSearch} style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute", left: 13, top: "50%",
              transform: "translateY(-50%)",
              color: "#9999BB"
            }}
          />
          <input
            type="text"
            placeholder="Rechercher un service..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px 10px 38px",
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              color: "white",
              fontSize: 13,
              outline: "none",
              fontFamily: "'Poppins', sans-serif",
              backdropFilter: "blur(10px)"
            }}
          />
        </form>
      </div>
    </header>
  );
}
