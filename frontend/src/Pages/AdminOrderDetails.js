import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import { createSocket } from "../config/socket";
import "../Styles/AdminOrderDetails.css";

const NEXT_STATUSES = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["cancelled", "picked_up"],
  out_for_delivery: [],
  cancelled: [],
};

const label = (value) =>
  String(value || "unknown")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });

const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const getNextStatuses = (order) => {
  if (!order || ["delivered", "picked_up", "cancelled"].includes(order.status)) {
    return [];
  }

  const next = [...(NEXT_STATUSES[order.status] || [])];

  if (order.status === "ready") {
    if (order.deliveryType === "delivery") {
      return ["out_for_delivery", "cancelled"];
    }
    return ["picked_up", "cancelled"];
  }

  return next;
};

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/orders/${encodeURIComponent(id)}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.order) {
        setError(
          response.status === 403
            ? "You do not have permission to view this order."
            : data?.message || "Order not found."
        );
        return;
      }

      setOrder(data.order);
    } catch (fetchError) {
      console.error("Admin order details error:", fetchError);
      setError(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Keep the details page synchronized when another admin changes the order.
  useEffect(() => {
    const socket = createSocket();

    const handleOrderUpdated = (payload) => {
      if (String(payload?.orderId) !== String(id)) return;
      fetchOrder();
    };

    socket.on("connect", () => {
      console.info("Admin order details socket connected");
    });
    socket.on("admin:order-updated", handleOrderUpdated);
    socket.on("connect_error", (socketError) => {
      console.warn("Admin order details socket error:", socketError.message);
    });

    return () => {
      socket.off("admin:order-updated", handleOrderUpdated);
      socket.disconnect();
    };
  }, [id, fetchOrder]);

  const updateStatus = async (status) => {
    if (!status || !order || ["delivered", "picked_up"].includes(order.status)) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/orders/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        setError(data?.message || "Unable to update order status.");
        return;
      }

      setOrder(data.order || order);
    } catch (updateError) {
      console.error("Admin order update error:", updateError);
      setError("Unable to update the order. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-order-details-page">
        <section className="admin-order-details-state">
          <div className="admin-order-details-spinner" />
          <h2>Loading order details...</h2>
          <p>Please wait while the order information is loaded.</p>
        </section>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="admin-order-details-page">
        <button
          className="admin-order-details-back"
          type="button"
          onClick={() => navigate("/admin/orders")}
        >
          ← Back to Orders
        </button>
        <section className="admin-order-details-state">
          <div className="admin-order-details-state-icon">!</div>
          <h2>Unable to load order</h2>
          <p>{error || "Order information is unavailable."}</p>
          <button
            className="admin-order-details-retry"
            type="button"
            onClick={fetchOrder}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  const customer = order.customer || {};
  const pricing = order.pricing || {};
  const completed = ["delivered", "picked_up"].includes(order.status);
  const nextStatuses = getNextStatuses(order);
  const itemsCount = (order.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <main className="admin-order-details-page">
      <button
        className="admin-order-details-back"
        type="button"
        onClick={() => navigate("/admin/orders")}
      >
        ← Back to Orders
      </button>

      <header className="admin-order-details-header">
        <div>
          <p>Administration</p>
          <h1>{order.orderNumber || "Order Details"}</h1>
          <span>Placed {dateTime(order.createdAt)}</span>
        </div>
        <div className="admin-order-details-header-actions">
          {customer.id && (
            <button
              className="admin-order-details-customer"
              type="button"
              onClick={() => navigate(`/admin/customers/${customer.id}`)}
            >
              View Customer
            </button>
          )}
          <span className={`admin-order-details-status status-${order.status}`}>
            {label(order.status)}
          </span>
        </div>
      </header>

      {error && (
        <div className="admin-order-details-error" role="alert">
          {error}
        </div>
      )}

      <section className="admin-order-details-card admin-order-status-card">
        <div>
          <h2>Order Status</h2>
          <p>
            {completed
              ? "This order is completed through handover verification."
              : "Follow the restaurant workflow. Completed delivery or pickup is recorded through handover verification."}
          </p>
        </div>

        <select
          value={order.status || ""}
          disabled={completed || saving || nextStatuses.length === 0}
          onChange={(event) => updateStatus(event.target.value)}
          aria-label="Update order status"
        >
          {completed ? (
            <option value={order.status}>{label(order.status)}</option>
          ) : (
            <>
              <option value={order.status}>
                {label(order.status)} (current)
              </option>
              {nextStatuses.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </>
          )}
        </select>
      </section>

      <section className="admin-order-details-card">
        <div className="admin-order-details-card-header">
          <div>
            <h2>Customer</h2>
            <p>Customer information associated with this order.</p>
          </div>
        </div>

        <div className="admin-order-details-info-grid">
          <div>
            <span>Name</span>
            <strong>{customer.name || "—"}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{customer.email || "—"}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{customer.phone || "—"}</strong>
          </div>
        </div>
      </section>

      <section className="admin-order-details-card">
        <div className="admin-order-details-card-header">
          <div>
            <h2>Items</h2>
            <p>
              {itemsCount} item{itemsCount === 1 ? "" : "s"} in this order.
            </p>
          </div>
        </div>

        <div className="admin-order-items">
          {(order.items || []).map((item, index) => (
            <div
              className="admin-order-item"
              key={`${item.foodId || item.name}-${index}`}
            >
              <div className="admin-order-item-image">
                {item.image ? <img src={item.image} alt="" /> : <span>🍽️</span>}
              </div>

              <div className="admin-order-item-main">
                <strong>{item.name || "Food item"}</strong>
                <span>
                  {item.category || ""}
                  {item.cookingRequest ? ` · ${item.cookingRequest}` : ""}
                </span>
                <small>
                  {money(item.price)} × {item.quantity}
                </small>
              </div>

              <strong>
                {money(Number(item.price || 0) * Number(item.quantity || 0))}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-order-details-two-column">
        <section className="admin-order-details-card">
          <div className="admin-order-details-card-header">
            <div>
              <h2>Fulfillment</h2>
              <p>
                {order.deliveryType === "pickup"
                  ? "Customer pickup"
                  : "Delivery information"}
              </p>
            </div>
          </div>

          {order.deliveryType === "delivery" && order.address ? (
            <div className="admin-order-address">
              <strong>{order.address.name || "Delivery Address"}</strong>
              <span>{order.address.phone || ""}</span>
              <span>{order.address.addressLine || ""}</span>
              <span>
                {order.address.city || ""} {order.address.pincode || ""}
              </span>
              {order.location?.locationText && (
                <span>{order.location.locationText}</span>
              )}
            </div>
          ) : (
            <div className="admin-order-pickup">
              Customer will collect this order from the restaurant.
            </div>
          )}
        </section>

        <section className="admin-order-details-card">
          <div className="admin-order-details-card-header">
            <div>
              <h2>Payment</h2>
              <p>Payment and pricing summary.</p>
            </div>
          </div>

          <div className="admin-order-pricing">
            <div>
              <span>Subtotal</span>
              <strong>{money(pricing.subtotal)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>-{money(pricing.discount)}</strong>
            </div>
            <div>
              <span>Delivery Fee</span>
              <strong>{money(pricing.deliveryFee)}</strong>
            </div>
            <div>
              <span>Service Fee</span>
              <strong>{money(pricing.serviceFee)}</strong>
            </div>
            <div>
              <span>Tax</span>
              <strong>{money(pricing.tax)}</strong>
            </div>
            <div className="grand">
              <span>Total</span>
              <strong>{money(pricing.grandTotal)}</strong>
            </div>
          </div>

          <div className="admin-order-payment-badge">
            <span>{String(order.paymentMethod || "—").toUpperCase()}</span>
            <strong>{label(order.paymentStatus)}</strong>
          </div>
        </section>
      </div>

      <section className="admin-order-details-card">
        <div className="admin-order-details-card-header">
          <div>
            <h2>Status History</h2>
            <p>Operational audit trail for this order.</p>
          </div>
        </div>

        <div className="admin-order-history">
          {(Array.isArray(order.statusHistory) && order.statusHistory.length
            ? order.statusHistory
            : [{ status: order.status, changedAt: order.createdAt }]
          ).map((entry, index, history) => (
            <div
              className="admin-order-history-item"
              key={String(entry.changedAt) + "-" + index}
            >
              <div className="admin-order-history-dot" />
              <div className="admin-order-history-content">
                <strong>{label(entry.status)}</strong>
                <span>{dateTime(entry.changedAt)}</span>
              </div>
              {index < history.length - 1 && (
                <div className="admin-order-history-line" />
              )}
            </div>
          ))}
        </div>
      </section>

      {order.handover?.verifiedAt && (
        <section className="admin-order-details-card admin-order-handover">
          <h2>Handover Verification</h2>
          <p>
            Customer handover OTP was verified on{" "}
            {dateTime(order.handover.verifiedAt)}.
          </p>
        </section>
      )}
    </main>
  );
};

export default AdminOrderDetails;
