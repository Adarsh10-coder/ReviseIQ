import { createContext, useContext, useState, useEffect } from "react";
import api, { BACKEND_URL } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // If token is passed in redirect query param (cross-origin fallback), capture and store it
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get("token");
        if (urlToken) {
          localStorage.setItem("reviseiq_token", urlToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${urlToken}`;
          // Clean the token parameter from the address bar
          urlParams.delete("token");
          const cleanedSearch = urlParams.toString();
          const cleanUrl =
            window.location.pathname + (cleanedSearch ? `?${cleanedSearch}` : "") + window.location.hash;
          window.history.replaceState({}, "", cleanUrl);
        } else {
          const storedToken = localStorage.getItem("reviseiq_token");
          if (storedToken) {
            api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          }
        }
      }

      const res = await api.get("/auth/me");
      if (res.data && res.data.success) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginWithGithub = () => {
    // Redirect to backend GitHub OAuth endpoint
    window.location.href = `${BACKEND_URL}/auth/github`;
  };

  const devLogin = () => {
    // Developer Sandbox Preview login
    window.location.href = `${BACKEND_URL}/auth/dev-login`;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("reviseiq_github_handle");
      localStorage.removeItem("reviseiq_token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuthenticated: !!user,
        loginWithGithub,
        devLogin,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
