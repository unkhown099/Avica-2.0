import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Landing/LandingNav.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Signup from "./pages/Signup.jsx";
import SignIn from "./pages/SignIn.jsx";
import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";

// Admin Imports below (if any) can be added here
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminServices from "./pages/admin/AdminServices.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminAI from "./pages/admin/AdminAI.jsx";
import AdminInventory from "./pages/admin/AdminInventory.jsx";
import AdminAppointments from "./pages/admin/AdminAppointments.jsx";
import AdminBranches from "./pages/admin/AdminBranches.jsx";
import AdminReports from "./pages/admin/AdminReports.jsx";

function Layout() {
  const location = useLocation();

  // show navbar only on landing page
  const showNavbar = location.pathname === "/";

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        {/* Customer Routes */}
        <Route path="/dashboard" element={<CustomerDashboard />} />
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/ai-recognition" element={<AdminAI />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/branches" element={<AdminBranches />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        {/* <Route path="*" element={<LandingPage />} /> */}
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
