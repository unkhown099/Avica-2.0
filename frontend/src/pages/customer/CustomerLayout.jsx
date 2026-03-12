import React, { useState, useEffect } from "react";
import Navbar from "../../components/customer/CustomerNavbar.jsx";
import Footer from "../../components/customer/CustomerFooter.jsx";
import { getUserFromSession } from "../../utils/getUser";

function CustomerLayout({ children, title = "", subtitle = "" }) {
  const [user, setUser] = useState(() => getUserFromSession());

  useEffect(() => {
    const handleStorage = () => setUser(getUserFromSession());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar user={user} setUser={setUser} />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default CustomerLayout;