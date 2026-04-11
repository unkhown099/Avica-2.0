// App.jsx — with MaintenanceGuard integrated
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Swal from "sweetalert2";

import Navbar from "./components/Landing/LandingNav.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import MaintenancePage from "./pages/MaintenancePage.jsx";
import Signup from "./pages/Signup.jsx";
import SignIn from "./pages/SignIn.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import ChatContainer from "./components/ChatContainer.jsx";
import { useAuth } from "./hooks/useAuth.js";

// ── Maintenance components ─────────────────────────────────────────────────────
import MaintenanceGuard from "./components/MaintenanceGuard.jsx";
import { MaintenanceBanner } from "./components/MaintenanceBanner.jsx";

// Customer Imports
import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";
import CustomerServices from "./pages/customer/CustomerServices.jsx";
import CustomerBooking from "./pages/customer/CustomerBooking.jsx";
import CustomerHistory from "./pages/customer/CustomerHistory.jsx";
import CustomerProfile from "./pages/customer/CustomerProfile.jsx";
import CustomerSettings from "./pages/customer/CustomerSettings.jsx";
import HelpPage from "./pages/customer/CustomerHelp.jsx";

// Super Admin Imports
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard.jsx";
import SuperAdminUsersPage from "./pages/superadmin/SuperAdminUsersPage.jsx";
import SuperAdminContentManagement from "./pages/superadmin/SuperAdminContentManagement.jsx";
import SuperAdminSystemSettings from "./pages/superadmin/SuperAdminSystemSettings.jsx";
import SuperAdminReports from "./pages/superadmin/SuperAdminReports.jsx";
import SuperAdminSecurity from "./pages/superadmin/SuperAdminSecurity.jsx";
import SuperAdminPlugin from "./pages/superadmin/SuperAdminPlugin.jsx";

// Admin Imports
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminServices from "./pages/admin/AdminServices.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
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
import ManagerContents from "./pages/manager/ManagerContents.jsx";
import ManagerAppointments from "./pages/manager/ManagerAppointments.jsx";
import ManagerInventory from "./pages/manager/ManagerInventory.jsx";
import ManagerAccountManagement from "./pages/manager/ManagerAccountManagement.jsx";
import ManagerHistory from "./pages/manager/ManagerHistory.jsx";
import ManagerCustomerManagement from "./pages/manager/ManagerCustomerManagement.jsx";

// Inventory Imports
import InventoryDashboard from "./pages/inventory/InventoryDashboard.jsx";
import InventoryAlerts from "./pages/inventory/InventoryAlerts.jsx";
import InventoryMovementLog from "./pages/inventory/InventoryMovementLog.jsx";
import InventoryStockOverview from "./pages/inventory/InventoryStockOverview.jsx";
import InventoryManagerInventory from "./pages/inventory_manager/InventoryManagerInventory.jsx";
import InventoryManagerDashboard from "./pages/inventory_manager/InventoryManagerDashboard.jsx";
import InventoryManagerTransactions from "./pages/inventory_manager/InventoryManagerTransactions.jsx";

// Staff Imports
import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import StaffPOS from "./pages/staff/StaffPOS.jsx";
import StaffAppointment from "./pages/staff/StaffAppointment.jsx";
import StaffVehicleRecognition from "./pages/staff/StaffVehicleRecognition.jsx";
import StaffQueue from "./pages/staff/StaffQueue.jsx";

// Employee Imports
import EmployeeDashboard from "./pages/employee/EmployeeDashboard.jsx";
import EmployeeSchedule from "./pages/employee/EmployeeSchedule.jsx";
import EmployeeActiveJobs from "./pages/employee/EmployeeActiveJobs.jsx";
import EmployeeJobHistory from "./pages/employee/EmployeeJobHistory.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

// ── Swal backdrop cleanup ─────────────────────────────────────────────────────
function SwalRouteCleanup() {
  const location = useLocation();
  useEffect(() => {
    Swal.close();
  }, [location.pathname]);
  return null;
}

// ── Layout ────────────────────────────────────────────────────────────────────
function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Show navbar only on landing page
  const showNavbar = location.pathname === "/";
  
  // Show chat for specific roles
  const isMessagingRole = [
    "customer",
    "employee",
    "staff",
    "admin",
    "branch_manager",
    "super_admin",
  ].includes(user?.role);

  // Public routes that should show the maintenance banner
  const publicRoutes = ["/", "/signup", "/signin", "/verify-email", "/reset-password"];
  const showMaintenanceBanner = publicRoutes.includes(location.pathname);

  return (
    <>
      <SwalRouteCleanup />
      
      {/* Show maintenance banner on public routes */}
      {showMaintenanceBanner && <MaintenanceBanner />}
      
      {showNavbar && <Navbar />}
      {isMessagingRole && <ChatContainer />}

      {/*
        ── MaintenanceGuard wraps ALL routes.
           Behaviour by role:
             super_admin / admin / business_owner → always full access
             branch_manager / staff / employee / inventory_manager / inventory → sees warning banner but full access
             customer / guest → sees the MaintenancePage wall
      */}
      <MaintenanceGuard>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── Super Admin ───────────────────────────────────────────────── */}
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/users"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/content"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdminContentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/settings"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdminSystemSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/plugins"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdminPlugin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/security"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdminSecurity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/reports"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdminReports />
              </ProtectedRoute>
            }
          />

          {/* ── Customer ─────────────────────────────────────────────────── */}
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

          {/* ── Admin ────────────────────────────────────────────────────── */}
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
              <ProtectedRoute allowedRoles={["inventory_manager"]}>
                <Navigate to="/inventory-manager/inventory" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory-manager/inventory"
            element={
              <ProtectedRoute allowedRoles={["inventory_manager"]}>
                <InventoryManagerInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory-manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={["inventory_manager"]}>
                <InventoryManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory-manager/transactions"
            element={
              <ProtectedRoute allowedRoles={["inventory_manager"]}>
                <InventoryManagerTransactions />
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
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
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

          {/* ── Branch Owner ─────────────────────────────────────────────── */}
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

          {/* ── Manager ──────────────────────────────────────────────────── */}
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
            path="/manager/contents"
            element={
              <ProtectedRoute allowedRoles={["branch_manager"]}>
                <ManagerContents />
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

          {/* ── Inventory ────────────────────────────────────────────────── */}
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

          {/* ── Staff ────────────────────────────────────────────────────── */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
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

          {/* ── Employee ─────────────────────────────────────────────────── */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/schedule"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/active-jobs"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeActiveJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/job-history"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeJobHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/vehicle-recognition"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <StaffVehicleRecognition />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/vehicle-recognition"
            element={<Navigate to="/employee/vehicle-recognition" replace />}
          />

          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </MaintenanceGuard>
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

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
      <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      <div
        style={{ background: contentVisible ? "transparent" : "#07070d" }}
        className={`transition-opacity duration-700 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Router>
          <ChatProvider>
            <Layout />
          </ChatProvider>
        </Router>
      </div>
    </>
  );
}

export default App;
