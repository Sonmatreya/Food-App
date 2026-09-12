import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { API_URL } from "../config/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Authentication checking state
  const [loading, setLoading] = useState(true);

  // =========================================================
  // CHECK CURRENT LOGIN SESSION
  // =========================================================

  const checkAuth = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error(
        "Authentication check failed:",
        error
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL AUTHENTICATION CHECK
  // =========================================================

  useEffect(() => {
    checkAuth();
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error(
          "Logout request failed:",
          response.status
        );
      }
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      // Always clear frontend authentication state
      setUser(null);
    }
  };

  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  const updateProfile = async (profileData) => {
    const response = await fetch(
      `${API_URL}/api/auth/profile`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch {
      // Non-JSON response
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Profile update failed"
      );
    }

    if (data.user) {
      setUser(data.user);
    }

    return data.user;
  };

  // =========================================================
  // AUTHENTICATION HELPERS
  // =========================================================

  const isAuthenticated = Boolean(user);

  const isAdmin =
    user?.role === "admin";

  const isCustomer =
    user?.role === "customer";

  // =========================================================
  // CONTEXT
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,

        loading,

        logout,
        checkAuth,
        updateProfile,

        isAuthenticated,
        isAdmin,
        isCustomer,

        API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =========================================================
// CUSTOM AUTH HOOK
// =========================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};

export default AuthContext;