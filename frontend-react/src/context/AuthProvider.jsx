import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import User from "../models/User";
import { STORAGE_KEYS } from "../utils/constants";

// Restores the user after a page refresh. Any damaged stored value is ignored.
function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? new User(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // Called by the Login page after a successful login.
  // userData: plain object with id, name, email, and role. token: optional JWT string.
  const login = useCallback((userData, token = null) => {
    const loggedInUser = new User(userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedInUser));
    if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;