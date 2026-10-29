import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../Styles/MyOrders.css";
import OrderInvoice from "./OrderInvoice";

const ORDERS_PER_PAGE = 5;

const STATUS_LABELS = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  picked_up: "Picked Up",
};

const PAYMENT_METHOD_LABELS = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  cod: "Cash on Delivery",
};

function MyOrders() {
  const { API_URL } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [myReviews, setMyReviews] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewStates, setReviewStates] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [supportThreads, setSupportThreads] = useState({});
  const [supportDrafts, setSupportDrafts] = useState({});
  const [supportStates, setSupportStates] = useState({});

  const [reorderState, setReorderState] = useState({
    loading: false,
    orderId: null,
    message: "",
    type: "",
  });

  // Fetch one page of orders. Appends when loading more,
  // replaces when refreshing / retrying.
  const fetchOrders = useCallback(
    async (page, append) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/orders?page=${page}&limit=${ORDERS_PER_PAGE}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to load your orders."
        );

        if (!append) {
          setOrders([]);
          setPagination(null);
        }

        return;
      }

      // Load More appends — existing orders are kept
      setOrders((currentOrders) =>
        append
          ? [...currentOrders, ...(data.orders || [])]
          : data.orders || []
      );

      setPagination(data.pagination || null);
    } catch (fetchError) {
      console.error("Fetch orders error:", fetchError);

      setError(
        "Unable to reach the server. Please check your connection."
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
    },
    [API_URL]
  );

  // Initial load
  useEffect(() => {
    fetchOrders(1, false);
  }, [fetchOrders]);

  useEffect(() => {
    let cancelled = false;
    const fetchMyReviews = async () => {
      setReviewsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/reviews/mine`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load your reviews.");
        if (!cancelled) setMyReviews(data.reviews || []);
      } catch (error) {
        if (!cancelled) console.error("Fetch my reviews error:", error);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    fetchMyReviews();
    return () => { cancelled = true; };
  }, [API_URL]);


  const loadOrderSupport = useCallback(async (orderId) => {
    if (!orderId) return;
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/support`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load support messages.");
      setSupportThreads((current) => ({ ...current, [orderId]: data.requests || [] }));
      // A successful refresh should clear a previous transient load error.
      setSupportStates((current) => {
        const previous = current[orderId] || {};
        if (!previous.loadError) return current;
        const next = { ...previous };
        delete next.loadError;
        return { ...current, [orderId]: next };
      });
    } catch (error) {
      setSupportStates((current) => ({ ...current, [orderId]: { ...(current[orderId] || {}), loadError: error.message || "Unable to load support messages." } }));
    }
  }, [API_URL]);

  useEffect(() => {
    if (!expandedOrderId) return undefined;
    loadOrderSupport(expandedOrderId);
    const interval = window.setInterval(() => loadOrderSupport(expandedOrderId), 15000);
    return () => window.clearInterval(interval);
  }, [expandedOrderId, loadOrderSupport]);

  const submitOrderSupport = async (orderId) => {
    const message = String(supportDrafts[orderId] || "").trim();
    if (message.length < 10) {
      setSupportStates((current) => ({ ...current, [orderId]: { ...(current[orderId] || {}), submitError: "Please enter at least 10 characters." } }));
      return;
    }
    setSupportStates((current) => ({ ...current, [orderId]: { ...(current[orderId] || {}), sending: true, submitError: "" } }));
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/support`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "order", message }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to send your message.");
      // Show the server-confirmed request immediately, even if the follow-up
      // refresh temporarily fails. This avoids a successful send looking lost.
      if (data.request) {
        setSupportThreads((current) => {
          const existing = current[orderId] || [];
          const requestId = String(data.request.requestId || "");
          if (requestId && existing.some((request) => String(request.requestId) === requestId)) return current;
          return { ...current, [orderId]: [data.request, ...existing] };
        });
      }
      setSupportDrafts((current) => ({ ...current, [orderId]: "" }));
      setSupportStates((current) => ({ ...current, [orderId]: { ...(current[orderId] || {}), sending: false, submitError: "", notice: "Message sent. Replies will appear here." } }));
      await loadOrderSupport(orderId);
    } catch (error) {
      setSupportStates((current) => ({ ...current, [orderId]: { ...(current[orderId] || {}), sending: false, submitError: error.message || "Unable to send your message." } }));
    }
  };

  const handleReviewChange = (key, field, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [key]: { rating: 5, comment: "", ...(current[key] || {}), [field]: value },
    }));
  };

  const submitReview = async (order, item) => {
    const foodId = String(item.foodId || "");
    const key = `${order.id}:${foodId}`;
    const draft = { rating: 5, comment: "", ...(reviewDrafts[key] || {}) };
    setReviewStates((current) => ({ ...current, [key]: { loading: true, message: "", error: false } }));
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId, orderId: order.id, rating: Number(draft.rating), comment: draft.comment }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to submit review.");
      setMyReviews((current) => [...current, {
        ...(data.review || {}),
        id: data.review?.id || data.review?._id,
        foodId,
        orderId: String(order.id),
        rating: Number(draft.rating),
        comment: draft.comment.trim(),
      }]);
      setReviewStates((current) => ({ ...current, [key]: { loading: false, message: "Thank you! Your review was submitted.", error: false } }));
    } catch (error) {
      setReviewStates((current) => ({ ...current, [key]: { loading: false, message: error.message || "Unable to submit review.", error: true } }));
    }
  };

  const handleLoadMore = () => {
    if (!pagination || loadingMore) {
      return;
    }

    fetchOrders(pagination.page + 1, true);
  };

  const handleRetry = () => {
    fetchOrders(1, false);
  };

  const toggleExpanded = (id) => {
    setExpandedOrderId((current) =>
      current === id ? null : id
    );
  };

  const handleReorder = async (order) => {
    if (reorderState.loading) {
      return;
    }

    const orderItems = Array.isArray(order.items) ? order.items : [];

    if (!orderItems.length) {
      setReorderState({
        loading: false,
        orderId: null,
        message: "This order has no items available to reorder.",
        type: "warning",
      });
      return;
    }

    setReorderState({
      loading: true,
      orderId: order.id,
      message: "Checking item availability...",
      type: "loading",
    });

    try {
      const results = await Promise.all(
        orderItems.map(async (item) => {
          const foodId = item.foodId || item._id || item.id;

          if (!/^[a-f\d]{24}$/i.test(String(foodId || ""))) {
            return { available: false, reason: "invalid" };
          }

          try {
            const response = await fetch(
              API_URL + "/api/foods/" + foodId,
              { method: "GET" }
            );

            if (!response.ok) {
              return { available: false, reason: "deleted" };
            }

            const data = await response.json();

            if (!data.success || !data.food || data.food.isAvailable === false) {
              return { available: false, reason: "unavailable" };
            }

            return {
              available: true,
              food: data.food,
              item,
            };
          } catch (error) {
            console.error("Reorder availability check error:", error);
            return { available: false, reason: "error" };
          }
        })
      );

      const availableItems = results.filter((result) => result.available);
      const skippedCount = results.length - availableItems.length;

      availableItems.forEach(({ food, item }) => {
        addToCart(
          {
            _id: food._id,
            id: food._id,
            name: food.name,
            price: Number(food.price || 0),
            image: food.image || "",
            category: food.category || "",
          },
          Number(item.quantity || 1),
          item.cookingRequest || ""
        );
      });

      if (availableItems.length > 0) {
        setReorderState({
          loading: false,
          message:
            skippedCount > 0
              ? availableItems.length + " " +
                (availableItems.length === 1 ? "item" : "items") +
                " added to cart. " +
                skippedCount + " unavailable " +
                (skippedCount === 1 ? "item was" : "items were") +
                " skipped."
              : availableItems.length + " " +
                (availableItems.length === 1 ? "item" : "items") +
                " added to cart.",
          type: skippedCount > 0 ? "warning" : "success",
        });
      } else {
        setReorderState({
          loading: false,
          message:
            skippedCount > 0
              ? "None of the items in this order are currently available."
              : "No items could be added to cart.",
          type: "warning",
        });
      }
    } catch (error) {
      console.error("Reorder error:", error);
      setReorderState({
        loading: false,
        message: "Unable to check item availability. Nothing was added to cart.",
        type: "error",
      });
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) {
      return "";
    }

    return new Date(isoDate).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const hasMore =
    pagination &&
    pagination.page < pagination.totalPages;

  const normalizedSearch = orderSearch.trim().toLowerCase();

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (!normalizedSearch) return true;

    const searchableText = [
      order.orderNumber,
      order.status,
      ...(Array.isArray(order.items) ? order.items.map((item) => item.name) : []),
    ].filter(Boolean).join(" ").toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  useEffect(() => {
    if (!reorderState.message || reorderState.loading) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setReorderState({
        loading: false,
        orderId: null,
        message: "",
        type: "",
      });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [reorderState.message, reorderState.loading]);

  return (
    <section className="my-orders-section">
      <div className="my-orders-card">

        {/* HEADER */}

        <div className="my-orders-header">
          <div>
            <h2>My Orders</h2>

            <p>
              {pagination
                ? `${pagination.totalOrders} ${
                    pagination.totalOrders === 1
                      ? "order"
                      : "orders"
                  } placed`
                : "Your food order history"}
            </p>
          </div>

          <Link
            to="/menu"
            className="my-orders-order-link"
          >
            Order Food
          </Link>
        </div>


        {/* SEARCH & FILTER */}
        {!loading && !error && orders.length > 0 && (
          <div className="my-orders-toolbar">
            <div className="my-orders-search-wrap">
              <span className="my-orders-search-icon">⌕</span>
              <input
                type="search"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Search order number or food..."
                aria-label="Search orders"
              />
              {orderSearch && (
                <button type="button" className="my-orders-search-clear" onClick={() => setOrderSearch("")} aria-label="Clear order search">×</button>
              )}
            </div>

            <select
              className="my-orders-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter orders by status"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="my-orders-state">
            <div className="my-orders-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="my-orders-state">
            <div className="my-orders-state-icon">
              ⚠️
            </div>

            <p>{error}</p>

            <button
              type="button"
              className="my-orders-retry"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPTY */}

        {!loading && !error && orders.length === 0 && (
          <div className="my-orders-state">
            <div className="my-orders-state-icon">
              🛍️
            </div>

            <p>
              No orders yet. Browse the menu and place
              your first order!
            </p>

            <Link
              to="/menu"
              className="my-orders-retry"
            >
              Order Food
            </Link>
          </div>
        )}

        {/* LIST */}

        {!loading && !error && orders.length > 0 && (
          <>
            <div className="my-orders-list">
              {filteredOrders.map((order) => {
                const isExpanded =
                  expandedOrderId === order.id;

                const itemCount = order.items.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0
                );

                return (
                  <div
                    className="my-orders-item"
                    key={order.id}
                  >
                    {/* ROW */}

                    <button
                      type="button"
                      className="my-orders-row"
                      onClick={() =>
                        toggleExpanded(order.id)
                      }
                      aria-expanded={isExpanded}
                    >
                      <span className="my-orders-row-icon">
                        🧾
                      </span>

                      <span className="my-orders-row-info">
                        <strong>
                          {order.orderNumber}
                        </strong>

                        <small>
                          {formatDate(order.createdAt)}
                          {" · "}
                          {itemCount}{" "}
                          {itemCount === 1
                            ? "item"
                            : "items"}
                        </small>
                      </span>

                      <span
                        className={`my-orders-badge my-orders-badge-${order.status}`}
                      >
                        {STATUS_LABELS[order.status] ||
                          order.status}
                      </span>

                      <span className="my-orders-row-total">
                        ₹
                        {(
                          order.pricing?.grandTotal ?? 0
                        ).toFixed(2)}
                      </span>

                      <span
                        className={`my-orders-chevron ${
                          isExpanded ? "open" : ""
                        }`}
                      >
                        ›
                      </span>
                    </button>

                    {/* EXPANDED DETAILS */}

                    {isExpanded && (
                      <div className="my-orders-details">
                        {/* ITEMS */}

                        <div className="my-orders-items">
                          {order.items.map(
                            (item, index) => (
                              <div
                                className="my-orders-item-line"
                                key={`${order.id}-${
                                  item.foodId || index
                                }`}
                              >
                                {item.image ? (
                                  <img className="my-orders-item-image" src={item.image} alt="" loading="lazy" />
                                ) : (
                                  <div className="my-orders-item-image my-orders-item-image-placeholder">🍽️</div>
                                )}
                                <span className="item-line-name">
                                  <strong>
                                    {item.quantity} ×{" "}
                                    {item.name}
                                  </strong>

                                  {item.cookingRequest && (
                                    <small>
                                      Cooking request:{" "}
                                      {item.cookingRequest}
                                    </small>
                                  )}
                                </span>

                                <strong className="item-line-total">
                                  ₹
                                  {(
                                    item.price *
                                    item.quantity
                                  ).toFixed(2)}
                                </strong>
                              </div>
                            )
                          )}
                        </div>

                        {/* PRICING */}

                        <div className="my-orders-pricing">
                          <div>
                            <span>Subtotal</span>
                            <strong>
                              ₹
                              {(
                                order.pricing?.subtotal ??
                                0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          {(order.pricing?.discount ??
                            0) > 0 && (
                            <div className="discount">
                              <span>
                                Discount
                                {order.pricing
                                  .couponCode
                                  ? ` (${order.pricing.couponCode})`
                                  : ""}
                              </span>
                              <strong>
                                -₹
                                {order.pricing.discount.toFixed(
                                  2
                                )}
                              </strong>
                            </div>
                          )}

                          <div>
                            <span>Delivery</span>
                            <strong>
                              {order.pricing
                                ?.deliveryFee === 0
                                ? "FREE"
                                 : `₹${(
                                    order.pricing
                                      ?.deliveryFee ?? 0
                                  ).toFixed(2)}`}
                            </strong>
                          </div>

                          <div>
                            <span>Service Fee</span>
                            <strong>
                              ₹
                              {(
                                order.pricing
                                  ?.serviceFee ?? 0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          <div>
                            <span>Tax</span>
                            <strong>
                              ₹
                              {(
                                order.pricing?.tax ?? 0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          <div className="grand">
                            <span>Total</span>
                            <strong>
                              ₹
                              {(
                                order.pricing
                                  ?.grandTotal ?? 0
                              ).toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* META */}

                        <div className="my-orders-meta">
                          <span>
                            💳{" "}
                            {PAYMENT_METHOD_LABELS[
                              order.paymentMethod
                            ] || order.paymentMethod}
                          </span>

                          <span>
                            {order.deliveryType ===
                            "pickup"
                              ? "🏪 Pickup order"
                              : "🛵 Delivery order"}
                          </span>

                          <div className="my-orders-actions">
                            <Link
                              to={`/order-success/${order.id}`}
                              className="my-orders-view-link"
                            >
                              View Details →
                            </Link>

                            <button
                              type="button"
                              className="my-orders-invoice"
                              onClick={() => setInvoiceOrder(order)}
                            >
                              Invoice / Print
                            </button>

                            <button
                              type="button"
                              className="my-orders-reorder"
                              onClick={() => handleReorder(order)}
                            >
                              {reorderState.loading && reorderState.orderId === order.id
                                ? "Checking..."
                                : reorderState.type === "success" && reorderState.orderId === order.id
                                  ? "Added to Cart ✓"
                                  : "Reorder"}
                            </button>
                          </div>
                        </div>


                        <section className="my-order-support" aria-label="Order support conversation">
                          <div className="my-order-support-heading">
                            <div>
                              <h3>Order help & support</h3>
                              <p>Send a message about this order and check replies here.</p>
                            </div>
                            <span className="my-order-support-live">Updates automatically</span>
                          </div>
                          {(supportThreads[order.id] || []).length === 0 ? (
                            <p className="my-order-support-empty">No support messages for this order yet.</p>
                          ) : (
                            <div className="my-order-support-thread">
                              {(supportThreads[order.id] || []).map((request) => (
                                <article className="my-order-support-message" key={request.requestId}>
                                  <div className="my-order-support-message-meta">
                                    <strong>{request.subject === "order" ? "Order support" : request.subject}</strong>
                                    <span className={"my-order-support-status status-" + request.status}>{request.status.replace("-", " ")}</span>
                                    <time>{formatDate(request.createdAt)}</time>
                                  </div>
                                  <p className="my-order-support-customer-message">{request.message}</p>
                                  {request.adminReply ? (
                                    <div className="my-order-support-reply">
                                      <strong>FoodApp support replied</strong>
                                      <p>{request.adminReply}</p>
                                      <time>Updated {formatDate(request.updatedAt)}</time>
                                    </div>
                                  ) : (
                                    <p className="my-order-support-pending">Our team has not replied yet.</p>
                                  )}
                                </article>
                              ))}
                            </div>
                          )}
                          {supportStates[order.id]?.loadError && <p className="my-order-support-error" role="status">{supportStates[order.id].loadError}</p>}
                          <label className="my-order-support-compose">
                            <span>What do you need help with?</span>
                            <textarea
                              rows={3}
                              maxLength={3000}
                              minLength={10}
                              value={supportDrafts[order.id] || ""}
                              onChange={(event) => setSupportDrafts((current) => ({ ...current, [order.id]: event.target.value }))}
                              placeholder="Describe the issue with this order (at least 10 characters)…"
                              disabled={Boolean(supportStates[order.id]?.sending)}
                            />
                          </label>
                          {supportStates[order.id]?.submitError && <p className="my-order-support-error" role="alert">{supportStates[order.id].submitError}</p>}
                          {supportStates[order.id]?.notice && <p className="my-order-support-success" role="status">{supportStates[order.id].notice}</p>}
                          <button type="button" className="my-order-support-send" onClick={() => submitOrderSupport(order.id)} disabled={Boolean(supportStates[order.id]?.sending)}>
                            {supportStates[order.id]?.sending ? "Sending…" : "Send to support"}
                          </button>
                        </section>

                        {["delivered", "picked_up"].includes(order.status) && (
                          <section className="my-order-reviews" aria-label="Review ordered food">
                            <h3>Ratings & Reviews</h3>
                            <p>Share feedback on food from this completed order.</p>
                            {order.items.filter((item) => /^[a-f\d]{24}$/i.test(String(item.foodId || ""))).map((item) => {
                              const foodId = String(item.foodId);
                              const key = `${order.id}:${foodId}`;
                              const alreadyReviewed = myReviews.some((review) => String(review.orderId) === String(order.id) && String(review.foodId) === foodId);
                              const draft = { rating: 5, comment: "", ...(reviewDrafts[key] || {}) };
                              const state = reviewStates[key] || {};
                              return (
                                <form className="my-order-review-form" key={key} onSubmit={(event) => { event.preventDefault(); submitReview(order, item); }}>
                                  <strong>{item.name}</strong>
                                  {alreadyReviewed ? (
                                    <p className="my-order-review-success">✓ Reviewed — {myReviews.find((review) => String(review.orderId) === String(order.id) && String(review.foodId) === foodId)?.rating || ""} ★</p>
                                  ) : (
                                    <>
                                      <label>
                                        Rating
                                        <select value={draft.rating} onChange={(event) => handleReviewChange(key, "rating", event.target.value)} disabled={state.loading}>
                                          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}
                                        </select>
                                      </label>
                                      <label>
                                        Comment (optional)
                                        <textarea value={draft.comment} maxLength={500} rows={3} placeholder="What did you think of this food?" onChange={(event) => handleReviewChange(key, "comment", event.target.value)} disabled={state.loading} />
                                      </label>
                                      <button type="submit" disabled={state.loading || reviewsLoading}>
                                        {state.loading ? "Submitting…" : "Submit review"}
                                      </button>
                                      {state.message && <p className={state.error ? "my-order-review-error" : "my-order-review-success"} role="status">{state.message}</p>}
                                    </>
                                  )}
                                </form>
                              );
                            })}
                            {order.items.every((item) => !/^[a-f\d]{24}$/i.test(String(item.foodId || ""))) && <p>Reviews are unavailable for items without a valid food record.</p>}
                          </section>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="my-orders-filter-empty">
                <div>🔎</div>
                <strong>No matching orders</strong>
                <p>Try another order number, food name, or status.</p>
                <button type="button" onClick={() => { setOrderSearch(""); setStatusFilter("all"); }}>
                  Clear Filters
                </button>
              </div>
            )}

            {/* LOAD MORE */}

            {hasMore && (
              <div className="my-orders-footer">
                <button
                  type="button"
                  className="my-orders-load-more"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? "Loading..."
                    : "Load More Orders"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {invoiceOrder && <OrderInvoice order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}

      {reorderState.message && (
        <div className={"my-orders-reorder-toast my-orders-reorder-toast-" + reorderState.type} role="status">
          <span className="my-orders-reorder-toast-icon">
            {reorderState.type === "success" ? "✓" : reorderState.type === "loading" ? "…" : "!"}
          </span>
          <span className="my-orders-reorder-toast-message">
            {reorderState.message}
          </span>
          {reorderState.type !== "loading" && (
            <button
              type="button"
              className="my-orders-reorder-toast-action"
              onClick={() => navigate("/cart")}
            >
              View Cart
            </button>
          )}
          <button
            type="button"
            className="my-orders-reorder-toast-close"
            aria-label="Close"
            onClick={() =>
              setReorderState({
                loading: false,
                orderId: null,
                message: "",
                type: "",
              })
            }
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}

export default MyOrders;