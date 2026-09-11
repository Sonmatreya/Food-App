import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const {
    user,
    loading,
    isAdmin,
  } = useAuth();

  // Wait for authentication check
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
        <p>Checking your account...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Admin
  return children;
}

export default AdminRoute;