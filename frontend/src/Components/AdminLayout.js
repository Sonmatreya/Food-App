import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiBarChart2, FiChevronRight, FiClipboard, FiGrid, FiLogOut, FiMenu, FiMessageSquare, FiPercent, FiShoppingBag, FiUsers, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminLayout.css";
import "../Styles/AdminTheme.css";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: FiGrid, end: true, group: "Overview" },
  { to: "/admin/orders", label: "Orders", icon: FiClipboard, group: "Operations" },
  { to: "/admin/customers", label: "Customers", icon: FiUsers, group: "Operations" },
  { to: "/admin/menu", label: "Food & Menu", icon: FiShoppingBag, group: "Catalogue" },
  { to: "/admin/coupons", label: "Coupons", icon: FiPercent, group: "Catalogue" },
  { to: "/admin/reviews", label: "Customer Feedback", icon: FiMessageSquare, group: "Operations" },
  { to: "/admin/staff", label: "Staff & Access", icon: FiUsers, group: "Administration" },
];

const pageTitle = (pathname) => {
  if (pathname === "/admin") return ["Overview", "Dashboard"];
  if (pathname.startsWith("/admin/orders/")) return ["Operations", "Order Details"];
  if (pathname.startsWith("/admin/orders")) return ["Operations", "Orders"];
  if (pathname.startsWith("/admin/customers/")) return ["Customers", "Customer Details"];
  if (pathname.startsWith("/admin/customers")) return ["Customers", "Customer Directory"];
  if (pathname.startsWith("/admin/menu")) return ["Catalogue", "Food & Menu"];
  if (pathname.startsWith("/admin/coupons")) return ["Marketing", "Coupons & Discounts"];
  if (pathname.startsWith("/admin/reviews")) return ["Operations", "Customer Feedback"];
  if (pathname.startsWith("/admin/staff")) return ["Administration", "Staff & Access"];
  return ["Administration", "Admin Panel"];
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [section, title] = pageTitle(location.pathname);

  React.useEffect(() => {
    if (!mobileOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try { await logout(); } finally { navigate("/login", { replace: true }); }
  };

  return (
    <div className="admin-shell">
      {mobileOpen && <button type="button" className="admin-mobile-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <button type="button" className="admin-brand" onClick={() => navigate("/admin")} aria-label="Go to admin dashboard">
            <span className="admin-brand-mark"><FiBarChart2 /></span>
            <span className="admin-brand-copy"><strong>Food<span>App</span></strong><small>Restaurant OS</small></span>
          </button>
          <button type="button" className="admin-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><FiX /></button>
        </div>

        <div className="admin-nav-label">Workspace</div>
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, group }, index) => (
            <React.Fragment key={to}>
              {(index === 0 || NAV_ITEMS[index - 1].group !== group) && <div className="admin-nav-section">{group}</div>}
              <NavLink to={to} end={end} className={({ isActive }) => `admin-sidebar-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>
                <Icon className="admin-sidebar-icon" />
                <span>{label}</span>
                <FiChevronRight className="admin-sidebar-chevron" />
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        <div className="admin-sidebar-spacer" />
        <div className="admin-sidebar-store">
          <div className="admin-store-card">
            <span className="admin-store-status"><i /> Store online</span>
            <strong>Public storefront</strong>
            <button type="button" onClick={() => navigate("/")}>Open Store <FiChevronRight /></button>
          </div>
        </div>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-account">
            <div className="admin-user-avatar">{user?.profileImage ? <img src={user.profileImage} alt="" /> : (user?.name || "A").trim().charAt(0).toUpperCase()}</div>
            <div><strong>{user?.name || "Administrator"}</strong><span>Administrator</span></div>
          </div>
          <button type="button" className="admin-logout" onClick={handleLogout} aria-label="Sign out"><FiLogOut /></button>
        </div>
      </aside>

      <div className="admin-main-area">
        <header className="admin-topbar">
          <button type="button" className="admin-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><FiMenu /></button>
          <div className="admin-breadcrumb"><span>{section}</span><FiChevronRight /><strong>{title}</strong></div>
          <div className="admin-topbar-actions">
            <button type="button" className="admin-topbar-store" onClick={() => navigate("/")}>View Store</button>
            <div className="admin-topbar-avatar">{user?.profileImage ? <img src={user.profileImage} alt="" /> : (user?.name || "A").trim().charAt(0).toUpperCase()}</div>
          </div>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  );
};

export default AdminLayout;
