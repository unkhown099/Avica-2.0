import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Landing/LandingNav.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Signup from "./pages/Signup.jsx";
import SignIn from "./pages/SignIn.jsx";
import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

// Admin Imports
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminServices from "./pages/admin/AdminServices.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminInventory from "./pages/admin/AdminInventory.jsx";
import AdminAppointments from "./pages/admin/AdminAppointments.jsx";
import AdminBranches from "./pages/admin/AdminBranches.jsx";
import AdminStaff from "./pages/admin/AdminStaffAccounts.jsx";

// Branch Owner Imports
import BranchOwnerDashboard from "./pages/branch_owner/BranchOwnerDashboard.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

function Layout() {
  const location = useLocation();
  const showNavbar = location.pathname === "/";

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<CustomerDashboard />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            
              <AdminDashboard />
           
          }
        />
        <Route
          path="/admin/services"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branches"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminBranches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminStaff />
            </ProtectedRoute>
          }
        />
        {/* Branch Owner Routes */}
        <Route
          path="/branch-owner/dashboard"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BranchOwnerDashboard />
            </ProtectedRoute>
          }
        />
        {/*  */}

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  // Preload critical assets
  useEffect(() => {
    const loadContent = async () => {
      const assets = ["/assets/otokwikklogo.png", "/assets/bgpic.png"].map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
          }),
      );

      await Promise.race([
        Promise.all(assets),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);

      setContentReady(true);
    };

    loadContent();
  }, []);

  const handleLoadingComplete = () => {
    // Only hide loading screen when both animation AND content are ready
    if (contentReady) {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen onLoadingComplete={handleLoadingComplete} />

      {/* Main App */}
      <div
        className={`transition-opacity duration-500 ${isLoading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <Router>
          <Layout />
        </Router>
      </div>
    </>
  );
}

export default App;