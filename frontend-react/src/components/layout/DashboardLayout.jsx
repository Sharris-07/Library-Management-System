import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

// Common frame for every page after login.
// Props:
//   user: a User model object.
//   onLogout: function called when the Logout button is pressed.
// The current page is displayed in place of <Outlet />.

function DashboardLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar
        user={user}
        onLogout={onLogout}
        onMenuToggle={() => setSidebarOpen((previous) => !previous)}
      />

      <div className="md:flex">
        <Sidebar
          role={user?.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;