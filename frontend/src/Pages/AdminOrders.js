import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { createSocket } from "../config/socket";
import "../Styles/AdminOrders.css";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "cancelled"];
const NEXT_STATUSES = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["cancelled", "picked_up"],
  out_for_delivery: [],
  cancelled: [],
};

const statusLabel = (value) => String(value || "unknown").split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const money = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString("en-IN", { style: "currency", currency: "INR" }) : "₹0.00";
};

const getNextStatuses = (order) => {
  if (!order || ["delivered", "picked_up", "cancelled"].includes(order.status)) return [];
  const next = [...(NEXT_STATUSES[order.status] || [])];
  if (order.status === "ready") {
    if (order.deliveryType === "delivery") return ["out_for_delivery", "cancelled"];
    return ["picked_up", "cancelled"];
  }
  return next;
};

const getAddressText = (order) => {
  if (order?.deliveryType !== "delivery" || !order?.address) return "Customer pickup";
  const address = order.address;
  const parts = [address.addressLine, address.city, address.pincode].filter(Boolean);
  return parts.join(", ") || "Address not provided";
};

const getMapUrl = (order) => {
  const latitude = Number(order?.location?.latitude);
  const longitude = Number(order?.location?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [orderSummary, setOrderSummary] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "", paymentStatus: "", deliveryType: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (pageNumber, activeFilters) => {
    setLoading(true); setError("");
    const params = new URLSearchParams({ page: String(pageNumber), limit: String(PAGE_SIZE) });
    Object.entries(activeFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    try {
      const response = await fetch(`${API_URL}/api/admin/orders?${params.toString()}`, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
      let data = null; try { data = await response.json(); } catch { data = null; }
      if (!response.ok) { setError(response.status === 403 ? "You do not have permission to manage orders." : data?.message || "Unable to load orders."); return; }
      setOrders(Array.isArray(data?.orders) ? data.orders : []); setPagination(data?.pagination || null); setOrderSummary(data?.summary || null); setPage(pageNumber);
    } catch (fetchError) {
      console.error("Admin orders fetch error:", fetchError);
      setError("Unable to connect to the server. Please check your connection and try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(1, appliedFilters); }, [fetchOrders, appliedFilters]);

  useEffect(() => {
    const socket = createSocket();
    const refreshOrders = () => { fetchOrders(page, appliedFilters); };
    socket.on("connect", () => {});
    socket.on("admin:order-updated", refreshOrders);
    socket.on("admin:order-created", refreshOrders);
    socket.connect();
    return () => {
      socket.off("admin:order-updated", refreshOrders);
      socket.off("admin:order-created", refreshOrders);
      socket.disconnect();
    };
  }, [fetchOrders, page, appliedFilters]);

  const handleFilterSubmit = (event) => { event.preventDefault(); setAppliedFilters({ ...filters }); };
  const handleReset = () => { const empty = { search: "", status: "", paymentStatus: "", deliveryType: "" }; setFilters(empty); setAppliedFilters(empty); };

  const updateStatus = async (orderId, status) => {
    if (!orderId || !status) return;
    setUpdatingId(orderId); setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(orderId)}/status`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ status }) });
      let data = null; try { data = await response.json(); } catch { data = null; }
      if (!response.ok) { setError(data?.message || "Unable to update order status."); return; }
      const updated = data?.order;
      if (updated) setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
    } catch (updateError) {
      console.error("Admin order status error:", updateError);
      setError("Unable to update the order. Please try again.");
    } finally { setUpdatingId(""); }
  };

  const hasMore = Boolean(pagination?.hasMore ?? (pagination && page < Number(pagination.totalPages || 0)));

  return (
    <main className="admin-orders-page">
      <header className="admin-orders-header">
        <div><p className="admin-orders-eyebrow">Administration</p><h1>Orders</h1><p>Monitor customer orders, delivery information and operational status.</p></div>
        <button type="button" className="admin-orders-customers-link" onClick={() => navigate("/admin/customers")}>Customers</button>
      </header>

      <form className="admin-orders-filters" onSubmit={handleFilterSubmit}>
        <input value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} placeholder="Search order, name, email or phone" aria-label="Search orders" />
        <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))} aria-label="Filter by order status">
          <option value="">All statuses</option>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          <option value="delivered">Delivered</option><option value="picked_up">Picked Up</option>
        </select>
        <select value={filters.paymentStatus} onChange={(e) => setFilters((current) => ({ ...current, paymentStatus: e.target.value }))} aria-label="Filter by payment status"><option value="">All payments</option><option value="pending">Pending</option><option value="cod_pending">COD Pending</option><option value="paid">Paid</option><option value="failed">Failed</option></select>
        <select value={filters.deliveryType} onChange={(e) => setFilters((current) => ({ ...current, deliveryType: e.target.value }))} aria-label="Filter by fulfillment type"><option value="">Delivery & Pickup</option><option value="delivery">Delivery</option><option value="pickup">Pickup</option></select>
        <button type="submit" className="admin-orders-filter-button">Filter</button><button type="button" className="admin-orders-reset-button" onClick={handleReset}>Reset</button>
      </form>

      {error && <div className="admin-orders-error" role="alert">{error}</div>}

      {pagination && <section className="admin-order-summary">
        <article><span>Total orders</span><strong>{pagination.total || 0}</strong><small>Matching current filters</small></article>
        <article><span>Active</span><strong>{orderSummary?.active ?? "—"}</strong><small>Still in progress</small></article>
        <article><span>Completed</span><strong>{orderSummary?.delivered ?? "—"}</strong><small>Delivered / picked up</small></article>
        <article><span>Revenue</span><strong>{money(orderSummary?.revenue)}</strong><small>Excluding cancelled</small></article>
      </section>}

      {loading ? <section className="admin-orders-state"><div className="admin-orders-spinner" /><h2>Loading orders...</h2><p>Please wait while order information is loaded.</p></section> : orders.length === 0 ? <section className="admin-orders-state"><div className="admin-orders-state-icon">📦</div><h2>No orders found</h2><p>Try changing the search or filters.</p></section> : <>
        <section className="admin-orders-list">{orders.map((order) => {
          const orderId = order.id || order._id;
          const customer = order.customer || {};
          const total = order?.pricing?.grandTotal || 0;
          const itemsCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0;
          const completed = ["delivered", "picked_up"].includes(order.status);
          const nextStatuses = getNextStatuses(order);
          const mapUrl = getMapUrl(order);
          const landmark = order?.address?.landmark || "";
          return <article className="admin-order-card" key={orderId || order.orderNumber}>
            <div className="admin-order-card-top">
              <div><span className="admin-order-number">{order.orderNumber || "Order"}</span><p>{formatDate(order.createdAt)}</p></div>
              <span className={`admin-order-status status-${order.status}`}>{statusLabel(order.status)}</span>
            </div>

            <div className="admin-order-card-body">
              <div><span>Customer</span><strong>{customer.name || "Unknown customer"}</strong><small>{customer.email || customer.phone || "—"}</small>{customer.id && <button type="button" className="admin-order-customer-link" onClick={() => navigate(`/admin/customers/${customer.id}`)}>View customer</button>}</div>
              <div><span>Delivery</span><strong>{order.deliveryType === "pickup" ? "Pickup" : "Delivery"}</strong><small className="admin-order-address">{getAddressText(order)}</small>{landmark && <small className="admin-order-landmark">🏷️ {landmark}</small>}{mapUrl && <a className="admin-order-map-link" href={mapUrl} target="_blank" rel="noreferrer">📍 Open map</a>}{order?.location?.locationText && <small className="admin-order-location-text">{order.location.locationText}</small>}</div>
              <div><span>Payment</span><strong>{String(order.paymentMethod || "—").toUpperCase()}</strong><small>{statusLabel(order.paymentStatus)}</small></div>
              <div><span>Order</span><strong>{itemsCount} item{itemsCount === 1 ? "" : "s"}</strong><small>{order.pricing?.couponCode ? `Coupon: ${order.pricing.couponCode}` : "No coupon"} · {money(total)}</small></div>
            </div>

            <div className="admin-order-card-actions">
              <select value={order.status || ""} disabled={completed || updatingId === orderId || nextStatuses.length === 0} onChange={(e) => updateStatus(orderId, e.target.value)} aria-label={`Update ${order.orderNumber || "order"} status`}>
                {completed ? <option value={order.status}>{statusLabel(order.status)}</option> : <><option value={order.status}>{statusLabel(order.status)} (current)</option>{nextStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</>}
              </select>
              <button type="button" onClick={() => navigate(`/admin/orders/${orderId}`)} disabled={!orderId}>View Details</button>
            </div>
          </article>;
        })}</section>

        <div className="admin-orders-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => fetchOrders(page - 1, appliedFilters)}>← Previous</button><span>Page {page}{pagination?.totalPages ? ` of ${pagination.totalPages}` : ""}</span><button type="button" disabled={!hasMore || loading} onClick={() => fetchOrders(page + 1, appliedFilters)}>Next →</button></div>
      </>}
    </main>
  );
};

export default AdminOrders;
