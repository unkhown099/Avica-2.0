import os
import re

def update_file(path, old_sub, new_sub):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read().replace('\r\n', '\n')
    if old_sub in content:
        content = content.replace(old_sub, new_sub)
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        print(f"Successfully updated {path}")
        return True
    else:
        print(f"Target substring not found in {path}")
        return False

# 1. Update frontend/src/pages/SignIn.jsx: storeSession and MAINTENANCE_ALLOWED_ROLES
path_signin = os.path.join('frontend', 'src', 'pages', 'SignIn.jsx')
with open(path_signin, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

old_signin = """const MAINTENANCE_ALLOWED_ROLES = ["super_admin", "admin", "business_owner"];"""
new_signin = """const MAINTENANCE_ALLOWED_ROLES = [
  "super_admin",
  "admin",
  "business_owner",
  "branch_manager",
  "staff",
  "employee",
  "inventory",
  "inventory_manager",
];"""
c = c.replace(old_signin, new_signin)

old_store = """  const storeSession = (tokens, user, remember) => {
    // Clear both storages first to prevent stale collision (e.g. employee logging in on a machine with stale customer data)
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");

    // Always keep active session in sessionStorage
    sessionStorage.setItem("access_token", tokens.access);
    sessionStorage.setItem("refresh_token", tokens.refresh);
    sessionStorage.setItem("user", JSON.stringify(user));

    // If remember is checked, also persist in localStorage
    if (remember) {
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));
    }
  };"""

new_store = """  const storeSession = (tokens, user, remember) => {
    // Clear both storages first to prevent stale collision
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");

    // Always store in BOTH sessionStorage and localStorage to guarantee persistence across refreshes and tabs
    sessionStorage.setItem("access_token", tokens.access);
    sessionStorage.setItem("refresh_token", tokens.refresh);
    sessionStorage.setItem("user", JSON.stringify(user));

    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    localStorage.setItem("user", JSON.stringify(user));
  };"""

c = c.replace(old_store, new_store)
with open(path_signin, 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print("Updated SignIn.jsx")

# 2. Update frontend/src/hooks/useAuth.js
path_auth = os.path.join('frontend', 'src', 'hooks', 'useAuth.js')
with open(path_auth, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

old_set_token = """function setAccessToken(token) {
  localStorage.setItem("access_token", token);
}"""

new_set_token = """function setAccessToken(token) {
  sessionStorage.setItem("access_token", token);
  localStorage.setItem("access_token", token);
}"""

c = c.replace(old_set_token, new_set_token)
with open(path_auth, 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print("Updated useAuth.js")

# 3. Update frontend/src/App.jsx: Add AdminInventory import, fix /admin/inventory and /settings routes
path_app = os.path.join('frontend', 'src', 'App.jsx')
with open(path_app, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

old_import = """// Admin Imports
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminServices from "./pages/admin/AdminServices.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminAppointments from "./pages/admin/AdminAppointments.jsx";
import AdminBranches from "./pages/admin/AdminBranches.jsx";
import AdminStaff from "./pages/admin/AdminStaffAccounts.jsx";"""

new_import = """// Admin Imports
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminServices from "./pages/admin/AdminServices.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminAppointments from "./pages/admin/AdminAppointments.jsx";
import AdminBranches from "./pages/admin/AdminBranches.jsx";
import AdminStaff from "./pages/admin/AdminStaffAccounts.jsx";
import AdminInventory from "./pages/admin/AdminInventory.jsx";"""

c = c.replace(old_import, new_import)

old_inv_route = """          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute allowedRoles={["inventory_manager"]}>
                <Navigate to="/inventory-manager/inventory" replace />
              </ProtectedRoute>
            }
          />"""

new_inv_route = """          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute allowedRoles={["admin", "inventory_manager"]}>
                <AdminInventory />
              </ProtectedRoute>
            }
          />"""

c = c.replace(old_inv_route, new_inv_route)

old_settings_route = """          <Route path="/settings" element={<Navigate to="/customer/settings" replace />} />"""
new_settings_route = """          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                {(() => {
                  const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
                  const u = raw ? JSON.parse(raw) : null;
                  const r = u?.role ? String(u.role).trim().toLowerCase().replace(/[- ]+/g, "_") : "";
                  const map = {
                    super_admin: "/super-admin/account-settings",
                    admin: "/admin/settings",
                    business_owner: "/branch-owner/settings",
                    branch_manager: "/manager/settings",
                    inventory_manager: "/inventory-manager/settings",
                    inventory: "/inventory/settings",
                    staff: "/staff/settings",
                    employee: "/employee/settings",
                    customer: "/customer/settings",
                  };
                  return <Navigate to={map[r] || "/customer/settings"} replace />;
                })()}
              </ProtectedRoute>
            }
          />"""

c = c.replace(old_settings_route, new_settings_route)

with open(path_app, 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print("Updated App.jsx")

# 4. Update frontend/src/pages/customer/CustomerBooking.jsx
path_booking = os.path.join('frontend', 'src', 'pages', 'customer', 'CustomerBooking.jsx')
with open(path_booking, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

# Service cards
old_svc1 = 'className={`booking-selection-card flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${active ? "booking-card-active border-red-600 dark:border-red-500 bg-red-50/40 dark:bg-red-600/15 shadow-sm ring-1 ring-red-500/30" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.08]"}`}'
new_svc1 = 'className={`booking-selection-card flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${active ? "booking-card-active border-gray-300 dark:border-white/20 bg-white dark:bg-gray-900 shadow-sm" : "border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-gray-800/60"}`}'
c = c.replace(old_svc1, new_svc1)

old_svc2 = 'className={`booking-selection-card p-3.5 rounded-2xl border text-left transition-all duration-200 relative cursor-pointer ${active ? "booking-card-active border-red-600 dark:border-red-500 bg-red-50/40 dark:bg-red-600/15 shadow-sm ring-1 ring-red-500/30" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.08]"}`}'
new_svc2 = 'className={`booking-selection-card p-3.5 rounded-2xl border text-left transition-all duration-200 relative cursor-pointer ${active ? "booking-card-active border-gray-300 dark:border-white/20 bg-white dark:bg-gray-900 shadow-sm" : "border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-gray-800/60"}`}'
c = c.replace(old_svc2, new_svc2)

# Branch card styling
old_branch_card = """                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              set("branch", b);
                              if (bookingMode === "specific")
                                set("preferredEmployee", null);
                            }}
                            className={`booking-branch-card w-full p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                              active
                                ? "booking-branch-selected border-red-500 bg-[#fff5f5] dark:bg-red-600/20 shadow-sm ring-1 ring-red-500/30"
                                : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.08]"
                            }`}
                          >
                            <div
                              className={`branch-icon-pin w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                                active ? "bg-red-600 text-white shadow-md shadow-red-600/40" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                              }`}
                            >"""

new_branch_card = """                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              set("branch", b);
                              if (bookingMode === "specific")
                                set("preferredEmployee", null);
                            }}
                            className={`booking-branch-card w-full p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                              active
                                ? "booking-branch-selected border-gray-300 dark:border-white/20 bg-white dark:bg-gray-900 shadow-sm"
                                : "border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                            }`}
                          >
                            <div
                              className="branch-icon-pin w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400"
                            >"""
c = c.replace(old_branch_card, new_branch_card)

# Branch card title
old_bname = """                              <div
                                className={`branch-name font-bold text-xs sm:text-sm mb-0.5 ${active ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
                              >"""
new_bname = """                              <div
                                className="branch-name font-bold text-xs sm:text-sm mb-0.5 text-gray-900 dark:text-white"
                              >"""
c = c.replace(old_bname, new_bname)

# Booking Mode
old_bmode = """                      className={`booking-selection-card relative p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                        active
                          ? "booking-card-active border-red-500 bg-red-50/50 dark:bg-red-600/20 shadow-sm ring-1 ring-red-500/30"
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.08]"
                      }`}"""
new_bmode = """                      className={`booking-selection-card relative p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                        active
                          ? "booking-card-active border-gray-300 dark:border-white/20 bg-white dark:bg-gray-900 shadow-sm"
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}"""
c = c.replace(old_bmode, new_bmode)

with open(path_booking, 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print("Updated CustomerBooking.jsx")

# 5. Update frontend/src/pages/admin/AdminDashboard.jsx: Add top view switcher tabs
path_dash = os.path.join('frontend', 'src', 'pages', 'admin', 'AdminDashboard.jsx')
with open(path_dash, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

old_header_end = """          <div className="flex items-center gap-1.5 sm:gap-2 print:hidden" />
        </div>"""

new_header_end = """          <div className="flex items-center gap-1.5 sm:gap-2 print:hidden" />
        </div>

        {/* View Switcher Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-white/5 print:hidden">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => {
                setActiveView(v.key);
                setActiveExportSection(v.key);
                window.location.hash = `#${v.key}`;
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeView === v.key
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60 border border-white/5"
              }`}
            >
              {v.icon}
              <span>{v.label}</span>
            </button>
          ))}
        </div>"""

c = c.replace(old_header_end, new_header_end)

with open(path_dash, 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print("Updated AdminDashboard.jsx")

