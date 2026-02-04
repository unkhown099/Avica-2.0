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

// Admin Imports below (if any) can be added here
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminServices from "./pages/admin/AdminServices.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminAI from "./pages/admin/AdminAI.jsx";
import AdminInventory from "./pages/admin/AdminInventory.jsx";
import AdminAppointments from "./pages/admin/AdminAppointments.jsx";
import AdminBranches from "./pages/admin/AdminBranches.jsx";
import AdminReports from "./pages/admin/AdminReports.jsx";
import AdminStaff from "./pages/admin/AdminStaffAccounts.jsx";

// this route protect the staffs and admins routes
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/services"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-recognition"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminAI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branches"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminBranches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminStaff />
            </ProtectedRoute>
          }
        />
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
