import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext();

const API_URL = "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Authentication checking state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();

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
        // Authentication check completed
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Logout
  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};