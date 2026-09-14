import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminLayout.css";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const linkClass = ({ isActive }) =>
    `admin-sidebar-link${isActive ? " active" : ""}`;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/pizza-logo-png.png" alt="Food App" />
          <div>
            <strong>Food App</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          <NavLink to="/admin" end className={linkClass}>
            <span className="admin-sidebar-icon">⌂</span>
            Dashboard
          </NavLink>
          <NavLink to="/admin/orders" className={linkClass}>
            <span className="admin-sidebar-icon">▣</span>
            Orders
          </NavLink>
          <NavLink to="/admin/customers" className={linkClass}>
            <span className="admin-sidebar-icon">♙</span>
            Customers
          </NavLink>
          <NavLink to="/admin/menu" className={linkClass}>
            <span className="admin-sidebar-icon">☷</span>
            Food & Menu
          </NavLink>
          <NavLink to="/admin/coupons" className={linkClass}>
            <span className="admin-sidebar-icon">%</span>
            Coupons
          </NavLink>
          <NavLink to="/admin/staff" className={linkClass}>
            <span className="admin-sidebar-icon">♟</span>
            Staff
          </NavLink>
          <NavLink to="/admin/reports" className={linkClass}>
            <span className="admin-sidebar-icon">▥</span>
            Reports
          </NavLink>
          <NavLink to="/admin/settings" className={linkClass}>
            <span className="admin-sidebar-icon">⚙</span>
            Settings
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <button type="button" className="admin-back-store" onClick={() => navigate("/")}>
            ← Back to Store
          </button>
          <button type="button" className="admin-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="admin-main-area">
        <header className="admin-topbar">
          <div>
            <p>Restaurant Management</p>
            <h1>Admin Panel</h1>
          </div>
          <div className="admin-user-summary">
            <div className="admin-user-avatar">
              {(user?.name || "A").trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user?.name || "Administrator"}</strong>
              <span>{user?.email || "Admin account"}</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
