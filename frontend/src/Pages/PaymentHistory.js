import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/CustomerTools.css";

const paymentLabels = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  cod: "Cash on Delivery",
  demo: "Demo card (test payment)",
};

const statusLabels = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/orders?page=1&limit=50`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load payment history.");
      }
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || "Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

  return (
    <main className="customer-tool-page">
      <section className="customer-tool-hero">
        <span>YOUR ACCOUNT</span>
        <h1>Payment & Order History</h1>
        <p>Review the payment method, payment status and total recorded for each order.</p>
      </section>
      <section className="customer-tool-content">
        {loading ? (
          <div className="tool-state">Loading your order and payment history…</div>
        ) : error ? (
          <div className="tool-state error" role="alert">
            <h2>History could not be loaded</h2>
            <p>{error}</p>
            <button type="button" onClick={loadOrders}>Try again</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="tool-state">
            <h2>No payment history yet</h2>
            <p>Your completed and current orders will appear here after you place an order.</p>
            <button type="button" onClick={() => navigate("/menu")}>Browse Menu</button>
          </div>
        ) : (
          <div className="payment-history-list">
            {orders.map((order) => {
              const pricing = order.pricing || {};
              const orderId = order.orderNumber || order._id || order.id;
              return (
                <article className="security-card" key={order._id || order.id || orderId} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <h2 style={{ marginTop: 0 }}>{orderId ? `Order ${orderId}` : "Order"}</h2>
                      <p>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "Date unavailable"}</p>
                    </div>
                    <strong>{money(pricing.grandTotal ?? order.grandTotal)}</strong>
                  </div>
                  <p><strong>Payment method:</strong> {paymentLabels[order.paymentMethod] || order.paymentMethod || "Not recorded"}</p>
                  <p><strong>Payment status:</strong> {order.paymentStatus || "Not recorded"}</p>
                  <p><strong>Order status:</strong> {statusLabels[order.status] || order.status || "Unknown"}</p>
                  <p><strong>Items:</strong> {Array.isArray(order.items) ? order.items.map((item) => `${item.name || "Food"} × ${item.quantity || 1}`).join(", ") : "Details unavailable"}</p>
                  {pricing.couponCode ? <p><strong>Coupon:</strong> {pricing.couponCode} · discount {money(pricing.discount)}</p> : null}
                </article>
              );
            })}
            <button type="button" onClick={loadOrders}>Refresh history</button>
          </div>
        )}
      </section>
    </main>
  );
}
