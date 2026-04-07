import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/customer/CustomerNavbar.jsx";
import Footer from "../../components/customer/CustomerFooter.jsx";
import ChatbotWidget from "../../components/chatbot/ChatbotWidget.jsx";
import MessengerWidget from "../../components/common/MessengerWidget.jsx";
import { getUserFromSession } from "../../utils/getUser";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/services": "Services",
  "/bookings": "Bookings",
  "/history": "History",
  "/profile": "Profile",
  "/settings": "Settings",
  "/help": "Help",
};

function CustomerLayout({ children, title = "", subtitle = "" }) {
  const [user, setUser] = useState(() => getUserFromSession());
  const location = useLocation();

  useEffect(() => {
    const handleStorage = () => setUser(getUserFromSession());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname] ?? "Dashboard";
    document.title = `${pageTitle} | Otokwikk`;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar user={user} setUser={setUser} />

      <main className="flex-1 pt-20">{children}</main>

      <Footer />

      <ChatbotWidget />
      <MessengerWidget />
    </div>
  );
}

export default CustomerLayout;