import { createContext, useContext, useState } from "react";

// This context holds the logged-in user's info (name, role, etc.)
// and makes it available to every component in the app via useAuth().
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("mis_user");
    return saved ? JSON.parse(saved) : null;
  });

  function login(userData) {
    setUser(userData);
    localStorage.setItem("mis_user", JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("mis_user");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}