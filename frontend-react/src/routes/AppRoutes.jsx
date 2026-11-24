import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES, ROUTES } from "../utils/constants";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import Login from "../Pages/auth/Login";
import Register from "../Pages/auth/Register";
import PlaceholderPage from "../Pages/common/PlaceholderPage";
import StudentDashboard from "../Pages/student/StudentDashboard";
import Catalogue from "../Pages/student/catalogue";
import History from "../Pages/student/History";
import Fines from "../Pages/student/Fines";
import LibrarianDashboard from "../Pages/Librarian/LibrarianDashboard";
import ManageBooks from "../Pages/Librarian/ManageBooks";
import IssueReturn from "../Pages/Librarian/IssueReturn";
import OverdueBooks from "../Pages/Librarian/OverdueBooks";
import Members from "../Pages/Librarian/Members";
import Reservations from "../Pages/Librarian/Reservations";
import AdminDashboard from "../Pages/Admin/AdminDashboard";
import UserManagement from "../Pages/Admin/UserManagement";
import LogsAndSettings from "../Pages/Admin/LogsAndSettings";

// Pages of each role. The placeholder is replaced by the real page
// when that page is built.
const STUDENT_PAGES = [
  { path: ROUTES.STUDENT_DASHBOARD, title: "Student Dashboard", element: <StudentDashboard /> },
  { path: ROUTES.STUDENT_CATALOGUE, title: "Book Catalogue", element: <Catalogue /> },
  { path: ROUTES.STUDENT_HISTORY, title: "Borrowing History", element: <History /> },
  { path: ROUTES.STUDENT_FINES, title: "Fines and Due Dates", element: <Fines /> },
];

const LIBRARIAN_PAGES = [
  { path: ROUTES.LIBRARIAN_DASHBOARD, title: "Librarian Dashboard", element: <LibrarianDashboard /> },
  { path: ROUTES.LIBRARIAN_BOOKS, title: "Manage Books", element: <ManageBooks /> },
  { path: ROUTES.LIBRARIAN_ISSUE_RETURN, title: "Issue and Return", element: <IssueReturn /> },
  { path: ROUTES.LIBRARIAN_RESERVATIONS, title: "Reservations", element: <Reservations /> },
  { path: ROUTES.LIBRARIAN_OVERDUE, title: "Overdue Books", element: <OverdueBooks /> },
  { path: ROUTES.LIBRARIAN_MEMBERS, title: "Members", element: <Members /> },
];

const ADMIN_PAGES = [
  { path: ROUTES.ADMIN_DASHBOARD, title: "Administrator Dashboard", element: <AdminDashboard /> },
  { path: ROUTES.ADMIN_USERS, title: "User Management", element: <UserManagement /> },
  { path: ROUTES.ADMIN_LOGS, title: "Activity Logs", element: <LogsAndSettings initialTab="logs" /> },
  { path: ROUTES.ADMIN_SETTINGS, title: "System Settings", element: <LogsAndSettings initialTab="settings" /> },
];

// Connects the layout to the authentication context.
function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  return <DashboardLayout user={user} onLogout={logout} />;
}

// The address "/" sends each visitor to the right place.
function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  return (
    <Navigate to={isAuthenticated ? user.getHomeRoute() : ROUTES.LOGIN} replace />
  );
}

// Builds the protected group of pages for one role.
function renderRoleRoutes(role, pages) {
  return (
    <Route element={<ProtectedRoute allowedRoles={[role]} />}>
      <Route element={<AuthenticatedLayout />}>
        {pages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={page.element ?? <PlaceholderPage title={page.title} />}
          />
        ))}
      </Route>
    </Route>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Public pages */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />

      {/* Protected pages, one group for each role */}
      {renderRoleRoutes(ROLES.STUDENT, STUDENT_PAGES)}
      {renderRoleRoutes(ROLES.LIBRARIAN, LIBRARIAN_PAGES)}
      {renderRoleRoutes(ROLES.ADMIN, ADMIN_PAGES)}

      {/* Any unknown address */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;