import { Home, Grid, ShoppingBag, Info } from "lucide-react";

const TABS = [
  { id:"home",     label:"Accueil",    Icon:Home },
  { id:"services", label:"Services",   Icon:Grid },
  { id:"orders",   label:"Commandes",  Icon:ShoppingBag },
  { id:"about",    label:"À propos",   Icon:Info },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:430,
      background:"#fff", borderTop:"1px solid #E8EAF0",
      display:"flex", height:70, zIndex:200,
      boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:3,
            border:"none", background:"transparent", cursor:"pointer",
            position:"relative", transition:"all .2s",
            WebkitTapHighlightColor:"transparent",
          }}>
            {on && (
              <span style={{
                position:"absolute", top:0, width:34, height:3,
                background:"#1E6FBE", borderRadius:"0 0 4px 4px",
              }} />
            )}
            <div style={{
              width:40, height:34, display:"flex",
              alignItems:"center", justifyContent:"center",
              borderRadius:10,
              background: on ? "rgba(30,111,190,0.1)" : "transparent",
              transition:"background .2s",
            }}>
              <Icon size={20}
                color={on ? "#1E6FBE" : "#9999BB"}
                strokeWidth={on ? 2.5 : 1.8}
              />
            </div>
            <span style={{
              fontSize:10, fontWeight: on ? 700 : 500,
              color: on ? "#1E6FBE" : "#9999BB",
            }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
