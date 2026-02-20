import { useState } from "react";
import "./index.css";
import TopNav    from "./components/topnav.jsx";
import BottomNav from "./components/bottomnav.jsx";
import HomePage     from "./pages/homepage.jsx";
import ServicesPage from "./pages/servicespage.jsx";
import OrdersPage   from "./pages/orderspage.jsx";
import AboutPage    from "./pages/aboutpage.jsx";
import ProfilePage  from "./pages/profilepage.jsx";
import AdminPage    from "./pages/adminpage.jsx";

export default function App() {
  const [tab,         setTab]         = useState("home");
  const [serviceId,   setServiceId]   = useState(null);
  const [cartCount]                   = useState(0);

  // Admin route
  if (window.location.pathname.includes("/admin")) return <AdminPage />;

  const goTab = (t) => {
    if (t !== "services") setServiceId(null);
    setTab(t);
    window.scrollTo(0, 0);
  };

  const openService = (id) => {
    setServiceId(id);
    setTab("services");
  };

  const renderPage = () => {
    switch (tab) {
      case "home":     return <HomePage     onService={openService} onNavigate={goTab} />;
      case "services": return <ServicesPage initialService={serviceId} key={serviceId} />;
      case "orders":   return <OrdersPage />;
      case "about":    return <AboutPage />;
      case "profile":  return <ProfilePage />;
      default:         return <HomePage onService={openService} onNavigate={goTab} />;
    }
  };

  return (
    <>
      <TopNav
        cartCount={cartCount}
        onCart={()    => goTab("orders")}
        onProfile={()  => goTab("profile")}
      />
      {renderPage()}
      <BottomNav active={tab} onChange={goTab} />
    </>
  );
}
