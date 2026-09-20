import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { createSocket } from "../config/socket";
import "../Styles/AdminDashboard.css";

const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
const statusLabel = (value) => String(value || "unknown").split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const formatDate = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const response = await fetch(API_URL + "/api/reviews/admin?page=1&limit=3", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || "Unable to load feedback.");
      setFeedback(Array.isArray(data.reviews) ? data.reviews.slice(0, 3) : []);
    } catch (feedbackError) {
      console.error("Admin feedback error:", feedbackError);
      setFeedback([]);
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_URL + "/api/admin/orders/dashboard-summary", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to load dashboard data.");
      setSummary(data);
    } catch (dashboardError) {
      console.error("Admin dashboard error:", dashboardError);
      setError(dashboardError.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadFeedback();
  }, [loadDashboard, loadFeedback]);

  useEffect(() => {
    const socket = createSocket();

    const refreshDashboard = () => {
      loadDashboard();
      loadFeedback();
    };

    socket.on("connect", refreshDashboard);
    socket.on("admin:order-updated", refreshDashboard);
    socket.on("admin:order-created", refreshDashboard);
    socket.on("disconnect", () => {});
    socket.connect();

    return () => {
      socket.off("connect", refreshDashboard);
      socket.off("admin:order-updated", refreshDashboard);
      socket.off("admin:order-created", refreshDashboard);
      socket.disconnect();
    };
  }, [loadDashboard, loadFeedback]);

  const stats = [
    { label: "Total Orders", value: loading ? "…" : summary?.stats?.totalOrders ?? "—", note: "All orders", tone: "red", icon: "▣" },
    { label: "Customers", value: loading ? "…" : summary?.stats?.customers ?? "—", note: "Registered users", tone: "green", icon: "♙" },
    { label: "Revenue", value: loading ? "…" : money(summary?.stats?.revenueToday), note: "Today", tone: "gold", icon: "₹" },
    { label: "Pending", value: loading ? "…" : summary?.stats?.pendingOrders ?? "—", note: "Active orders", tone: "dark", icon: "!" },
  ];
  const weeklySales = summary?.analytics?.weeklySales || [];
  const weeklyRevenue = weeklySales.reduce((total, day) => total + Number(day.revenue || 0), 0);
  const weeklyOrders = weeklySales.reduce((total, day) => total + Number(day.orders || 0), 0);
  const maxRevenue = Math.max(...weeklySales.map((day) => Number(day.revenue || 0)), 1);
  const popularItems = summary?.analytics?.popularItems || [];
  const quickActions = [
    { title: "Manage Orders", text: "Review, confirm and update active orders.", path: "/admin/orders", icon: "▣", tone: "red" },
    { title: "Customers", text: "View accounts and complete order history.", path: "/admin/customers", icon: "♙", tone: "green" },
    { title: "Food & Menu", text: "Manage dishes, prices and availability.", path: "/admin/menu", icon: "☷", tone: "gold" },
  ];

  return (
    <section className="admin-dashboard-page">
      <div className="admin-dashboard-hero"><div><span className="admin-dashboard-eyebrow">Restaurant operations</span><h2>Good to see you, Admin 👋</h2><p>Here is your Food App workspace. Keep orders moving and your restaurant running smoothly.</p></div><div className="admin-dashboard-hero-mark"><span>FOOD</span><strong>APP</strong><small>MANAGEMENT</small></div></div>
      {error && <div className="admin-orders-error" role="alert">{error}</div>}
      <div className="admin-dashboard-stats">{stats.map((stat) => <article className={"admin-stat-card " + stat.tone} key={stat.label}><div className="admin-stat-top"><span>{stat.label}</span><b>{stat.icon}</b></div><strong>{stat.value}</strong><small>{stat.note}</small></article>)}</div>
      <div className="admin-dashboard-main-grid">
        <section className="admin-dashboard-panel admin-quick-panel"><div className="admin-panel-heading"><div><span>Operations</span><h3>Quick actions</h3></div><span className="admin-live-dot">● Live</span></div><div className="admin-quick-actions">{quickActions.map((action) => <button type="button" className={"admin-quick-action " + action.tone} key={action.title} onClick={() => navigate(action.path)}><span className="admin-quick-icon">{action.icon}</span><span className="admin-quick-copy"><strong>{action.title}</strong><small>{action.text}</small></span><span className="admin-quick-arrow">→</span></button>)}</div></section>
        <section className="admin-dashboard-panel admin-health-panel"><div className="admin-panel-heading"><div><span>Recent activity</span><h3>Latest orders</h3></div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><button type="button" className="admin-dashboard-refresh" onClick={loadDashboard} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button><button type="button" onClick={() => navigate("/admin/orders")}>View all →</button></div></div><div className="admin-health-list">{loading ? <div><span className="health-dot"></span><span><strong>Loading orders...</strong><small>Please wait</small></span></div> : (summary?.recentOrders || []).length === 0 ? <div><span className="health-dot"></span><span><strong>No orders yet</strong><small>New orders will appear here</small></span></div> : summary.recentOrders.map((order) => <button type="button" className="admin-recent-order" key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)}><span className="health-check">✓</span><span><strong>{order.orderNumber || "Order"} · {money(order.pricing?.grandTotal)}</strong><small>{order.customer?.name || "Customer"} · {statusLabel(order.status)} · {formatDate(order.createdAt)}</small></span><b>→</b></button>)}</div></section>
      </div>

      <section className="admin-dashboard-panel admin-sales-panel"><div className="admin-panel-heading"><div><span>Performance</span><h3>Sales & revenue</h3></div><div className="admin-sales-summary"><strong>{money(weeklyRevenue)}</strong><small>Last 7 days · {weeklyOrders} orders</small></div></div><div className="admin-sales-chart">{weeklySales.length === 0 ? <div className="admin-sales-empty">No sales data yet</div> : weeklySales.map((day) => { const value=Number(day.revenue||0); const label=new Date(day.date+"T00:00:00+05:30").toLocaleDateString("en-IN",{weekday:"short"}); return <div className="admin-sales-day" key={day.date}><div className="admin-sales-bar-wrap"><span className="admin-sales-value">{money(value)}</span><div className="admin-sales-bar" style={{height: Math.max(8,(value/maxRevenue)*100)+"%"}}></div></div><strong>{label}</strong><small>{day.orders} {day.orders===1?"order":"orders"}</small></div>; })}</div></section>
      <section className="admin-dashboard-panel admin-popular-panel">
        <div className="admin-panel-heading">
          <div><span>Menu performance</span><h3>Popular items</h3></div>
          <button type="button" className="admin-feedback-view" onClick={() => navigate("/admin/menu")}>View menu →</button>
        </div>
        <div className="admin-popular-list">
          {loading ? <div className="admin-feedback-empty">Loading popular items...</div> : popularItems.length === 0 ? <div className="admin-feedback-empty">No sales data yet.</div> : popularItems.map((item, index) => (
            <button type="button" className="admin-popular-item" key={String(item.id || item.name)} onClick={() => navigate("/admin/menu")}>
              <span className="admin-popular-rank">{index + 1}</span>
              <span className="admin-popular-image">{item.image ? <img src={item.image} alt="" /> : <span>🍽</span>}</span>
              <span className="admin-popular-copy"><strong>{item.name}</strong><small>{item.quantity} sold · {item.orders} {item.orders === 1 ? "order" : "orders"}</small></span>
              <span className="admin-popular-revenue">{money(item.revenue)}</span>
              <span className="admin-popular-arrow">→</span>
            </button>
          ))}
        </div>
      </section>
      <section className="admin-dashboard-panel admin-feedback-dashboard"><div className="admin-panel-heading"><div><span>Customer voice</span><h3>Recent customer feedback</h3></div><button type="button" className="admin-feedback-view" onClick={() => navigate("/admin/reviews")}>View all →</button></div><div className="admin-feedback-list">{feedbackLoading ? <div className="admin-feedback-empty">Loading feedback...</div> : feedback.length === 0 ? <div className="admin-feedback-empty">No customer reviews yet.</div> : feedback.map((review) => <article className="admin-feedback-item" key={String(review._id)}><div className="admin-feedback-item-top"><span className="admin-feedback-avatar">{(review.customer || "C").trim().charAt(0).toUpperCase()}</span><span className="admin-feedback-customer"><strong>{review.customer || "Customer"}</strong><small>{review.food || "Food item"}</small></span></div><div className="admin-feedback-stars">{[1,2,3,4,5].map((star) => <span key={star} className={star <= Number(review.rating || 0) ? "active" : ""}>★</span>)}</div><p className="admin-feedback-comment">{review.comment || "Customer left a rating without written feedback."}</p></article>)}</div></section>
      <section className="admin-dashboard-panel admin-status-panel"><div className="admin-panel-heading"><div><span>Order pipeline</span><h3>Order status overview</h3></div><button type="button" className="admin-dashboard-refresh" onClick={() => navigate("/admin/orders")}>Manage orders →</button></div><div className="admin-status-grid">{[["placed","Placed","red"],["confirmed","Confirmed","blue"],["preparing","Preparing","gold"],["ready","Ready","green"],["out_for_delivery","Out for delivery","purple"],["delivered","Delivered","dark"],["picked_up","Picked up","green"],["cancelled","Cancelled","muted"]].map(([key,label,tone]) => <button type="button" className={"admin-status-card " + tone} key={key} onClick={() => navigate("/admin/orders")}><span>{label}</span><strong>{loading ? "…" : summary?.statusCounts?.[key] ?? 0}</strong></button>)}</div></section>
      <section className="admin-dashboard-bottom-banner"><div className="admin-banner-icon">✓</div><div><strong>Admin workspace is separate from the customer store</strong><p>Use this panel for restaurant operations. The public storefront remains available through “Back to Store”.</p></div><button type="button" onClick={() => navigate("/")}>Open Store →</button></section>
    </section>
  );
};

export default AdminDashboard;