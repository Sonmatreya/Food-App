import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const stats = [
    { label: "Total Orders", value: "—", note: "Live order data", tone: "red", icon: "▣" },
    { label: "Customers", value: "—", note: "Registered users", tone: "green", icon: "♙" },
    { label: "Revenue", value: "—", note: "Today", tone: "gold", icon: "₹" },
    { label: "Pending", value: "—", note: "Needs attention", tone: "dark", icon: "!" },
  ];
  const quickActions = [
    { title: "Manage Orders", text: "Review, confirm and update active orders.", path: "/admin/orders", icon: "▣", tone: "red" },
    { title: "Customers", text: "View accounts and complete order history.", path: "/admin/customers", icon: "♙", tone: "green" },
    { title: "Food & Menu", text: "Manage dishes, prices and availability.", path: "/admin/menu", icon: "☷", tone: "gold" },
  ];
  return (
    <section className="admin-dashboard-page">
      <div className="admin-dashboard-hero"><div><span className="admin-dashboard-eyebrow">Restaurant operations</span><h2>Good to see you, Admin 👋</h2><p>Here is your Food App workspace. Keep orders moving and your restaurant running smoothly.</p></div><div className="admin-dashboard-hero-mark"><span>FOOD</span><strong>APP</strong><small>MANAGEMENT</small></div></div>
      <div className="admin-dashboard-stats">{stats.map((stat) => <article className={`admin-stat-card ${stat.tone}`} key={stat.label}><div className="admin-stat-top"><span>{stat.label}</span><b>{stat.icon}</b></div><strong>{stat.value}</strong><small>{stat.note}</small></article>)}</div>
      <div className="admin-dashboard-main-grid">
        <section className="admin-dashboard-panel admin-quick-panel"><div className="admin-panel-heading"><div><span>Operations</span><h3>Quick actions</h3></div><span className="admin-live-dot">● Live</span></div><div className="admin-quick-actions">{quickActions.map((action) => <button type="button" className={`admin-quick-action ${action.tone}`} key={action.title} onClick={() => navigate(action.path)}><span className="admin-quick-icon">{action.icon}</span><span className="admin-quick-copy"><strong>{action.title}</strong><small>{action.text}</small></span><span className="admin-quick-arrow">→</span></button>)}</div></section>
        <section className="admin-dashboard-panel admin-health-panel"><div className="admin-panel-heading"><div><span>System</span><h3>Workspace health</h3></div><span className="admin-health-badge">Ready</span></div><div className="admin-health-list"><div><span className="health-check">✓</span><span><strong>Customer management</strong><small>Available</small></span></div><div><span className="health-check">✓</span><span><strong>Order management</strong><small>Available</small></span></div><div><span className="health-check">✓</span><span><strong>Menu management</strong><small>Available</small></span></div><div><span className="health-dot"></span><span><strong>Reports & analytics</strong><small>Coming next</small></span></div></div></section>
      </div>
      <section className="admin-dashboard-bottom-banner"><div className="admin-banner-icon">✓</div><div><strong>Admin workspace is separate from the customer store</strong><p>Use this panel for restaurant operations. The public storefront remains available through “Back to Store”.</p></div><button type="button" onClick={() => navigate("/")}>Open Store →</button></section>
    </section>
  );
};
export default AdminDashboard;
