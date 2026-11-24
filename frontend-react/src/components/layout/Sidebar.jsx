import { NavLink } from "react-router-dom";
import { ROLES, ROUTES } from "../../utils/constants";

// Menu links for each role. Every path comes from constants.js.
const MENU_ITEMS = {
  [ROLES.STUDENT]: [
    { label: "Dashboard", path: ROUTES.STUDENT_DASHBOARD },
    { label: "Book Catalogue", path: ROUTES.STUDENT_CATALOGUE },
    { label: "Borrowing History", path: ROUTES.STUDENT_HISTORY },
    { label: "Fines and Due Dates", path: ROUTES.STUDENT_FINES },
  ],
  [ROLES.LIBRARIAN]: [
    { label: "Dashboard", path: ROUTES.LIBRARIAN_DASHBOARD },
    { label: "Manage Books", path: ROUTES.LIBRARIAN_BOOKS },
    { label: "Issue and Return", path: ROUTES.LIBRARIAN_ISSUE_RETURN },
    { label: "Reservations", path: ROUTES.LIBRARIAN_RESERVATIONS },
    { label: "Overdue Books", path: ROUTES.LIBRARIAN_OVERDUE },
    { label: "Members", path: ROUTES.LIBRARIAN_MEMBERS },
  ],
  [ROLES.ADMIN]: [
    { label: "Dashboard", path: ROUTES.ADMIN_DASHBOARD },
    { label: "User Management", path: ROUTES.ADMIN_USERS },
    { label: "Activity Logs", path: ROUTES.ADMIN_LOGS },
    { label: "System Settings", path: ROUTES.ADMIN_SETTINGS },
  ],
};

// Props:
//   role: one of the values in ROLES.
//   isOpen: whether the drawer is open on small screens.
//   onClose: function that closes the drawer.

function Sidebar({ role = ROLES.STUDENT, isOpen = false, onClose }) {
  const items = MENU_ITEMS[role] ?? [];

  return (
    <>
      {/* Dark background behind the drawer on small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-cocoa/50 md:hidden"
          onClick={onClose}
          role="presentation"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-brass/50 bg-cocoa pt-16 transition-transform duration-200 md:static md:z-auto md:h-auto md:min-h-[calc(100vh-4rem)] md:translate-x-0 md:pt-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main menu"
      >
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-mocha text-gold-light shadow-brass"
                    : "text-cream/90 hover:bg-mocha/50 hover:text-cream"
                }`
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;