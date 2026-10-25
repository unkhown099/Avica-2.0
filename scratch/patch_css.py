import os

path = os.path.join('frontend', 'src', 'index.css')
with open(path, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

# 1. Replace the Logout section (around lines 3034-3138)
old_logout_block = """/* 4. Logout: Red default and RED hover, never white text or white fill */
.logout-btn,
button.logout-btn,
.sidebar-logout-btn,
html[data-theme="light"] .logout-btn,
html[data-theme="light"] button.logout-btn,
html[data-theme="light"] .sidebar-logout-btn,
html[data-theme="light"] aside .space-y-1 > button:last-child {
  border: 1px solid transparent !important;
  box-shadow: none !important;
  background-color: transparent !important;
  color: #dc2626 !important;
}

.logout-btn *,
button.logout-btn *,
.sidebar-logout-btn *,
html[data-theme="light"] .logout-btn *,
html[data-theme="light"] button.logout-btn *,
html[data-theme="light"] .sidebar-logout-btn *,
html[data-theme="light"] aside .space-y-1 > button:last-child * {
  color: #dc2626 !important;
  stroke: #dc2626 !important;
}

.logout-btn:hover,
button.logout-btn:hover,
.sidebar-logout-btn:hover,
html[data-theme="light"] .logout-btn:hover,
html[data-theme="light"] button.logout-btn:hover,
html[data-theme="light"] .sidebar-logout-btn:hover,
html[data-theme="light"] aside .space-y-1 > button:last-child:hover {
  background-color: #fef2f2 !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
  color: #dc2626 !important;
}

.logout-btn:hover *,
button.logout-btn:hover *,
.sidebar-logout-btn:hover *,
html[data-theme="light"] .logout-btn:hover *,
html[data-theme="light"] button.logout-btn:hover *,
html[data-theme="light"] .sidebar-logout-btn:hover *,
html[data-theme="light"] aside .space-y-1 > button:last-child:hover * {
  color: #dc2626 !important;
  stroke: #dc2626 !important;
}


/* ==========================================================================
   FINAL BULLETPROOF OVERRIDES: LOGOUT, VIEW DETAILS & CUSTOMER BOOKING
   ========================================================================== */

/* A. Logout Button: ALWAYS RED (#dc2626) in both default and hover states */
html[data-theme="light"] .logout-btn,
html[data-theme="light"] button.logout-btn,
html[data-theme="light"] .sidebar-logout-btn,
html[data-theme="light"] aside .logout-btn,
html[data-theme="light"] aside button.logout-btn,
html[data-theme="light"] aside .sidebar-logout-btn,
html[data-theme="light"] aside .space-y-1 > button:last-child {
  background-color: transparent !important;
  color: #dc2626 !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
}

html[data-theme="light"] .logout-btn *,
html[data-theme="light"] button.logout-btn *,
html[data-theme="light"] .sidebar-logout-btn *,
html[data-theme="light"] aside .logout-btn *,
html[data-theme="light"] aside button.logout-btn *,
html[data-theme="light"] aside .sidebar-logout-btn *,
html[data-theme="light"] aside .space-y-1 > button:last-child * {
  color: #dc2626 !important;
  stroke: #dc2626 !important;
  fill: none !important;
}

html[data-theme="light"] .logout-btn:hover,
html[data-theme="light"] button.logout-btn:hover,
html[data-theme="light"] .sidebar-logout-btn:hover,
html[data-theme="light"] aside .logout-btn:hover,
html[data-theme="light"] aside button.logout-btn:hover,
html[data-theme="light"] aside .sidebar-logout-btn:hover,
html[data-theme="light"] aside .space-y-1 > button:last-child:hover {
  background-color: #fef2f2 !important;
  color: #dc2626 !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
}

html[data-theme="light"] .logout-btn:hover *,
html[data-theme="light"] button.logout-btn:hover *,
html[data-theme="light"] .sidebar-logout-btn:hover *,
html[data-theme="light"] aside .logout-btn:hover *,
html[data-theme="light"] aside button.logout-btn:hover *,
html[data-theme="light"] aside .sidebar-logout-btn:hover *,
html[data-theme="light"] aside .space-y-1 > button:last-child:hover * {
  color: #dc2626 !important;
  stroke: #dc2626 !important;
  fill: none !important;
}"""

new_logout_block = """/* 4. Logout: Red default and RED hover in Light & Dark mode */
/* Dark Mode: Transparent background, red text & icon, NO hover background, NO white text, NO glow, NO scaling */
html:not([data-theme="light"]) .logout-btn,
html:not([data-theme="light"]) button.logout-btn,
html:not([data-theme="light"]) .sidebar-logout-btn,
html:not([data-theme="light"]) aside .logout-btn,
html:not([data-theme="light"]) aside button.logout-btn,
html:not([data-theme="light"]) aside .sidebar-logout-btn {
  background-color: transparent !important;
  color: #ef4444 !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
  filter: none !important;
  transform: none !important;
}

html:not([data-theme="light"]) .logout-btn *,
html:not([data-theme="light"]) button.logout-btn *,
html:not([data-theme="light"]) .sidebar-logout-btn *,
html:not([data-theme="light"]) aside .logout-btn *,
html:not([data-theme="light"]) aside button.logout-btn *,
html:not([data-theme="light"]) aside .sidebar-logout-btn * {
  color: #ef4444 !important;
  stroke: #ef4444 !important;
  fill: none !important;
  filter: none !important;
}

html:not([data-theme="light"]) .logout-btn:hover,
html:not([data-theme="light"]) button.logout-btn:hover,
html:not([data-theme="light"]) .sidebar-logout-btn:hover,
html:not([data-theme="light"]) aside .logout-btn:hover,
html:not([data-theme="light"]) aside button.logout-btn:hover,
html:not([data-theme="light"]) aside .sidebar-logout-btn:hover {
  background-color: transparent !important;
  color: #ef4444 !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
  filter: none !important;
  transform: none !important;
}

html:not([data-theme="light"]) .logout-btn:hover *,
html:not([data-theme="light"]) button.logout-btn:hover *,
html:not([data-theme="light"]) .sidebar-logout-btn:hover *,
html:not([data-theme="light"]) aside .logout-btn:hover *,
html:not([data-theme="light"]) aside button.logout-btn:hover *,
html:not([data-theme="light"]) aside .sidebar-logout-btn:hover * {
  color: #ef4444 !important;
  stroke: #ef4444 !important;
  fill: none !important;
  filter: none !important;
}

/* Light Mode: Transparent default, red text & icon; subtle #fef2f2 on hover, red text & icon NEVER white */
html[data-theme="light"] .logout-btn,
html[data-theme="light"] button.logout-btn,
html[data-theme="light"] .sidebar-logout-btn,
html[data-theme="light"] aside .logout-btn,
html[data-theme="light"] aside button.logout-btn,
html[data-theme="light"] aside .sidebar-logout-btn,
html[data-theme="light"] aside .space-y-1 > button:last-child {
  background-color: transparent !important;
  color: #dc2626 !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
  filter: none !important;
  transform: none !important;
}

html[data-theme="light"] .logout-btn *,
html[data-theme="light"] button.logout-btn *,
html[data-theme="light"] .sidebar-logout-btn *,
html[data-theme="light"] aside .logout-btn *,
html[data-theme="light"] aside button.logout-btn *,
html[data-theme="light"] aside .sidebar-logout-btn *,
html[data-theme="light"] aside .space-y-1 > button:last-child * {
  color: #dc2626 !important;
  stroke: #dc2626 !important;
  fill: none !important;
  filter: none !important;
}

html[data-theme="light"] .logout-btn:hover,
html[data-theme="light"] button.logout-btn:hover,
html[data-theme="light"] .sidebar-logout-btn:hover,
html[data-theme="light"] aside .logout-btn:hover,
html[data-theme="light"] aside button.logout-btn:hover,
html[data-theme="light"] aside .sidebar-logout-btn:hover,
html[data-theme="light"] aside .space-y-1 > button:last-child:hover {
  background-color: #fef2f2 !important;
  color: #dc2626 !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
  filter: none !important;
  transform: none !important;
}

html[data-theme="light"] .logout-btn:hover *,
html[data-theme="light"] button.logout-btn:hover *,
html[data-theme="light"] .sidebar-logout-btn:hover *,
html[data-theme="light"] aside .logout-btn:hover *,
html[data-theme="light"] aside button.logout-btn:hover *,
html[data-theme="light"] aside .sidebar-logout-btn:hover *,
html[data-theme="light"] aside .space-y-1 > button:last-child:hover * {
  color: #dc2626 !important;
  stroke: #dc2626 !important;
  fill: none !important;
  filter: none !important;
}

/* ==========================================================================
   FINAL BULLETPROOF OVERRIDES: VIEW DETAILS & CUSTOMER BOOKING
   ========================================================================== */"""

if old_logout_block in c:
    c = c.replace(old_logout_block, new_logout_block)
    print("Replaced logout CSS block")
else:
    print("Logout block not found")

# 2. Update booking cards in index.css (around lines 2367-2540)
old_booking_css = """html[data-theme="light"] .booking-branch-card,

html[data-theme="light"] button.booking-branch-card {

  background-color: #ffffff !important;

  border: 1.5px solid #e2e8f0 !important;

  color: #0f172a !important;

  box-shadow: none !important;

}



html[data-theme="light"] .booking-branch-card:hover:not(:disabled):not(.booking-branch-selected),
html[data-theme="light"] button.booking-branch-card:hover:not(:disabled):not(.booking-branch-selected) {
  background-color: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
}

html[data-theme="light"] .booking-branch-card.booking-branch-selected,
html[data-theme="light"] button.booking-branch-card.booking-branch-selected {
  background-color: #fef2f2 !important;
  border: 1.5px solid #dc2626 !important;
  color: #0f172a !important;
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.1) !important;
}



html[data-theme="light"] .booking-branch-card:hover *,

html[data-theme="light"] button.booking-branch-card:hover *,

html[data-theme="light"] .booking-branch-card.booking-branch-selected *,

html[data-theme="light"] button.booking-branch-card.booking-branch-selected * {

  color: inherit;

}



html[data-theme="light"] .booking-branch-card .branch-name,

html[data-theme="light"] .booking-branch-card [class*="font-bold"] {

  color: #0f172a !important;

}



html[data-theme="light"] .booking-branch-card.booking-branch-selected .branch-name,

html[data-theme="light"] .booking-branch-card.border-red-500 .branch-name,

html[data-theme="light"] .booking-branch-card.booking-branch-selected [class*="text-red-"] {

  color: #dc2626 !important;

}



html[data-theme="light"] .booking-branch-card .branch-address,

html[data-theme="light"] .booking-branch-card [class*="text-gray-500"],

html[data-theme="light"] .booking-branch-card [class*="text-gray-400"] {

  color: #64748b !important;

}



html[data-theme="light"] .booking-branch-card .branch-hours {

  color: #64748b !important;

}



html[data-theme="light"] .booking-branch-card .branch-slots,

html[data-theme="light"] .booking-branch-card [class*="text-emerald-"] {

  color: #059669 !important;

}



html[data-theme="light"] .booking-branch-card .branch-map-btn,

html[data-theme="light"] .booking-branch-card a[href*="google.com/maps"] {

  background-color: #eff6ff !important;

  border: 1px solid #bfdbfe !important;

  color: #2563eb !important;

}



html[data-theme="light"] .booking-branch-card .branch-map-btn *,

html[data-theme="light"] .booking-branch-card a[href*="google.com/maps"] * {

  color: #2563eb !important;

  stroke: #2563eb !important;

}



html[data-theme="light"] .booking-branch-card .branch-map-btn:hover,
html[data-theme="light"] .booking-branch-card a[href*="google.com/maps"]:hover {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
}

html[data-theme="light"] .booking-branch-card .branch-map-btn:hover *,
html[data-theme="light"] .booking-branch-card a[href*="google.com/maps"]:hover * {
  color: #ffffff !important;
  stroke: #ffffff !important;
}



html[data-theme="light"] .booking-branch-card .branch-icon-pin {

  color: #64748b !important;

  background-color: #f1f5f9 !important;

}



html[data-theme="light"] .booking-branch-card.booking-branch-selected .branch-icon-pin,

html[data-theme="light"] .booking-branch-card.border-red-500 .branch-icon-pin {

  background-color: #dc2626 !important;

  color: #ffffff !important;

}



html[data-theme="light"] .booking-branch-card.booking-branch-selected .branch-icon-pin *,

html[data-theme="light"] .booking-branch-card.border-red-500 .branch-icon-pin * {

  color: #ffffff !important;

  stroke: #ffffff !important;

}



/* Other booking option cards (services, mode, employee, vehicle size) */

html[data-theme="light"] .booking-selection-card,

html[data-theme="light"] button.booking-selection-card {

  background-color: #ffffff !important;

  border: 1.5px solid #e2e8f0 !important;

  color: #0f172a !important;

}



html[data-theme="light"] .booking-selection-card:hover:not(:disabled):not(.booking-card-active),
html[data-theme="light"] button.booking-selection-card:hover:not(:disabled):not(.booking-card-active) {
  background-color: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
}

html[data-theme="light"] .booking-selection-card.booking-card-active,
html[data-theme="light"] button.booking-selection-card.booking-card-active {
  background-color: #fef2f2 !important;
  border: 1.5px solid #dc2626 !important;
  color: #0f172a !important;
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.1) !important;
}"""

new_booking_css = """/* Booking branch card: clean, neutral light/dark styling. NEVER turned solid red. */
html[data-theme="light"] .booking-branch-card,
html[data-theme="light"] button.booking-branch-card {
  background-color: #ffffff !important;
  border: 1.5px solid #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: none !important;
}

html[data-theme="light"] .booking-branch-card:hover:not(:disabled),
html[data-theme="light"] button.booking-branch-card:hover:not(:disabled) {
  background-color: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
}

/* Selected branch card: remains clean neutral white card. ONLY SelectedBadge indicates selection! */
html[data-theme="light"] .booking-branch-card.booking-branch-selected,
html[data-theme="light"] button.booking-branch-card.booking-branch-selected {
  background-color: #ffffff !important;
  border: 1.5px solid #cbd5e1 !important;
  color: #0f172a !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

html[data-theme="light"] .booking-branch-card:hover *,
html[data-theme="light"] button.booking-branch-card:hover *,
html[data-theme="light"] .booking-branch-card.booking-branch-selected *,
html[data-theme="light"] button.booking-branch-card.booking-branch-selected * {
  color: inherit;
}

/* Branch name: always dark #0f172a, never red or white */
html[data-theme="light"] .booking-branch-card .branch-name,
html[data-theme="light"] .booking-branch-card [class*="font-bold"],
html[data-theme="light"] .booking-branch-card.booking-branch-selected .branch-name,
html[data-theme="light"] .booking-branch-card:hover .branch-name {
  color: #0f172a !important;
}

/* Branch pin icon: always neutral slate #64748b on #f1f5f9, never red */
html[data-theme="light"] .booking-branch-card .branch-icon-pin,
html[data-theme="light"] .booking-branch-card.booking-branch-selected .branch-icon-pin,
html[data-theme="light"] .booking-branch-card:hover .branch-icon-pin {
  color: #64748b !important;
  background-color: #f1f5f9 !important;
}

html[data-theme="light"] .booking-branch-card .branch-icon-pin *,
html[data-theme="light"] .booking-branch-card.booking-branch-selected .branch-icon-pin *,
html[data-theme="light"] .booking-branch-card:hover .branch-icon-pin * {
  color: #64748b !important;
  stroke: #64748b !important;
}

/* Branch address & hours */
html[data-theme="light"] .booking-branch-card .branch-address,
html[data-theme="light"] .booking-branch-card .branch-hours,
html[data-theme="light"] .booking-branch-card:hover .branch-address,
html[data-theme="light"] .booking-branch-card:hover .branch-hours {
  color: #64748b !important;
}

/* Branch slots: green #059669 */
html[data-theme="light"] .booking-branch-card .branch-slots,
html[data-theme="light"] .booking-branch-card:hover .branch-slots {
  color: #059669 !important;
}

/* View in Map button: blue outline pill normally, solid blue on hover with white text */
html[data-theme="light"] .booking-branch-card .branch-map-btn,
html[data-theme="light"] .booking-branch-card a[href*="google.com/maps"] {
  background-color: #eff6ff !important;
  border: 1px solid #bfdbfe !important;
  color: #2563eb !important;
}

html[data-theme="light"] .booking-branch-card .branch-map-btn *,
html[data-theme="light"] .booking-branch-card a[href*="google.com/maps"] * {
  color: #2563eb !important;
  stroke: #2563eb !important;
}

html[data-theme="light"] .booking-branch-card .branch-map-btn:hover,
html[data-theme="light"] .booking-branch-card a[href*="google.com/maps"]:hover {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
}

html[data-theme="light"] .booking-branch-card .branch-map-btn:hover *,
html[data-theme="light"] .booking-branch-card a[href*="google.com/maps"]:hover * {
  color: #ffffff !important;
  stroke: #ffffff !important;
}

/* Other booking option cards (services, mode, employee, vehicle size) */
html[data-theme="light"] .booking-selection-card,
html[data-theme="light"] button.booking-selection-card {
  background-color: #ffffff !important;
  border: 1.5px solid #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: none !important;
}

html[data-theme="light"] .booking-selection-card:hover:not(:disabled),
html[data-theme="light"] button.booking-selection-card:hover:not(:disabled) {
  background-color: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
}

/* Selected option cards: keep neutral card styling with small red SelectedBadge check */
html[data-theme="light"] .booking-selection-card.booking-card-active,
html[data-theme="light"] button.booking-selection-card.booking-card-active {
  background-color: #ffffff !important;
  border: 1.5px solid #cbd5e1 !important;
  color: #0f172a !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}"""

if old_booking_css in c:
    c = c.replace(old_booking_css, new_booking_css)
    print("Replaced booking cards CSS block")
else:
    print("Booking cards CSS block not found")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print("Updated index.css")

