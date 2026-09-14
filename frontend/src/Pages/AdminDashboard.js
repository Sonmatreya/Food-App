import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Orders",
      description: "Review incoming orders and update preparation, delivery and pickup status.",
      action: "Manage Orders",
      path: "/admin/orders",
      icon: "▣",
    },
    {
      title: "Customers",
      description: "View customer accounts, contact details and order history.",
      action: "Manage Customers",
      path: "/admin/customers",
      icon: "♙",
    },
    {
      title: "Food & Menu",
      description: "Manage food items, pricing, categories and availability.",
      action: "Manage Menu",
      path: "/admin/menu",
      icon: "☷",
      disabled: true,
    },
    {
      title: "Reports",
      description: "Review business performance, order trends and revenue reports.",
      action: "View Reports",
      path: "/admin/reports",
      icon: "▥",
      disabled: true,
    },
  ];

  return (
    <section className="admin-dashboard-page">
      <div className="admin-dashboard-intro">
        <div>
          <p className="admin-dashboard-eyebrow">Overview</p>
          <h2>Restaurant Dashboard</h2>
          <p>Manage the Food App from one dedicated administration workspace.</p>
        </div>
        <div className="admin-dashboard-badge">ADMIN</div>
      </div>

      <div className="admin-dashboard-grid">
        {sections.map((section) => (
          <article className="admin-dashboard-card" key={section.title}>
            <div className="admin-dashboard-card-icon">{section.icon}</div>
            <div className="admin-dashboard-card-content">
              <div className="admin-dashboard-card-heading">
                <h3>{section.title}</h3>
                {section.disabled && <span>Coming next</span>}
              </div>
              <p>{section.description}</p>
              <button
                type="button"
                disabled={section.disabled}
                onClick={() => navigate(section.path)}
              >
                {section.action} <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <section className="admin-dashboard-note">
        <strong>Admin workspace</strong>
        <p>
          Customer navigation and the public storefront are intentionally kept
          outside this panel. This area is reserved for restaurant operations.
        </p>
      </section>
    </section>
  );
};

export default AdminDashboard;
