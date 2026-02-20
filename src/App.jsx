import { useState } from "react";
import "./index.css";
import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import OrdersPage from "./pages/OrdersPage";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const [tab, setTab] = useState("home");
  const [serviceToOpen, setServiceToOpen] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Route admin
  if (window.location.pathname === "/admin") {
    return <AdminPage />;
  }

  const handleServiceSelect = (serviceId) => {
    setServiceToOpen(serviceId);
    setTab("services");
  };

  const handleTabChange = (newTab) => {
    if (newTab !== "services") setServiceToOpen(null);
    setTab(newTab);
  };

  const renderPage = () => {
    switch (tab) {
      case "home":
        return (
          <HomePage
            onServiceSelect={handleServiceSelect}
            onNavigate={handleTabChange}
          />
        );
      case "services":
        return (
          <ServicesPage
            key={serviceToOpen}
            initialService={serviceToOpen}
          />
        );
      case "orders":
        return <OrdersPage />;
      case "about":
        return <AboutPage />;
      case "profile":
        return <ProfilePage onNavigate={handleTabChange} />;
      default:
        return <HomePage onServiceSelect={handleServiceSelect} onNavigate={handleTabChange} />;
    }
  };

  return (
    <div>
      <TopNav
        cartCount={cartCount}
        onCartClick={() => handleTabChange("orders")}
        onProfileClick={() => handleTabChange("profile")}
      />
      {renderPage()}
      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  );
}
