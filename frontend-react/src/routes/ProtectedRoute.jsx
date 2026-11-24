import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../utils/constants";

// Guards a group of pages.
// Props:
//   allowedRoles: list of roles that may open the pages inside this guard.
//                 An empty list means any logged in user may enter.

function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Rule 1: not logged in. The requested address is remembered,
  // so the Login page can return the user to it after a successful login.
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Rule 2: logged in, but the role is not allowed on this page.
  if (allowedRoles.length > 0 && !user.hasRole(allowedRoles)) {
    return <Navigate to={user.getHomeRoute()} replace />;
  }

  // Access granted: show the requested page.
  return <Outlet />;
}

export default ProtectedRoute;