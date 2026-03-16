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
import LoadingScreen from "./components/LoadingScreen.jsx";

// Customer Imports
import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";
import CustomerServices from "./pages/customer/CustomerServices.jsx";
import CustomerBooking from "./pages/customer/CustomerBooking.jsx";
import CustomerHistory from "./pages/customer/CustomerHistory.jsx";
import CustomerProfile from "./pages/customer/CustomerProfile.jsx";
import CustomerSettings from "./pages/customer/CustomerSettings.jsx";
import HelpPage from "./pages/customer/CustomerHelp.jsx";

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
import BranchOwnerAppointments from "./pages/branch_owner/BranchOwnerAppointments.jsx";
import BranchOwnerServices from "./pages/branch_owner/BranchOwnerServices.jsx";
import BranchOwnerInventory from "./pages/branch_owner/BranchOwnerInventory.jsx";
import BranchOwnerAccountsManagement from "./pages/branch_owner/BranchOwnerAccountsManagement.jsx";
import BranchOwnerBranches from "./pages/branch_owner/BranchOwnerBranches.jsx";

// Manager Imports
import ManagerDashboard from "./pages/manager/ManagerDashboard.jsx";
import ManagerAppointments from "./pages/manager/ManagerAppointments.jsx";
import ManagerInventory from "./pages/manager/ManagerInventory.jsx";
import ManagerAccountManagement from "./pages/manager/ManagerAccountManagement.jsx";
import ManagerHistory from "./pages/manager/ManagerHistory.jsx";
import ManagerCustomerManagement from "./pages/manager/ManagerCustomerManagement.jsx";

// Inventory Imports
import InventoryDashboard from "./pages/inventory/InventoryDashboard.jsx";
import InventoryAlerts from "./pages/inventory/InventoryAlerts.jsx";
import InventoryBranchDistribution from "./pages/inventory/InventoryBranchDistribution.jsx";
import InventoryMovementLog from "./pages/inventory/InventoryMovementLog.jsx";
import InventoryStockOverview from "./pages/inventory/InventoryStockOverview.jsx";

// Staff Imports
import StaffPOS from "./pages/staff/StaffPOS.jsx";
import StaffAppointment from "./pages/staff/StaffAppointment.jsx";
import StaffVehicleRecognition from "./pages/staff/StaffVehicleRecognition.jsx";
import StaffQueue from "./pages/staff/StaffQueue.jsx";

// Mechanic Imports
import MechanicDashboard from "./pages/employee/MechanicDashboard.jsx";
import MechanicSchedule from "./pages/employee/MechanicSchedule.jsx";
import MechanicActiveJobs from "./pages/employee/MechanicActiveJobs.jsx";
import MechanicJobHistory from "./pages/employee/MechanicJobHistory.jsx";
import MechanicInventoryRequest from "./pages/employee/MechanicInventoryRequest.jsx";

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
        // Customer Routes
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <HelpPage />
            </ProtectedRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
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
        <Route
          path="/branch-owner/appointments"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BranchOwnerAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branch-owner/services"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BranchOwnerServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branch-owner/inventory"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BranchOwnerInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branch-owner/accounts"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BranchOwnerAccountsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branch-owner/branches"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BranchOwnerBranches />
            </ProtectedRoute>
          }
        />
        {/* Manager Routes */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/appointments"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ManagerAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/inventory"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ManagerInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/accounts"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ManagerAccountManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/history"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ManagerHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/customers"
          element={
            <ProtectedRoute allowedRoles={["branch_manager"]}>
              <ManagerCustomerManagement />
            </ProtectedRoute>
          }
        />
        {/* Inventory Routes */}
        <Route
          path="/inventory/dashboard"
          element={
            <ProtectedRoute allowedRoles={["inventory"]}>
              <InventoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/alerts"
          element={
            <ProtectedRoute allowedRoles={["inventory"]}>
              <InventoryAlerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/branch-distribution"
          element={
            <ProtectedRoute allowedRoles={["inventory"]}>
              <InventoryBranchDistribution />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/movement-log"
          element={
            <ProtectedRoute allowedRoles={["inventory"]}>
              <InventoryMovementLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/stock"
          element={
            <ProtectedRoute allowedRoles={["inventory"]}>
              <InventoryStockOverview />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route
          path="/staff/pos"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffPOS />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/appointments"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/queue"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/vehicle-recognition"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffVehicleRecognition />
            </ProtectedRoute>
          }
        />
        {/* Mechanic Routes */}
        <Route
          path="/mechanic/dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <MechanicDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mechanic/schedule"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <MechanicSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mechanic/active-jobs"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <MechanicActiveJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mechanic/job-history"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <MechanicJobHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mechanic/inventory-requests"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <MechanicInventoryRequest />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

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
    if (contentReady) {
      setContentVisible(true);
      setIsLoading(false);
    } else {
      // Assets not ready yet — wait for them then reveal
      const check = setInterval(() => {
        setContentReady((ready) => {
          if (ready) {
            clearInterval(check);
            setContentVisible(true);
            setIsLoading(false);
          }
          return ready;
        });
      }, 50);
    }
  };

  return (
    <>
      {/* Loading Screen — sits on top, fades itself out */}
      <LoadingScreen onLoadingComplete={handleLoadingComplete} />

      {/*
        Keep the background dark (#07070d) until the app is fully revealed.
        This prevents the white flash between loading screen fade-out and
        the actual page content appearing.
      */}
      <div
        style={{ background: contentVisible ? "transparent" : "#07070d" }}
        className={`
          transition-opacity duration-700
          ${contentVisible ? "opacity-100" : "opacity-0"}
        `}
      >
        <Router>
          <Layout />
        </Router>
      </div>
    </>
  );
}

export default App;
