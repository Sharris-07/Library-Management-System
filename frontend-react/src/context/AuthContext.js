import { createContext, useContext } from "react";

// The shared object that holds the authentication state.
export const AuthContext = createContext(null);

// Custom hook: any component can call useAuth() to read the user or to log out.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}