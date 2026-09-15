import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/AdminOrderDetails.css";

const operationalStatuses = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "cancelled"];
const label = (value) => String(value || "unknown").split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(id)}`, { credentials: "include", headers: { Accept: "application/json" } });
      let data = null; try { data = await response.json(); } catch { data = null; }
      if (!response.ok || !data?.order) { setError(response.status === 403 ? "You do not have permission to view this order." : data?.message || "Order not found."); return; }
      setOrder(data.order);
    } catch (fetchError) {
      console.error("Admin order details error:", fetchError);
      setError("Unable to connect to the server. Please check your connection and try again.");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const updateStatus = async (status) => {
    if (!status || !order || ["delivered", "picked_up"].includes(order.status)) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ status }) });
      let data = null; try { data = await response.json(); } catch { data = null; }
      if (!response.ok) { setError(data?.message || "Unable to update order status."); return; }
      setOrder(data.order || order);
    } catch (updateError) {
      console.error("Admin order update error:", updateError);
      setError("Unable to update the order. Please try again.");
    } finally { setSaving(false); }
  };

  if (loading) return <main className="admin-order-details-page"><section className="admin-order-details-state"><div className="admin-order-details-spinner" /><h2>Loading order details...</h2><p>Please wait while the order information is loaded.</p></section></main>;

  if (error || !order) return <main className="admin-order-details-page"><button className="admin-order-details-back" type="button" onClick={() => navigate("/admin/orders")}>← Back to Orders</button><section className="admin-order-details-state"><div className="admin-order-details-state-icon">!</div><h2>Unable to load order</h2><p>{error || "Order information is unavailable."}</p><button className="admin-order-details-retry" type="button" onClick={fetchOrder}>Try Again</button></section></main>;

  const customer = order.customer || {};
  const pricing = order.pricing || {};
  const completed = ["delivered", "picked_up"].includes(order.status);
  const itemsCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <main className="admin-order-details-page">
      <button className="admin-order-details-back" type="button" onClick={() => navigate("/admin/orders")}>← Back to Orders</button>
      <header className="admin-order-details-header"><div><p>Administration</p><h1>{order.orderNumber || "Order Details"}</h1><span>Placed {dateTime(order.createdAt)}</span></div><span className={`admin-order-details-status status-${order.status}`}>{label(order.status)}</span></header>

      {error && <div className="admin-order-details-error" role="alert">{error}</div>}

      <section className="admin-order-details-card admin-order-status-card">
        <div><h2>Order Status</h2><p>Update the operational stage for this order. Delivered and picked-up are completed through handover verification.</p></div>
        <select value={order.status || ""} disabled={completed || saving} onChange={(event) => updateStatus(event.target.value)} aria-label="Update order status">
          {operationalStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          {completed && <option value={order.status}>{label(order.status)}</option>}
        </select>
      </section>

      <section className="admin-order-details-card">
        <div className="admin-order-details-card-header"><div><h2>Customer</h2><p>Customer information associated with this order.</p></div></div>
        <div className="admin-order-details-info-grid"><div><span>Name</span><strong>{customer.name || "—"}</strong></div><div><span>Email</span><strong>{customer.email || "—"}</strong></div><div><span>Phone</span><strong>{customer.phone || "—"}</strong></div></div>
      </section>

      <section className="admin-order-details-card">
        <div className="admin-order-details-card-header"><div><h2>Items</h2><p>{itemsCount} item{itemsCount === 1 ? "" : "s"} in this order.</p></div></div>
        <div className="admin-order-items">{(order.items || []).map((item, index) => <div className="admin-order-item" key={`${item.foodId || item.name}-${index}`}><div className="admin-order-item-image">{item.image ? <img src={item.image} alt="" /> : <span>🍽️</span>}</div><div className="admin-order-item-main"><strong>{item.name || "Food item"}</strong><span>{item.category || ""}{item.cookingRequest ? ` · ${item.cookingRequest}` : ""}</span><small>{money(item.price)} × {item.quantity}</small></div><strong>{money(Number(item.price || 0) * Number(item.quantity || 0))}</strong></div>)}</div>
      </section>

      <div className="admin-order-details-two-column">
        <section className="admin-order-details-card"><div className="admin-order-details-card-header"><div><h2>Fulfillment</h2><p>{order.deliveryType === "pickup" ? "Customer pickup" : "Delivery information"}</p></div></div>{order.deliveryType === "delivery" && order.address ? <div className="admin-order-address"><strong>{order.address.name || "Delivery Address"}</strong><span>{order.address.phone || ""}</span><span>{order.address.addressLine || ""}</span><span>{order.address.city || ""} {order.address.pincode || ""}</span></div> : <div className="admin-order-pickup">Customer will collect this order from the restaurant.</div>}</section>
        <section className="admin-order-details-card"><div className="admin-order-details-card-header"><div><h2>Payment</h2><p>Payment and pricing summary.</p></div></div><div className="admin-order-pricing"><div><span>Subtotal</span><strong>{money(pricing.subtotal)}</strong></div><div><span>Discount</span><strong>-{money(pricing.discount)}</strong></div><div><span>Delivery Fee</span><strong>{money(pricing.deliveryFee)}</strong></div><div><span>Service Fee</span><strong>{money(pricing.serviceFee)}</strong></div><div><span>Tax</span><strong>{money(pricing.tax)}</strong></div><div className="grand"><span>Total</span><strong>{money(pricing.grandTotal)}</strong></div></div><div className="admin-order-payment-badge"><span>{String(order.paymentMethod || "—").toUpperCase()}</span><strong>{label(order.paymentStatus)}</strong></div></section>
      </div>

      {order.handover?.verifiedAt && <section className="admin-order-details-card admin-order-handover"><h2>Handover Verification</h2><p>Customer handover OTP was verified on {dateTime(order.handover.verifiedAt)}.</p></section>}
    </main>
  );
};

export default AdminOrderDetails;
