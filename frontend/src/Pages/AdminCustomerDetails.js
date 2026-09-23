import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/AdminCustomerDetails.css";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0.00";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
};

const getErrorMessage = (data, status) => {
  if (status === 401) return "You are not authenticated. Please log in again.";
  if (status === 403) return "You do not have permission to view customer details.";
  if (status === 404) return "Customer not found.";
  if (status >= 500) return "The server is currently unavailable. Please try again later.";
  return data?.message || "Unable to load customer details.";
};

const getOrderId = (order) => order?.id || order?._id || "";

const getStatusLabel = (status) => {
  if (!status) return "Unknown";
  return String(status)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const AdminCustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verificationUpdating, setVerificationUpdating] = useState(false);

  const fetchCustomerDetails = useCallback(async () => {
    if (!id) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/customers/${encodeURIComponent(id)}`,
        {
          method: "GET",
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

      if (!response.ok) {
        setError(getErrorMessage(data, response.status));
        return;
      }

      setCustomer(data?.customer || null);
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setPagination(data?.pagination || null);
    } catch (fetchError) {
      console.error("Admin customer details error:", fetchError);
      setError(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const handleToggleVerification = async () => {
    if (!customer || verificationUpdating) return;
    const nextValue = !Boolean(customer.isVerified);
    setVerificationUpdating(true);
    setError("");

    try {
      const response = await fetch(
        API_URL + "/api/admin/customers/" + encodeURIComponent(id) + "/verification",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ isVerified: nextValue }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message || "Unable to update customer verification."
        );
        return;
      }

      setCustomer((previous) =>
        previous ? { ...previous, isVerified: nextValue } : previous
      );
    } catch (verificationError) {
      console.error("Customer verification update error:", verificationError);
      setError("Unable to update customer verification. Please try again.");
    } finally {
      setVerificationUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-customer-details-page">
        <section className="admin-customer-details-state">
          <div className="admin-customer-details-spinner" />
          <h2>Loading customer details...</h2>
          <p>Please wait while the customer information is loaded.</p>
        </section>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="admin-customer-details-page">
        <button
          type="button"
          className="admin-customer-details-back"
          onClick={() => navigate("/admin/customers")}
        >
          ← Back to Customers
        </button>
        <section className="admin-customer-details-state admin-customer-details-error">
          <div className="admin-customer-details-state-icon">!</div>
          <h2>Unable to load customer</h2>
          <p>{error || "Customer information is unavailable."}</p>
          <button
            type="button"
            className="admin-customer-details-retry"
            onClick={fetchCustomerDetails}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  const isVerified = Boolean(customer.isVerified);
  const orderCount = Number(pagination?.total ?? orders.length) || 0;

  return (
    <main className="admin-customer-details-page">
      <div className="admin-customer-details-topbar">
        <button
          type="button"
          className="admin-customer-details-back"
          onClick={() => navigate("/admin/customers")}
        >
          ← Back to Customers
        </button>
      </div>

      <header className="admin-customer-details-header">
        <div>
          <p className="admin-customer-details-eyebrow">Administration</p>
          <h1>Customer Details</h1>
          <p>View customer account information and order history.</p>
        </div>

        <div className="admin-customer-details-header-actions">
          {customer.email ? (
            <a
              className="admin-customer-contact-button"
              href={"mailto:" + customer.email}
            >
              ✉ Email
            </a>
          ) : null}

          {customer.phone ? (
            <a
              className="admin-customer-contact-button"
              href={"tel:" + customer.phone}
            >
              ☎ Call
            </a>
          ) : null}

          <button
            type="button"
            className={
              "admin-customer-details-verification admin-customer-details-verification-button " +
              (isVerified ? "is-verified" : "is-not-verified")
            }
            onClick={handleToggleVerification}
            disabled={verificationUpdating}
          >
            {verificationUpdating
              ? "Updating..."
              : isVerified
                ? "Verified • Click to Unverify"
                : "Not Verified • Click to Verify"}
          </button>
        </div>
      </header>

      <section className="admin-customer-details-card admin-customer-profile-card">
        <div className="admin-customer-profile-heading">
          <div className="admin-customer-avatar">
            {(customer.name || "C").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{customer.name || "Unnamed Customer"}</h2>
            <p>{customer.email || "No email available"}</p>
          </div>
        </div>

        <div className="admin-customer-info-grid">
          <div className="admin-customer-info-item"><span>Full Name</span><strong>{customer.name || "—"}</strong></div>
          <div className="admin-customer-info-item"><span>Email</span><strong>{customer.email || "—"}</strong></div>
          <div className="admin-customer-info-item"><span>Phone</span><strong>{customer.phone || "—"}</strong></div>
          <div className="admin-customer-info-item"><span>Verification</span><strong>{isVerified ? "Verified" : "Not Verified"}</strong></div>
          <div className="admin-customer-info-item"><span>Registered</span><strong>{formatDate(customer.createdAt)}</strong></div>
          <div className="admin-customer-info-item"><span>Last Order</span><strong>{formatDate(customer.lastOrderDate)}</strong></div>
        </div>
      </section>

      <section className="admin-customer-summary-grid">
        <div className="admin-customer-summary-card"><span>Total Orders</span><strong>{Number(customer.totalOrders) || 0}</strong></div>
        <div className="admin-customer-summary-card"><span>Total Spent</span><strong>{formatCurrency(customer.totalSpent)}</strong></div>
        <div className="admin-customer-summary-card"><span>Account Since</span><strong>{formatDate(customer.createdAt)}</strong></div>
      </section>

      <section className="admin-customer-details-card admin-customer-orders-card">
        <div className="admin-customer-orders-header">
          <div>
            <h2>Order History</h2>
            <p>Orders associated with this customer account.</p>
          </div>
          <span className="admin-customer-order-count">
            {orderCount} order{orderCount === 1 ? "" : "s"}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="admin-customer-orders-empty">
            <h3>No orders found</h3>
            <p>This customer has not placed any orders yet.</p>
          </div>
        ) : (
          <div className="admin-customer-orders-list">
            {orders.map((order) => {
              const orderId = getOrderId(order);
              const grandTotal =
                order?.pricing?.grandTotal ?? order?.grandTotal ?? 0;

              return (
                <button
                  className="admin-customer-order-row"
                  key={orderId || order.orderNumber}
                  type="button"
                  onClick={() => {
                    if (orderId) navigate(`/admin/orders/${orderId}`);
                  }}
                  disabled={!orderId}
                  aria-label={`View ${order.orderNumber || "order"} details`}
                >
                  <span className="admin-customer-order-main">
                    <strong>{order.orderNumber || "Order"}</strong>
                    <span>
                      {formatDateTime(order.createdAt || order.orderDate)}
                    </span>
                  </span>

                  <span className="admin-customer-order-meta">
                    <span>
                      {Array.isArray(order.items)
                        ? `${order.items.length} item${order.items.length === 1 ? "" : "s"}`
                        : "Order"}
                    </span>
                    <span>
                      {order.deliveryType === "pickup" ? "Pickup" : "Delivery"}
                    </span>
                  </span>

                  <span className="admin-customer-order-status">
                    {getStatusLabel(order.status)}
                  </span>

                  <span className="admin-customer-order-payment">
                    {order.paymentMethod || "Payment"} ·{" "}
                    {getStatusLabel(order.paymentStatus || "pending")}
                  </span>

                  <strong className="admin-customer-order-total">
                    {formatCurrency(grandTotal)}
                  </strong>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminCustomerDetails;
